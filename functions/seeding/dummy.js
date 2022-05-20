const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);

exports.handler = async function (context, event, callback) {
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;

  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.setStatusCode(200);

  try {
    const sObjectName = "Contact";
    const fieldsToDelete = ["Website", "Whatsapp"];
    const result = await new Promise((resolve, reject) => {
      connection.tooling
        .delete("CustomField", "00N8b00000EWqN5EAL", {}, (err, result) => {
          if (err) reject(err);
          resolve({
            error: false,
            result,
          });
        });
    });
    /*       connection.tooling.query(getActiveCustomFieldsSoql, {}, (err, result) => {
        if (err) reject(err);
        resolve(
          result.records.map(({ Id, DeveloperName }) => {
            return {
              id: Id,
              fieldName: DeveloperName,
            };
          })
        );
      }); 
    }); 
    */

    response.setBody({ error: false, result });
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: "Server Error." });
  }

  return callback(null, response);
};
