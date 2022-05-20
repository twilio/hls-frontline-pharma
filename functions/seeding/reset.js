const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);
const staticPath = Runtime.getFunctions()["seeding/static"].path;
const { customFields } = require(staticPath);
const sObjectspath = Runtime.getFunctions()["seeding/sobject"].path;
const { deleteCustomFields } = require(sObjectspath);
const accountsSOQL = "SELECT Id FROM Account LIMIT 200";
const contactsSOQL = "SELECT Id FROM Contact LIMIT 200";
const casesSOQL = "SELECT Id FROM Case LIMIT 200";
const opportunitiesSOQL = "SELECT Id FROM Opportunity LIMIT 200";
const entitlementsSOQL = "SELECT Id FROM Entitlement LIMIT 200";

/** Wipes SF account by deleting all default and custom Entitlements, Opportunities, Cases, Accounts, Contacts and custom fields. */
exports.handler = async function (context, event, callback) {
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
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

    const entitlementsDeletionResult = await deleteRecords(
      connection,
      "Entitlement",
      entitlementsIds
    );

    const casesDeletionResult = await deleteRecords(
      connection,
      "Case",
      caseIds
    );

    const opportunitiesDeletionResult = await deleteRecords(
      connection,
      "Opportunity",
      opportunitiesIds
    );

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

    const customFieldDeletionResult = await deleteCustomFields(
      connection,
      customFields
    );

    const deletionMessage = `Deleted ${numAccountsDeleted.length} accounts and ${numContactsDeleted.length} contacts not associated with any accounts.`;

    response.setBody({
      error: false,
      result: deletionMessage,
    });
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: "Server Error." });
  }

  return callback(null, response);
};

async function runSOQL(connection, SOQL) {
  return new Promise((resolve, reject) => {
    connection.query(SOQL, function (err, result) {
      if (err) reject(err);
      resolve(result); //Check result.totalSize and result.records.length
    });
  });
}

async function deleteRecords(connection, objectName, ids) {
  return new Promise((resolve, reject) => {
    connection.delete(objectName, ids, {}, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
}
