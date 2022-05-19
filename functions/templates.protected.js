const templatesPath =
  Runtime.getFunctions()["seeding/seed"].path;
const { makeTemplateArray } = require(templatesPath);

exports.handler = async function (context, event, callback) {
  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  try {
    console.log('Frontline user identity: ' + event.Worker);
      switch (event.Location) {
        case 'GetTemplatesByCustomerId': {
          response.setBody(
            await makeTemplateArray()
          );
          break;
        } default: {
          console.log('Unknown Location: ', event.Location);
          res.setStatusCode(422);
        }
      }
      return callback(null, response);
  } catch (e) {
    console.error(e);
    response.setStatusCode(500);
    return callback(null, response);
  }
};