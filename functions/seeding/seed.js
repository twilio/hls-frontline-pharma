const accountsDataPath = Runtime.getAssets()["/accounts_data.csv"].path;
const contactsDataPath = Runtime.getAssets()["/contacts_data.csv"].path;
const templatesDataPath = Runtime.getAssets()["/templates_data.csv"].path;
const conversationDataPath = Runtime.getAssets()["/conversation_data.csv"].path;
const staticPath = Runtime.getFunctions()["seeding/static"].path;
const helperPath = Runtime.getFunctions()["helpers"].path;
const { getParam } = require(helperPath);
const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { path } = Runtime.getFunctions()["authentication-helper"];
const { AuthedHandler } = require(path);
const parseSObjectsPath = Runtime.getFunctions()["seeding/parsing"].path;
const sobjectPath = Runtime.getFunctions()["seeding/sobject"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);
const {
  readCsv,
  parseAccountsForCompositeApi,
  parseContactsForCompositeApi,
  parseTemplates,
  parseChatHistory,
} = require(parseSObjectsPath);
const { customFields, BLOCKED_WORDS, UNAPPROVED_WORDS } = require(staticPath);
const {
  bulkUploadSObjects,
  addCustomFieldsAndPermissions,
} = require(sobjectPath);
const {
  selectSyncDocument,
  upsertSyncDocument,
  listSyncDocuments,
} = require(Runtime.getFunctions()["datastore-helpers"].path);

/**
 * This will seed the Salesforce Frontline data. To seed Salesforce out of Twilio Sync, set event.type==="sync", otherwise, to seed from CSV data, set event.type==="reseed"
 */
exports.handler = AuthedHandler(async (context, event, callback) => {
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);
  try {
    if (!event.type) {
      response.setStatusCode(400);
      response.setBody({
        error: true,
        errorObject: "No event.type was set. Options are reseed, sync",
      });
      return callback(null, response);
    }

    const syncSid = await getParam(context, "SYNC_SID");

    //guard against trying to sync Sync to SF and the documents dont exist
    if (event.type === "sync") {
      //async function listSyncDocuments(context, syncServiceSid, limit = 20) {
      const docs = await listSyncDocuments(context, syncSid);
      const docsExist =
        docs.find((doc) => doc.uniqueName === "Accounts_Template") &&
        docs.find((doc) => doc.uniqueName === "Contacts_Template") &&
        docs.find((doc) => doc.uniqueName === "Chat_Template");

      if (!docsExist) {
        response.setStatusCode(400);
        response.setBody({
          error: true,
          errorObject:
            "Could not sync Twilio Sync and Salesforce since there are missing Sync documents.",
        });
        return callback(null, response);
      }
    }

    if (event.type === "reseed") await partialSeedSync(context, syncSid);

    const endpoint = await getParam(context, "SFDC_INSTANCE_URL");

    const res = await addCustomFieldsAndPermissions(
      context,
      connection,
      customFields
    );

    if (res.error) {
      response.setBody({
        error: true,
        errorObject: "Could not set custom fields.",
      });
      response.setStatusCode(400);
      return callback(null, response);
    }

    const accountsData =
      event.type === "reseed"
        ? await readCsv(accountsDataPath)
        : (await selectSyncDocument(context, syncSid, "Accounts_Template"))
            .data;
    const contactsData =
      event.type === "reseed"
        ? await readCsv(contactsDataPath)
        : (await selectSyncDocument(context, syncSid, "Contacts_Template"))
            .data;
    const chatData =
      event.type === "reseed"
        ? await readCsv(conversationDataPath)
        : (await selectSyncDocument(context, syncSid, "Chat_Template")).data;

    //parse csv data
    const parsedAccounts = parseAccountsForCompositeApi(accountsData);
    const accountUploadResult = await bulkUploadSObjects(
      context,
      "v53.0",
      endpoint,
      connection,
      parsedAccounts,
      true
    );

    //Return 400 if user has duplicate accounts (SalesForce enforces no duplicate records.)
    if (
      accountUploadResult.error ||
      (accountUploadResult.result &&
        accountUploadResult.result.find((record) => !record.success))
    ) {
      console.log(accountUploadResult);
      response.setStatusCode(400);
      response.setBody({
        error: true,
        result:
          "There was an error uploading at least one account to SalesForce.",
      });
      return callback(null, response);
    }

    //Map each Account to its id returned from SF
    const accountMap = accountsData.map((record, index) => {
      return {
        name: record.AccountName,
        sfId: accountUploadResult.result[index].id,
      };
    });

    //Assigns an Account to each Contact
    const parsedContacts = parseContactsForCompositeApi(
      contactsData,
      accountMap
    );

    //Upload Contact SObjects to SF
    const contactUploadResult = await bulkUploadSObjects(
      context,
      "v53.0",
      endpoint,
      connection,
      parsedContacts,
      true
    );

    //Return 400 if user has duplicate accounts (SalesForce enforces no duplicate records.)
    if (
      contactUploadResult.error ||
      (contactUploadResult.result &&
        contactUploadResult.result.find((record) => !record.success))
    ) {
      console.log(contactUploadResult);
      response.setStatusCode(400);
      response.setBody({
        error: true,
        errorObject: new Error(
          "There was an error uploading at least one contact to SalesForce."
        ),
      });
      return callback(null, response);
    }

    //Map the returned SF ids to their relevant contact
    const contactsMap = contactsData.map((record, index) => {
      return {
        name: `${record.FirstName} ${record.LastName}`,
        sfId: contactUploadResult.result[index].id,
      };
    });

    //begin uploading conversation history
    const chatHistory = parseChatHistory(chatData, contactsMap);

    //Upload Contact SObjects to SF
    const chatUploadResult = await bulkUploadSObjects(
      context,
      "v53.0",
      endpoint,
      connection,
      chatHistory,
      true
    );

    if (chatUploadResult.error) {
      console.log(chatUploadResult);
      response.setStatusCode(400);
      response.setBody({
        error: true,
        result: "An error occurred seeding chat data.",
      });
    }

    //Upload data from a reseed to sync
    if (event.type === "reseed") {
      await upsertSyncDocument(context, syncSid, "Accounts_Template", {
        data: accountsData,
      });
      await upsertSyncDocument(context, syncSid, "Contacts_Template", {
        data: contactsData,
      });
      await upsertSyncDocument(context, syncSid, "Chat_Template", {
        data: chatData,
      });
    }

    response.setStatusCode(200);
    response.setBody({ error: false, result: "Succesfully seeded data." });
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: new Error("Server error.") });
  }

  return callback(null, response);
});

exports.makeTemplateArray = async function (context, customerDetails) {
  try {
    const syncSid = await getParam(context, "SYNC_SID");
    const { data } = await selectSyncDocument(
      context,
      syncSid,
      "Templates_Template"
    );

    return parseTemplates(data, customerDetails);
  } catch (err) {
    console.log(`Could not get templates, using defaults: ${err.message}`);
    console.error(err);
    return [
      {
        display_name: "Meeting Reminders",
        templates: [
          { content: "Default message" },
          { content: "Default message 2" },
        ],
      },
    ];
  }
};

/** Adds blocked content, unapproved content, and templates to sync. Note: Accounts, Contacts and History are seeded elsewhere since they are interrelated. */
async function partialSeedSync(context, syncSid) {
  const templates = await readCsv(templatesDataPath);

  const addBlockedContentPromise = upsertSyncDocument(
    context,
    syncSid,
    "BlockedWords_List",
    { data: BLOCKED_WORDS }
  );
  const addUnapprovedContentPromise = upsertSyncDocument(
    context,
    syncSid,
    "UnapprovedContent_List",
    { data: UNAPPROVED_WORDS }
  );
  const addTemplatesPromise = upsertSyncDocument(
    context,
    syncSid,
    "Templates_Template",
    { data: templates }
  );

  const promises = [
    addBlockedContentPromise,
    addUnapprovedContentPromise,
    addTemplatesPromise,
  ];

  await Promise.all(promises);
}
