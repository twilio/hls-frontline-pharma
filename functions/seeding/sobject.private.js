const helpersPath = Runtime.getFunctions()["helpers"].path;
const { getParam } = require(helpersPath);

/** Creates custom sObject fields. */
exports.addCustomFieldsAndPermissions = async function (
  context,
  connection,
  payload
) {
  const version = "v53.0";
  const endpoint = await getParam(context, "SFDC_INSTANCE_URL");

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.setStatusCode(200);

  /**
   * event.payload should look like this:
   *
   * event.payload = [
   * {sObjectName: <sObjectName>,
   * fields: [
   *  <fieldName1>,
   *  <fieldName2>,
   *  ...
   * ]}
   * ]
   */

  try {
    const res = await new Promise(async (resolve, reject) => {
      payload.forEach(async (item) => {
        const createFieldsResult = await createCustomFields(
          connection,
          version,
          endpoint,
          item.sObjectName,
          item.fields
        );

        const setPermissionsResult = await setPermissionsForFields(
          connection,
          version,
          endpoint,
          "System Administrator",
          item.sObjectName,
          item.fields
        );

        const combinedResponse = createFieldsResult.compositeResponse.concat(
          setPermissionsResult.compositeResponse
        );

        const failedItems = combinedResponse.filter(
          ({ httpStatusCode }) => httpStatusCode != 200 && httpStatusCode != 201
        );
        if (failedItems.length > 0)
          reject(`${failedItems.length} items failed to upload`);
        resolve();
      });
    })
      .then((resp) => {
        return {
          error: false,
          result: `Successfully created custom fields.`,
        };
      })
      .catch((err) => {
        console.log(err);
        return {
          error: true,
          errorObject: "Bad request.",
        };
      });
    return res;
  } catch (err) {
    console.log(err);
    return { error: true, errorObject: new Error("Server error.") };
  }
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
          length: 128,
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

exports.bulkUploadSObjects = async function (
  context,
  version = "v53.0",
  endpoint,
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

/** Deletes a set of custom fields on a set of sObjects */
exports.deleteCustomFields = async function (connection, customFields) {
  const promises = customFields.map(async (set) => {
    return new Promise((resolve, reject) => {
      try {
        const fullNames = set.fields.map(
          (name) => `${set.sObjectName}.${name}__c`
        );
        connection.metadata.delete("CustomField", fullNames, (err, output) => {
          if (err) {
            console.log(err);
            reject({ error: true, errorObject: err });
          }

          resolve({ error: false });
        });
      } catch (err) {
        reject({ error: true, errorObject: err });
      }
    });
  });

  const results = await Promise.all(promises);

  return results;
};

exports.deleteRecords = async function (connection, objectName, ids) {
  return new Promise((resolve, reject) => {
    connection.delete(objectName, ids, {}, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
};
