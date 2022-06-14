const { getParam } = require(Runtime.getFunctions()["helpers"].path);
const {
  SYNC_LIST_NAME,
  BLOCKED_WORDS,
  STOP_MESSAGING,
} = require(Runtime.getFunctions()["constants"].path);
const { path } = Runtime.getFunctions()["authentication-helper"];
const { AuthedHandler } = require(path);

const handler = AuthedHandler(async (context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.setStatusCode(200);

  try {
    const syncSid = await getParam(context, "SYNC_SID");
    const client = context.getTwilioClient();
    const syncLists = await client.sync
      .services(syncSid)
      .syncLists.list()
      .then((sl) => sl);
    const messageList = syncLists.find((l) => l.uniqueName === SYNC_LIST_NAME);

    if (!messageList) {
      response.setBody({ error: false, result: []});
      return callback(null, response);
    }

    const listSid = messageList.sid;

    const res = await client.sync
      .services(syncSid)
      .syncLists(listSid)
      .syncListItems.list()
      .then((syncListItems) => syncListItems.map(({ data }) => data));

    response.setBody({ error: false, result: res });
    return callback(null, response);
  } catch (err) {
    console.error(err);
    response.setStatusCode(500);
    response.setBody({
      error: true,
      errorObject: "Could not fetch supervisory content.",
    });
  }
})

const isFrontlineWorker = (event) => {
  return event.ClientIdentity ? true : false;
};

const processFrontlineMessage = (event, response) => {
  const allLower = event.Body.toLowerCase();
  const containsBlockedWord = !BLOCKED_WORDS.every(
    (blockedWord) => !allLower.includes(blockedWord)
  );
  if (containsBlockedWord && isFrontlineWorker(event)) {
    // should not send message and report to supervisor
    response.setStatusCode(403);
    return "";
  } else if (allLower === STOP_MESSAGING.toLowerCase()) {
    response.setStatusCode(403);
    return { error: true, errorObject: STOP_MESSAGING };
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
      .then((si) => console.log("New SyncItem Sid: ", si.sid));
  } catch (err) {
    console.error("storeBlockedMessage() Error:", err);
  }
};

module.exports = {
  processFrontlineMessage,
  storeBlockedMessage,
  handler,
};
