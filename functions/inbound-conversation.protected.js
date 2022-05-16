const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);

exports.handler = async function (context, event, callback) {
  const twilioClient = context.getTwilioClient();
  let response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  const customerNumber =
    event["MessagingBinding.Address"] &&
    event["MessagingBinding.Address"].startsWith("whatsapp:")
      ? event["MessagingBinding.Address"].substring(9)
      : event["MessagingBinding.Address"];
  const conversationSid = event.ConversationSid;
  switch (event.EventType) {
    case "onConversationAdded": {
      const isIncomingConversation = !!customerNumber;
      if (isIncomingConversation) {
        const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
        const { connection } = sfdcConnectionIdentity;
        const customerDetails =
          (await getCustomerByNumber(customerNumber, connection)) || {};
        await twilioClient.conversations.conversations(conversationSid).update({
          friendlyName: customerDetails.display_name || customerNumber,
        });
      }
      break;
    }
    case "onParticipantAdded": {
      const participantSid = event.ParticipantSid;
      const isCustomer = customerNumber && !event.Identity;
      if (isCustomer) {
        const customerParticipant = await twilioClient.conversations
          .conversations(conversationSid)
          .participants.get(participantSid)
          .fetch();
        const sfdcConnectionIdentity = await sfdcAuthenticate(context, null);
        const { connection } = sfdcConnectionIdentity;
        const customerDetails =
          (await getCustomerByNumber(customerNumber, connection)) || {};
        await setCustomerParticipantProperties(
          customerParticipant,
          customerDetails
        );
      }
      break;
    }
    case "onMessageAdd": {
      const response = new Twilio.Response();
      response.appendHeader("Content-Type", "application/json");
      response.appendHeader("Access-Control-Allow-Origin", "*");

      if (!event.Body) {
        // if body is null, block the request.
        response.setBody("");
        return callback(null, response);
      }

      // TODO: Finish the functionality for handling message adds.  Should upload conversation to Salesforce
      break;
    }
    default: {
      console.log("Unknown event type: ", event.EventType);
      response.setStatusCode(422);
    }
  }
  return callback(null, response);
};

const getCustomerByNumber = async (number, sfdcConn) => {
  console.log("Getting Customer details by #: ", number);
  let sfdcRecords = [];
  try {
    sfdcRecords = await sfdcConn
      .sobject("Contact")
      .find(
        {
          MobilePhone: number,
        },
        {
          Id: 1,
          Name: 1,
        }
      )
      .sort({ LastModifiedDate: -1 })
      .limit(1)
      .execute();
    console.log(
      "Fetched # SFDC records for contact by #: " + sfdcRecords.length
    );
    if (sfdcRecords.length === 0) {
      return;
    }
    const sfdcRecord = sfdcRecords[0];
    return {
      display_name: sfdcRecord.Name,
      customer_id: sfdcRecord.Id,
    };
  } catch (err) {
    console.error(err);
  }
};

const setCustomerParticipantProperties = async (
  customerParticipant,
  customerDetails
) => {
  const participantAttributes = JSON.parse(customerParticipant.attributes);
  const customerProperties = {
    attributes: JSON.stringify({
      ...participantAttributes,
      customer_id:
        participantAttributes.customer_id || customerDetails.customer_id,
      display_name:
        participantAttributes.display_name || customerDetails.display_name,
    }),
  };

  // If there is difference, update participant
  if (customerParticipant.attributes !== customerProperties.attributes) {
    // Update attributes of customer to include customer_id
    updatedParticipant = await customerParticipant
      .update(customerProperties)
      .catch((e) => console.log("Update customer participant failed: ", e));
  }
};
