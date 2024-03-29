'use strict';
/*
 * --------------------------------------------------------------------------------
 * checks deployment status of deployables of this application in the target Twilio account
 *
 * NOTE: that this function can only be run on localhost
 *
 * return json object that at least has the following:
 * {
 *   deploy_state: DEPLOYED|NOT-DEPLOYED
 * }
 * --------------------------------------------------------------------------------
 */
exports.handler = async function (context, event, callback) {
  const THIS = 'check:';

  const assert = require("assert");
  const { getParam, fetchVersionToDeploy } = require(Runtime.getFunctions()['helpers'].path);

  assert(context.DOMAIN_NAME.startsWith('localhost:'), `Can only run on localhost!!!`);
  console.time(THIS);
  try {

    // ---------- check service ----------------------------------------
    const service_sid         = await getParam(context, 'SERVICE_SID');
    const application_version = await getParam(context, 'APPLICATION_VERSION');
    const environment_domain  = service_sid ? await getParam(context, 'ENVIRONMENT_DOMAIN') : null;
    const application_url     = service_sid ? `https:/${environment_domain}/index.html` : null;
    const service_url         = service_sid ? `https://www.twilio.com/console/functions/api/start/${service_sid}` : null;
    const frontline_url       = service_sid ? 'https://www.twilio.com/console/frontline': null;
    const administration_url  = service_sid ? `https:/${environment_domain}/administration/index.html` : null;
    let salesforce_url = null;
    if (service_sid) {
      const environment_sid = await getParam(context, 'ENVIRONMENT_SID');
      const client = context.getTwilioClient();
      const variables = await client.serverless
        .services(service_sid)
        .environments(environment_sid)
        .variables.list();
      const variable = variables.find(v => v.key === 'SFDC_INSTANCE_URL');
      if (variable) salesforce_url = variable.value;
    }

    const response = {
      deploy_state: (service_sid) ? 'DEPLOYED' : 'NOT-DEPLOYED',
      version: {
        deployed : application_version,
        to_deploy: await fetchVersionToDeploy(),
      },
      service_sid: service_sid,
      application_url: application_url,
      administration_url: administration_url,
      service_url: service_url,
      frontline_url: frontline_url,
      salesforce_url: salesforce_url,
    };
    console.log(THIS, response);
    return callback(null, response);

  } catch (err) {
    console.log(THIS, err);
    return callback(err);
  } finally {
    console.timeEnd(THIS);
  }
}


/* --------------------------------------------------------------------------------
 * checks deployment of studio flow template shipped with this application
 *
 * includes you calling js file via:
 *
 * const { check_a_deployable }  = require(Runtime.getFunctions()['installer/check'].path);
 * --------------------------------------------------------------------------------
 */
const check_a_deployable = async (context) => {
  const client = context.getTwilioClient();

  const assets = Runtime.getAssets(); // private assets only

  // TODO: check deployment state of deployable

  return {};
}

exports.check_a_deployable = check_a_deployable;
