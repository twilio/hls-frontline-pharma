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

module.exports = {
  processFrontlineMessage,
};
