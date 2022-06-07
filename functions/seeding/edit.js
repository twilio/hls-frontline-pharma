const { path } = Runtime.getFunctions()["authentication-helper"];
const { AuthedHandler } = require(path);
const parseSObjectsPath = Runtime.getFunctions()["seeding/parsing"].path;
const { readCsv, writeCsv } = require(parseSObjectsPath);
const datastoreHelpersPath = Runtime.getFunctions()["datastore-helpers"].path;
const { listSyncDocuments } = require(datastoreHelpersPath);
const helpersPath = Runtime.getFunctions()["helpers"].path;
const { getParam } = require(helpersPath);

/**
 * File handles editing and updating of csv (templates)
 */
exports.handler = AuthedHandler(async (context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);

  try {
    switch (event.cmd) {
      case "read-all":
        {
          const syncId = await getParam(context, "SYNC_SID");
          //Check if templates already exist in sync, otherwise load them.
          //selectSyncDocument(context, syncId, syncDocumentName) {
          const docs = await listSyncDocuments(syncId);

          const files = event.files.split(","); //need to split urlencoded array back into js array
          const promises = files.map((file) =>
            readCsv(Runtime.getAssets()[`${file}`].path)
          );
          const promiseResult = await Promise.all(promises);
          const result = promiseResult.map((res, index) => {
            return {
              [files[index]]: res,
            };
          });
          response.setBody({
            error: false,
            result,
          });
        }
        return callback(null, response);
      case "list": {
        const csvs = Object.keys(Runtime.getAssets()).reduce((acc, key) => {
          if (key.includes(".csv")) {
            return acc.concat(key);
          }
          return acc;
        }, []);
        response.setBody({ error: false, result: csvs });
        return callback(null, response);
      }
      case "update": {
        const { path } = Runtime.getAssets()[event.name];
        await writeCsv(path, JSON.parse(event.data));
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
});
