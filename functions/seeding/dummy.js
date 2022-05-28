const { path } = Runtime.getFunctions()["authentication-helper"];
const { AuthedHandler } = require(path);

/** Wipes SF account by deleting all default and custom Entitlements, Opportunities, Cases, Accounts, Contacts and custom fields. */
exports.handler = AuthedHandler((context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);

  try {
    response.setBody({
      error: "hi",
    });
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: "Server Error." });
  }

  return callback(null, response);
});
