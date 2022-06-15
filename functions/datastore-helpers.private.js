/*
 * ----------------------------------------------------------------------------------------------------
 * helper functions for datastore functions
 * - manages persistent storage using Twilio Sync
 *
 * depends on:
 *   SYNC_SERVICE_SID: Sync service sid, automatically procured in helpers.private.js
 * ----------------------------------------------------------------------------------------------------
 */

const assert = require("assert");
const http = require("http");
const https = require("https");

/*
 * ----------------------------------------------------------------------------------------------------
 * seclt a Sync document
 *
 * parameters:
 * - context: Twilio runtime context
 * - syncServiceSid: Sync service SID
 * - syncDocumentName: unique Sync document name
 *
 * returns: select object, null if document does not exist
 * ----------------------------------------------------------------------------------------------------
 */
async function _fetchSyncDocument(client, syncServiceSid, syncDocumentName) {
  const documents = await client.sync.services(syncServiceSid).documents.list();
  const document = documents.find((d) => d.uniqueName === syncDocumentName);

  return document; // will be 'undefined' is not found
}

async function listSyncDocuments(context, syncServiceSid, limit = 20) {
  const client = context.getTwilioClient();
  const documents = await client.sync
    .services(syncServiceSid)
    .documents.list({ limit });

  return documents;
}

async function listSyncLists(context, syncServiceSid) {
  const client = context.getTwilioClient();
  const lists = await client.sync.services(syncServiceSid).syncLists.list();
  return lists;
}

async function deleteSyncList(context, syncServiceSid, list) {
  const client = context.getTwilioClient();
  await client.sync.services(syncServiceSid).syncLists(list.sid).remove();
}

async function wipeSync(context, syncServiceSid) {
  const docs = await listSyncDocuments(context, syncServiceSid);
  const lists = await listSyncLists(context, syncServiceSid);

  if (docs.length > 0) {
    const promises = docs.map((doc) =>
      deleteSyncDocument(context, syncServiceSid, doc.uniqueName)
    );
    await Promise.all(promises);
  }
  if (lists.length > 0) {
    const promises = lists.map((list) =>
      deleteSyncList(context, syncServiceSid, list)
    );
    await Promise.all(promises);
  }
}

/*
 * ----------------------------------------------------------------------------------------------------
 * select a Sync document
 *
 * parameters:
 * - context: Twilio runtime context
 * - syncServiceSid: Sync service SID
 * - syncDocumentName: unique Sync document name
 *
 * returns: select object, null if document does not exist
 * ----------------------------------------------------------------------------------------------------
 */
async function selectSyncDocument(context, syncServiceSid, syncDocumentName) {
  assert(context, "missing parameter: context!!!");
  assert(syncServiceSid, "missing parameter: syncServiceSid!!!");
  assert(syncDocumentName, "missing parameter: syncDocumentName!!!");

  const client = context.getTwilioClient();

  const document = await _fetchSyncDocument(
    client,
    syncServiceSid,
    syncDocumentName
  );

  return document ? document.data : null;
}

/*
 * ----------------------------------------------------------------------------------------------------
 * insert/update a new Sync document
 *
 * parameters
 * - context: Twilio runtime context
 * - syncServiceSid: Sync service SID
 * - syncDocumentName: unique Sync document name
 * - documentData: document data object
 *
 * returns: document if successful
 * ----------------------------------------------------------------------------------------------------
 */
async function upsertSyncDocument(
  context,
  syncServiceSid,
  syncDocumentName,
  syncDocumentData
) {
  assert(context, "missing parameter: context!!!");
  assert(syncServiceSid, "missing parameter: syncServiceSid!!!");
  assert(syncDocumentName, "missing parameter: syncDocumentName!!!");
  assert(syncDocumentData, "missing parameter: syncDocumentData!!!");

  const client = context.getTwilioClient();

  let document = await _fetchSyncDocument(
    client,
    syncServiceSid,
    syncDocumentName
  );

  if (document) {
    document = await client.sync
      .services(syncServiceSid)
      .documents(document.sid)
      .update({
        data: syncDocumentData,
      });
  } else {
    console.log("creating document:", syncDocumentName);
    document = await client.sync.services(syncServiceSid).documents.create({
      data: syncDocumentData,
      uniqueName: syncDocumentName,
    });
  }
  return document;
}

/*
 * ----------------------------------------------------------------------------------------------------
 * delete an existing Sync document
 *
 * parameters
 * - context: Twilio runtime context
 * - syncServiceSid: Sync service SID
 * - syncDocumentName: unique Sync document name
 *
 * returns: document if successful, null if nothing was delete
 * ----------------------------------------------------------------------------------------------------
 */
async function deleteSyncDocument(context, syncServiceSid, syncDocumentName) {
  assert(context, "missing parameter: context!!!");
  assert(syncServiceSid, "missing parameter: syncServiceSid!!!");
  assert(syncDocumentName, "missing parameter: syncDocumentName!!!");

  const client = context.getTwilioClient();

  const document = await _fetchSyncDocument(
    client,
    syncServiceSid,
    syncDocumentName
  );

  if (document) {
    await client.sync.services(syncServiceSid).documents(document.sid).remove();
    return document;
  } else {
    return null;
  }
}

function __ensureSyncMapCreated(client, syncServiceSid, syncMapName) {
  return client.sync
    .services(syncServiceSid)
    .syncMaps(syncMapName)
    .fetch()
    .catch((err) => {
      console.log(err);
      if (err.status === 404) {
        return client.sync
          .services(syncServiceSid)
          .syncMaps.create({ uniqueName: syncMapName });
      }

      return Promise.resolve();
    });
}

async function fetchSyncMapItem(
  client,
  syncServiceSid,
  syncMapName,
  syncMapItemKey
) {
  return await __ensureSyncMapCreated(client, syncServiceSid, syncMapName).then(
    () =>
      client.sync
        .services(syncServiceSid)
        .syncMaps(syncMapName)
        .syncMapItems(syncMapItemKey)
        .fetch()
  );
}

async function insertSyncMapItem(
  client,
  syncServiceSid,
  syncMapName,
  syncMapItemKey,
  data
) {
  await __ensureSyncMapCreated(client, syncServiceSid, syncMapName).then(() =>
    client.sync
      .services(syncServiceSid)
      .syncMaps(syncMapName)
      .syncMapItems.create({
        key: syncMapItemKey,
        data,
        ttl: 24 * 60 * 60,
      })
      .then((mapItem) => console.log(mapItem.key))
  );
}

async function updateSyncMapItem(
  client,
  syncServiceSid,
  syncMapName,
  syncMapItemKey,
  newData
) {
  await client.sync
    .services(syncServiceSid)
    .syncMaps(syncMapName)
    .syncMapItems(syncMapItemKey)
    .update({ data: newData })
    .then((syncMapItem) => console.log("Updated SyncMapItem: ", syncMapItem))
    .catch((err) => console.log(err));
}

/*
 * ----------------------------------------------------------------------------------------------------
 * fetches content of public json asset via https
 *
 * parameters
 * - context: Twilio runtime context
 * - assetPath: url path to asset
 *
 * returns: json content of asset
 * ----------------------------------------------------------------------------------------------------
 */
async function fetchPublicJsonAsset(context, assetPath) {
  const hostname = context.DOMAIN_NAME.split(":")[0];
  const port = context.DOMAIN_NAME.split(":")[1];
  const options = {
    hostname: hostname,
    port: port,
    path: assetPath,
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };
  const http_protocol = hostname === "localhost" ? http : https;

  return new Promise((resolve, reject) => {
    const request = http_protocol.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        resolve(JSON.parse(data));
      });
      response.on("error", (error) => {
        reject(error);
      });
    });
    request.end();
  });
}

// --------------------------------------------------------------------------------
module.exports = {
  selectSyncDocument,
  upsertSyncDocument,
  deleteSyncDocument,
  fetchSyncMapItem,
  insertSyncMapItem,
  updateSyncMapItem,
  fetchPublicJsonAsset,
  listSyncDocuments,
  wipeSync,
};
