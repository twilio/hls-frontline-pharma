const templatesPath = Runtime.getFunctions()["seeding/seed"].path;
const {makeTemplateArray} = require(templatesPath) 
const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);

exports.handler = async function (context, event, callback) {
  let response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  try {
    const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
    const { connection } = sfdcConnectionIdentity;
    const customerDetails =
      (await getCustomerById(event.Id, connection)) || {};
    switch (event.Location) {
      case "GetTemplatesByCustomerId": {
        response.setBody(await makeTemplateArray(customerDetails));
        break;
      }
      default: {
        console.log("Unknown Location: ", event.Location);
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

async function getCustomerById(number, sfdcConn) {
  console.log("Getting Customer details by #: ", number);
  let sfdcRecords = [];
  try {
    sfdcRecords = await sfdcConn
      .sobject("Contact")
      .find(
        {
          Id: number,
        },
      )
      .sort({ LastModifiedDate: -1 })
      .limit(1)
      .execute();
    console.log(
      "Fetched # SFDC records for contact by #: " + sfdcRecords.length
    );
    console.log(sfdcRecords)
    if (sfdcRecords.length === 0) {
      return;
    }
    return sfdcRecords[0];
  } catch (err) {
    console.error(err);
  }
};