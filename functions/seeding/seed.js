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
  wipeSync,
} = require(Runtime.getFunctions()["datastore-helpers"].path);

/** Reads Account, Contact, and Conversation data out of CSVs and parses them into SObject format, */
exports.handler = async (context, event, callback) => {
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;

  // Read data out of CSVs
  // Parse CSVs into SF schema
  // Upload

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);
  try {
    const syncSid = await getParam(context, "SYNC_SID");
    await resetAndSeedSync(context, syncSid);

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

    //read csv data
    const accountsData = await readCsv(accountsDataPath);
    const contactsData = await readCsv(contactsDataPath);
    const chatData = await readCsv(conversationDataPath);

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
      response.setStatusCode(400);
      response.setBody({
        error: true,
        result: "An error occurred seeding chat data.",
      });
    }

    //Begin uploading data to Sync
    const syncAccounts = parsedAccounts.map(
      ({ attributes, ...remainder }) => remainder
    );
    await upsertSyncDocument(context, syncSid, "Accounts_Template", {
      data: syncAccounts,
    });
    const syncContacts = parsedContacts.map(
      ({ attributes, ...remainder }) => remainder
    );
    await upsertSyncDocument(context, syncSid, "Contacts_Template", {
      data: syncContacts,
    });
    const syncChat = chatHistory.map(
      ({ attributes, ...remainder }) => remainder
    );
    await upsertSyncDocument(context, syncSid, "Chat_Template", {
      data: syncChat,
    });
    //end uploading data to sync

    response.setStatusCode(200);
    response.setBody({ error: false, result: "Succesfully seeded data." });
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: new Error("Server error.") });
  }

  return callback(null, response);
};

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
    console.error(err)
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
async function resetAndSeedSync(context, syncSid) {
  await wipeSync(context, syncSid);

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
