const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);

/** Creates custom sObjects. */
exports.handler = async function (context, event, callback) {
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;

  const version = context.SF_VERSION ?? "v53.0";
  const endpoint = context.SFDC_INSTANCE_URL;

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.setStatusCode(200);

  //TODO: Wire up all non SF fields from CSV for Accounts and Contacts
  try {

    const customAccountFields = ["test", "test2"]

    const createFieldsResult = await createCustomFields(
      connection,
      version,
      endpoint,
      "Account",
      customAccountFields
    ); 

    const setPermissionsResult = await setPermissionsForFields(
      connection,
      version,
      endpoint,
      "System Administrator",
      "Account",
      customAccountFields
    ); 

    response.setBody({
      error: false,
      result: `Successfully created custom fields ${customAccountFields}`,
    });
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody("Server error.");
  }

  return callback(null, response);
};

exports.bulkUploadSObjects = async function (
  context,
  connection,
  records,
  allOrNone = true
) {

  const body = {
    allOrNone,
    records: records,
  };
  try {
    const res = await connection.requestPost(
      `${endpoint}/services/data/${version}/composite/sobjects`,
      body
    );
    return { error: false, result: res };
  } catch (err) {
    console.log(err);
    return { error: true, errorObject: err };
  }
};


async function createCustomFields(
  connection,
  version = "v53.0",
  endpoint,
  sObjectName,
  fieldNames
) {
  const requests = fieldNames.map((name) => {
    return {
      method: "POST",
      url: `/services/data/${version}/tooling/sobjects/CustomField`,
      body: {
        FullName: `${sObjectName}.${name}__c`,
        Metadata: {
          label: name,
          description: `Description for field ${name}`,
          required: false,
          externalId: false,
          type: "Text",
          length: 32,
        },
      },
      referenceId: `${sObjectName}_${name}`,
    };
  });

  return new Promise((resolve, reject) => {
    connection.requestPost(
      `${endpoint}/services/data/${version}/tooling/composite`,
      {
        allOrNone: false,
        compositeRequest: requests,
      },
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
}

/**
 *
 * @param {*} connection jsForce connection object
 * @param {*} version The version of the SalesFroce API to use (default 53.0)
 * @param {*} endpoint Your SalesForce instance URL
 * @param {*} profileName The SF profile name, i.e. "System Administrator"
 * @param {*} sObjectName The sObject the custom field belongs to.
 * @param {*} fieldNames A list of custom fields having their permissions opened.
 */
async function setPermissionsForFields(
  connection,
  version = "v53.0",
  endpoint,
  profileName = "System Administrator",
  sObjectName,
  fieldNames
) {
  const fieldPermissions = fieldNames.map((name, index) => {
    return {
      referenceId: `NewFieldPermission_${index}`,
      body: {
        ParentId: "@{PermissionSet.records[0].Id}",
        SobjectType: sObjectName,
        Field: `${sObjectName}.${name}__c`,
        PermissionsEdit: "true",
        PermissionsRead: "true",
      },
      url: `/services/data/${version}/sobjects/FieldPermissions/`,
      method: "POST",
    };
  });

  const requests = [
    {
      referenceId: "Profile",
      url: `/services/data/${version}/query/?q=SELECT+Id+FROM+Profile+Where+Name='${profileName}'`,
      method: "GET",
    },
    {
      referenceId: "PermissionSet",
      url: `/services/data/${version}/query/?q=SELECT+Id+FROM+PermissionSet+WHERE+ProfileId='@{Profile.records[0].Id}'`,
      method: "GET",
    },
  ];

  return new Promise((resolve, reject) => {
    connection.requestPost(
      `${endpoint}/services/data/${version}/composite`,
      {
        allOrNone: true,
        compositeRequest: requests.concat(fieldPermissions),
      },
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
}
