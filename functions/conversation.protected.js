const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const blockedContentPath = Runtime.getFunctions()["blocked-content"].path;
const { processFrontlineMessage } = require(blockedContentPath);
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);
const moment = require("moment");
const momentTimeZone = require("moment-timezone");

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
  const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
  const { connection } = sfdcConnectionIdentity;
  switch (event.EventType) {
    case "onConversationAdded": {
      const isIncomingConversation = !!customerNumber;
      if (isIncomingConversation) {
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
        response.setStatusCode(403);
        return callback(null, response);
      }
      const processedMessage = await processFrontlineMessage(event, response);
      console.log("hello", processedMessage, response);
      if (processedMessage && processedMessage.success) {
        response.setBody(processedMessage);
      } else {
        throw new Error("Message Body contains Blocked Word");
      }
    }
    case "onConversationStateUpdated": {
      // upload conversation to Salesforce
      if (event.StateTo && event.StateTo === "closed") {
        const convo = await convertMessagesToConversation(
          twilioClient,
          conversationSid
        );
        const customerDetails =
          (await getCustomerByNumber(customerNumber, connection)) || {};
        const eventDescription = parseConversation(convo, customerDetails);
        await createEventSObject(
          connection,
          customerDetails,
          eventDescription,
          convo
        );
      }
    }
    case "onConversationUpdated": {
      if (event.Attributes) {
        const attributes = JSON.parse(event.Attributes);

        try {
          //This is the case where a phone call has just hung up.
          if (
            attributes.hasOwnProperty("frontline.events") &&
            attributes["frontline.events"].find(
              (event) => event.type === "call_ended"
            ) &&
            event.State !== "closed"
          ) {
            //get the latest logged event of the phone call
            const maxDur = attributes["frontline.events"].reduce((a, b) =>
              a.duration > b.duration ? a : b
            );
            const { date: endDateMs, duration } = maxDur;
            const startDateMs = endDateMs - duration * 1000;
            const { customer_id } = await getCustomerIdByName(
              event.FriendlyName,
              connection
            );
            const description = `${duration} second phone call with ${
              event.FriendlyName
            } starting at ${momentTimeZone
              .tz(startDateMs, "America/Los_Angeles")
              .format("MM/DD/YYYY hh:mm A z")}.`;
            await createEventSObject(
              connection,
              { customer_id },
              description,
              [{ dateCreated: endDateMs }, { dateCreated: startDateMs }],
              "Call"
            );
          }
        } catch (err) {
          console.log("Could not log voice conversation");
        }
      }
      break;
    }
    default: {
      console.log("Unknown event type: ", event.EventType);
    }
  }
  return callback(null, response);
};

const createEventSObject = async (
  conn,
  customerDetails,
  eventDescription,
  convo,
  subject = "SMS"
) => {
  const endTime = moment(convo[0].dateCreated);
  const endDateTime = moment(new Date(convo[0].dateCreated));
  const startTime = moment(convo[convo.length - 1].dateCreated);
  const dateDiff = endTime.diff(startTime, "days");
  const minutesDiff = endTime.diff(startTime, "minutes");
  const fourteenDaysPrior = endTime.subtract(14, "days").toISOString();

  await new Promise((resolve, reject) => {
    conn.sobject("Event").create(
      {
        DurationInMinutes: minutesDiff,
        Description: eventDescription,
        EndDateTime: endDateTime.toISOString(),
        IsAllDayEvent: false,
        WhoId: customerDetails.customer_id,
        StartDateTime:
          dateDiff > 14 ? fourteenDaysPrior : startTime.toISOString(),
        Subject: subject,
      },
      function (err, ret) {
        if (err || !ret.success) {
          console.log(err);
          reject(err);
        }
        console.log("Created record id : " + ret.id);
        resolve(ret);
      }
    );
  });
};

const convertMessagesToConversation = async (twilioClient, conversationSid) => {
  try {
    const convo = [];
    await twilioClient.conversations
      .conversations(conversationSid)
      .messages.list()
      .then((messages) =>
        messages.forEach((m) => {
          convo.push(m);
        })
      );
    if (convo.length === 0) {
      return [];
    }
    return convo;
  } catch (err) {
    console.error("ERROR: ", err);
  }
};

const parseConversation = (convo, customerDetails) => {
  convo.sort((a, b) => {
    return b.index - a.index;
  });
  const description = convo.reduce(
    (prev, curr, index) =>
      [
        prev,
        `[${
          curr.author === customerDetails.mobile_phone
            ? customerDetails.display_name
            : "Sales Rep"
        } @ ${momentTimeZone
          .tz(curr.dateCreated, "America/Los_Angeles")
          .format("MM/DD/YYYY hh:mm A z")}]\n${curr.body}`,
        index != convo.length - 1 ? "\n\n" : "",
      ].join(""), //replace start/end quotations.
    ""
  );
  return description;
};

const getCustomerIdByName = async (name, sfdcConn) => {
  let sfdcRecords = [];
  try {
    sfdcRecords = await sfdcConn
      .sobject("Contact")
      .find(
        {
          Name: name,
        },
        {
          Id: 1,
        }
      )
      .sort({ LastModifiedDate: -1 })
      .limit(1)
      .execute();
    if (sfdcRecords.length === 0) {
      return;
    }
    const sfdcRecord = sfdcRecords[0];
    return {
      customer_id: sfdcRecord.Id,
    };
  } catch (err) {
    console.error(err);
  }
};

const getCustomerByNumber = async (number, sfdcConn) => {
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
          MobilePhone: 1,
        }
      )
      .sort({ LastModifiedDate: -1 })
      .limit(1)
      .execute();
    if (sfdcRecords.length === 0) {
      return;
    }
    const sfdcRecord = sfdcRecords[0];
    return {
      display_name: sfdcRecord.Name,
      customer_id: sfdcRecord.Id,
      mobile_phone: sfdcRecord.MobilePhone,
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

async function getConversationParticipant(client, event) {
  const participants = await client.conversations
    .conversations(event.ConversationSid)
    .participants.list();
  for (const p of participants) {
    if (!p.identity && p.messagingBinding)
      if (p.messagingBinding.proxy_address) return p;
  }
  for (const p of participants) {
    if (p.sid == event.ParticipantSid) return p;
  }
}
