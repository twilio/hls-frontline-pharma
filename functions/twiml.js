const axios = require('axios').Axios
const sfdcAuthenticatePath =
  Runtime.getFunctions()["sf-auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);


exports.handler = async function (context, event, callback) {
  let response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  try {
    const sfdcConnectionIdentity = await sfdcAuthenticate(context, null); // this is null due to no user context, default to env. var SF user
    const { connection } = sfdcConnectionIdentity;
    
    const addOns = JSON.parse(event.AddOns)

    if (!('ibm_watson_speechtotext' in addOns.results)) {
      return 'Add Watson Speech to Text add-on in your Twilio console'
    }
  
    const payloadUrl = addOns.results.ibm_watson_speechtotext.payload[0].url
    const accountSID = context.TWILIO_ACCOUNT_SID
    const authToken = context.TWILIO_AUTH_TOKEN
    axios.get(payloadUrl, {auth: {username: accountSID, password: authToken}})
      .then(response => {
        const results = response.data.results[0].results
        const transcripts = results.map(item => item.alternatives[0].transcript)
        return transcripts
      })
       .then(transcripts => res.send(transcripts.join(' ')))

    return callback(null, response);
  } catch (e) {
    console.error(e);
    response.setStatusCode(500);
    return callback(null, response);
  }
};