const accountsDataPath = Runtime.getAssets()["/accounts_data.csv"].path;
const contactsDataPath = Runtime.getAssets()["/contacts_data.csv"].path;
const templatesDataPath = Runtime.getAssets()["/templates_data.csv"].path;
const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const parseSObjectsPath = Runtime.getFunctions()["seeding/parsing"].path;
const sobjectPath = Runtime.getFunctions()["seeding/sobject"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);
const {
  readCsv,
  parseAccountsForCompositeApi,
  parseContactsForCompositeApi,
  parseTemplates,
} = require(parseSObjectsPath);
const { bulkUploadSObjects } = require(sobjectPath);

exports.handler = async function (context, event, callback) {
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;

  // Read data out of CSVs
  // Parse CSVs into SF schema
  // Upload

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.setStatusCode(200);
  try {
    //read csv data
    const accountsData = await readCsv(accountsDataPath);
    const contactsData = await readCsv(contactsDataPath);

    //parse csv data
    const parsedAccounts = parseAccountsForCompositeApi(accountsData);
    const accountUploadResult = await bulkUploadSObjects(
      context,
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
      response.setBody(
        "There was an error uploading at least one account to SalesForce."
      );
      return callback(null, response);
    }

    const accountMap = accountsData.map((record, index) => {
      return {
        name: record.AccountName,
        sfId: accountUploadResult.result[index].id,
      };
    });

    const parsedContacts = parseContactsForCompositeApi(
      contactsData,
      accountMap
    );

    const contactUploadResult = await bulkUploadSObjects(
      context,
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
      response.setBody(
        "There was an error uploading at least one contact to SalesForce."
      );
      return callback(null, response);
    }

    response.setStatusCode(200);
    response.setBody(contactUploadResult);
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody("Server error.");
  }

  return callback(null, response);
};

exports.makeTemplateArray = async function () {
  try {
    const templatesData = await readCsv(templatesDataPath);
    return parseTemplates(templatesData);
  } catch (err) {
    console.log(`Could not get templates, using defaults: ${err.message}`);
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
