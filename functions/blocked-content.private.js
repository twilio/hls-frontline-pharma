const { getParam } = require(Runtime.getFunctions()["helpers"].path);
const { SYNC_LIST_NAME } = require(Runtime.getFunctions()["constants"].path);

const blockedKeywords = ["apple", "pear", "banana", "strawberry"];

const isFrontlineWorker = (event) => {
  return event.ClientIdentity ? true : false;
};

const processFrontlineMessage = (event, response) => {
  const allLower = event.Body.toLowerCase();
  const containsBlockedWord = !blockedKeywords.every(
    (blockedWord) => !allLower.includes(blockedWord)
  );
  if (containsBlockedWord && isFrontlineWorker(event)) {
    // should not send message and report to supervisor
    response.setStatusCode(403);
    return "";
  }
  response.setStatusCode(201);
  return { success: true, body: event.Body, author: event.Author };
};

const storeBlockedMessage = async (event, context, customerDetails) => {
  // event contains the message
  try {
    const client = context.getTwilioClient();
    const syncSid = await getParam(context, "SYNC_SID");
    const syncLists = await client.sync
      .services(syncSid)
      .syncLists.list()
      .then((sl) => sl);
    const messageList = syncLists.find((l) => l.uniqueName === SYNC_LIST_NAME);
    if (!messageList) {
      // create the syncList since it doesn't exist
      messageList = await client.sync
        .services(syncSid)
        .syncLists.create({ uniqueName: SYNC_LIST_NAME })
        .then((sl) => sl);
    }
    await client.sync
      .services(syncSid)
      .syncLists(SYNC_LIST_NAME)
      .syncListItems.create({
        data: {
          agent: event.Author,
          blockedMessage: event.Body,
          conversationSid: event.ConversationSid,
          customerNumber: customerDetails.mobile_phone,
        },
      })
      .then((si) => console.log(si.sid));
  } catch (err) {
    console.error("storeBlockedMessage() Error:", err);
  }
};

module.exports = {
  processFrontlineMessage,
  storeBlockedMessage,
};