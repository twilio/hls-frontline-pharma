const { selectSyncDocument } = require(Runtime.getFunctions()["datastore-helpers"].path);

const { getParam } = require(Runtime.getFunctions()["helpers"].path);
const {
  SYNC_LIST_NAME,
  UNAPPROVED,
  BLOCKED,
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
      response.setBody({ error: false, result: [] });
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
});

const isFrontlineWorker = (event) => {
  return event.ClientIdentity ? true : false;
};

//async function selectSyncDocument(context, syncServiceSid, syncDocumentName) {
const processFrontlineMessage = async (context, event, response) => {
  try {
    const syncSid = await getParam(context, "SYNC_SID");
    const allLower = event.Body.toLowerCase();
    const { data: blockedWords } = await selectSyncDocument(
      context,
      syncSid,
      "BlockedWords_List"
    );
    const { data: unapprovedContent } = await selectSyncDocument(
      context,
      syncSid,
      "UnapprovedContent_List"
    );
    const containsBlockedWord = !blockedWords.every(
      (blockedWord) => !allLower.includes(blockedWord)
    );
    const containsUnapprovedContent = !unapprovedContent.every(
      (unapproved) => !allLower.includes(unapproved)
    );
    if (containsBlockedWord && isFrontlineWorker(event)) {
      response.setStatusCode(403);
      return { error: true, errorObject: BLOCKED };
    } else if (containsUnapprovedContent && isFrontlineWorker(event)) {
      response.setStatusCode(403);
      return { error: true, errorObject: UNAPPROVED };
    } else if (allLower === STOP_MESSAGING.toLowerCase()) {
      response.setStatusCode(403);
      return { error: true, errorObject: STOP_MESSAGING };
    }
    response.setStatusCode(201);
    return { success: true, body: event.Body, author: event.Author };
  } catch (err) {
    console.log(err);
  }
};

const storeBlockedMessage = async (event, context, customerDetails) => {
  // event contains the message
  const client = context.getTwilioClient();
  const syncSid = await getParam(context, "SYNC_SID");
  await client.sync
    .services(syncSid)
    .syncLists.create({ uniqueName: SYNC_LIST_NAME })
    .then((sl) => SYNC_LIST_NAME)
    .catch((err) => SYNC_LIST_NAME)
    .then((sid) => {
      console.log("SID", sid);
      return client.sync
        .services(syncSid)
        .syncLists(sid)
        .syncListItems.create({
          data: {
            agent: event.Author,
            blockedMessage: event.Body,
            conversationSid: event.ConversationSid,
            customerNumber: customerDetails.mobile_phone,
          },
        })
        .then((si) => console.log("New SyncItem Sid: ", si));
    });
};

module.exports = {
  processFrontlineMessage,
  storeBlockedMessage,
  handler,
};
