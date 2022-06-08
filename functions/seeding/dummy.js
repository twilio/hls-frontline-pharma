
const { resetAndSeedSync } = require(Runtime.getFunctions()[
  "seeding/seed"
].path);

/** Wipes SF account by deleting all default and custom Entitlements, Opportunities, Cases, Accounts, Contacts and custom fields. */
exports.handler = async(context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);

  try {
    await resetAndSeedSync(context)
    response.setBody({
      error: false,
    });
    return callback(null, response)
  } catch (err) {
    console.log(err);
    response.setStatusCode(500);
    response.setBody({ error: true, errorObject: "Server Error." });
  }

  return callback(null, response);
}
