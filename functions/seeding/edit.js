const { path } = Runtime.getFunctions()["authentication-helper"];
const { AuthedHandler } = require(path);
const parseSObjectsPath = Runtime.getFunctions()["seeding/parsing"].path;
const { readCsv, writeCsv } = require(parseSObjectsPath);
const datastoreHelpersPath = Runtime.getFunctions()["datastore-helpers"].path;
const {
  listSyncDocuments,
  selectSyncDocument,
  upsertSyncDocument,
} = require(datastoreHelpersPath);
const helpersPath = Runtime.getFunctions()["helpers"].path;
const { getParam } = require(helpersPath);

/**
 * File handles editing and updating of csv (templates)
 */
exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);

  try {
    const syncSid = await getParam(context, "SYNC_SID");
    switch (event.cmd) {
      case "read-all":
        {
          const requestedDocNames = event.files.split(","); //need to split urlencoded array back into js array
          const promises = requestedDocNames.map((docName) =>
            selectSyncDocument(context, syncSid, docName)
          );
          const promiseResult = await Promise.all(promises);
          const result = promiseResult.map((res, index) => {
            return {
              [requestedDocNames[index]]: res.data,
            };
          });
          response.setBody({
            error: false,
            result,
          });
        }
        return callback(null, response);
      case "list": {
        const docs = await listSyncDocuments(context, syncSid);
        const syncDocNames = docs
          .filter((doc) => doc.uniqueName.includes("Template") || doc.uniqueName.includes("List"))
          .map((doc) => doc.uniqueName);
        response.setBody({ error: false, result: syncDocNames });
        return callback(null, response);
      }
      case "update": {
        await upsertSyncDocument(context, syncSid, event.name, {
          data: JSON.parse(event.data),
        });
        response.setBody({ error: false });
        return callback(null, response);
      }
      default: {
        console.log("No cmd provided in event.");
        break;
      }
    }
  } catch (err) {
    console.error(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: "Server Error." });
  }

  return callback(null, response);
};
