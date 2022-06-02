const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);
const { path } = Runtime.getFunctions()["authentication-helper"];
const { AuthedHandler } = require(path);
const staticPath = Runtime.getFunctions()["seeding/static"].path;
const { customFields } = require(staticPath);
const sObjectspath = Runtime.getFunctions()["seeding/sobject"].path;
const { deleteCustomFields, deleteRecords } = require(sObjectspath);
const seedingHelperPath = Runtime.getFunctions()["seeding/helpers"].path;
const { runSOQL } = require(seedingHelperPath);
const accountsSOQL = "SELECT Id FROM Account LIMIT 200";
const contactsSOQL = "SELECT Id FROM Contact LIMIT 200";
const casesSOQL = "SELECT Id FROM Case LIMIT 200";
const opportunitiesSOQL = "SELECT Id FROM Opportunity LIMIT 200";
const entitlementsSOQL = "SELECT Id FROM Entitlement LIMIT 200";

/** Wipes SF account by deleting all default and custom Entitlements, Opportunities, Cases, Accounts, Contacts and custom fields. */
exports.handler = AuthedHandler(async (context, event, callback)=> {
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);

  try {
    
    const accounts = await runSOQL(connection, accountsSOQL);
    const contacts = await runSOQL(connection, contactsSOQL);
    const cases = await runSOQL(connection, casesSOQL);
    const opportunities = await runSOQL(connection, opportunitiesSOQL);
    const entitlements = await runSOQL(connection, entitlementsSOQL);

    const accountsIds = accounts.records.map((record) => record.Id);
    const contactsIds = contacts.records.map((record) => record.Id);
    const caseIds = cases.records.map((record) => record.Id);
    const opportunitiesIds = opportunities.records.map((record) => record.Id);
    const entitlementsIds = entitlements.records.map((record) => record.Id);

    await Promise.all([
      deleteRecords(connection, "Entitlement", entitlementsIds),
      deleteRecords(connection, "Case", caseIds),
      deleteRecords(connection, "Opportunity", opportunitiesIds),
    ]);

    const accountsDeletionResult = await deleteRecords(
      connection,
      "Account",
      accountsIds
    );

    /**
     * All contacts associated with the deleted accounts in the previous step will have been automatically deleted;
     * this step clears any contacts that do not have accounts assocaited with them.
     */
    const contactsDeletionResult = await deleteRecords(
      connection,
      "Contact",
      contactsIds
    );

    const numAccountsDeleted = accountsDeletionResult.filter(
      (record) => record.success
    );
    const numContactsDeleted = contactsDeletionResult.filter(
      (record) => record.success
    );

    await deleteCustomFields(connection, customFields);

    response.setBody({
      error: false,
    });
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: "Server Error." });
  }

  return callback(null, response);
})
