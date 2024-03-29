'use strict';
/* --------------------------------------------------------------------------------
 * deploys application (service) to target Twilio account.
 *
 * NOTE: that this function can only be run on localhost
 *
 * input:
 * event.action: CREATE|UPDATE|DELETE, defaults to CREATE|UPDATE depending on deployed state
 *
 * service identified via unique_name = APPLICATION_NAME in helpers.private.js
 * --------------------------------------------------------------------------------
 */
exports.handler = async function(context, event, callback) {
  const THIS = 'deploy:';

  const assert = require("assert");
  const { getParam, setParam, fetchVersionToDeploy } = require(Runtime.getFunctions()['helpers'].path);

  assert(context.DOMAIN_NAME.startsWith('localhost:'), `Can only run on localhost!!!`);
  console.time(THIS);
  try {
    assert(event.configuration.APPLICATION_NAME, 'missing APPLICATION_NAME variable!!!');
    assert(event.action, 'missing event.action variable!!!');
    const application_name = event.configuration.APPLICATION_NAME;
    const env = event.configuration;
    console.log(THIS, 'configuration submitted:\n', env);

    console.log(THIS, `Deploying (${event.action}) Twilio service ... ${application_name}`);

    switch (event.action) {

      case 'DEPLOY':
      case 'REDEPLOY': {
        const service_sid = await deploy_service(context, env);
        console.log(THIS, `Deployed: ${service_sid}`);

        console.log(THIS, 'Provisioning dependent Twilio services');
        await getParam(context, 'VERIFY_SID');
        await getParam(context, 'SYNC_SID');

        console.log(THIS, 'Make Twilio service editable ...');
        const client = context.getTwilioClient();
        await client.serverless.services(service_sid).update({uiEditable: true});

        const version_to_deploy = await fetchVersionToDeploy();
        await setParam(context, 'APPLICATION_VERSION', version_to_deploy);
        console.log(THIS, `Completed deployment of ${application_name}:${version_to_deploy}`);

        const response = {
          status: event.action,
          deployables: [
            { service_sid: service_sid, },
          ],
        };
        console.log(THIS, response);
        return callback(null, response);
      }
        break;

      case 'UNDEPLOY': {
        const undeployed_service_sid = await undeploy_service(context);

        // TODO: un-provision other services

        const response = {
          status: 'UNDEPLOYED',
          deployables: [
            { service_sid: undeployed_service_sid, },
          ],
        };
        console.log(THIS, response);
        return callback(null, response);
      }
        break;

      default: throw new Error(`unknown event.action=${action}`);
    }

  } catch(err) {
    console.log(err);
    return callback(err);
  } finally {
    console.timeEnd(THIS);
  }
}


/* --------------------------------------------------------------------------------
 * deploys (creates new/updates existing) service to target Twilio account.
 *
 * - service identified via unique_name = APPLICATION_NAME in helpers.private.js
 *
 * returns: service SID, if successful
 * --------------------------------------------------------------------------------
 */
async function get_assets() {
  const { getListOfFunctionsAndAssets } = require('@twilio-labs/serverless-api/dist/utils/fs');

  const { assets } = await getListOfFunctionsAndAssets(process.cwd(), {
    functionsFolderNames: [],
    assetsFolderNames: ["assets"],
  });
  //console.log('asset count:', assets.length);

  const indexHTMLs = assets.filter(asset => asset.name.includes('index.html'));
  // Set indext.html as a default document
  const allAssets = assets.concat(indexHTMLs.map(ih => ({
    ...ih,
    path: ih.name.replace("index.html", ""),
    name: ih.name.replace("index.html", ""),
  })));
  //console.log(allAssets);
  //return allAssets;
  return assets;
}


/* --------------------------------------------------------------------------------
 * deploys serverless service
 * --------------------------------------------------------------------------------
 */
async function deploy_service(context, envrionmentVariables = {}) {
  const { getParam } = require(Runtime.getFunctions()['helpers'].path);
  const { getListOfFunctionsAndAssets } = require('@twilio-labs/serverless-api/dist/utils/fs');
  const { TwilioServerlessApiClient } = require('@twilio-labs/serverless-api');
  const fs = require('fs');

  const client = context.getTwilioClient();

  const assets = await get_assets();
  console.log('asset count:' , assets.length);

  const { functions } = await getListOfFunctionsAndAssets(process.cwd(),{
    functionsFolderNames: ["functions"],
    assetsFolderNames: []
  });
  console.log('function count:' , functions.length);

  const pkgJsonRaw = fs.readFileSync(`${process.cwd()}/package.json`);
  const pkgJsonInfo = JSON.parse(pkgJsonRaw);
  const dependencies = pkgJsonInfo.dependencies;
  console.log('package.json loaded');

  const deployOptions = {
    env: {
      ...envrionmentVariables
    },
    pkgJson: {
      dependencies,
    },
    functionsEnv: 'dev',
    functions,
    assets,
  };
  console.log('deployOptions.env:', deployOptions.env);

  context['APPLICATION_NAME'] = envrionmentVariables.APPLICATION_NAME;
  let service_sid = await getParam(context, 'SERVICE_SID');
  if (service_sid) {
    // update service
    console.log('updating services ...');
    deployOptions.serviceSid = service_sid;
  } else {
    // create service
    console.log('creating services ...');
    deployOptions.serviceName = await getParam(context, 'APPLICATION_NAME');
  }

  const serverlessClient = new TwilioServerlessApiClient({
    username: client.username, // ACCOUNT_SID
    password: client.password, // AUTH_TOKEN
  });

  serverlessClient.on("status-update", evt => {
    console.log(evt.message);
  });

  await serverlessClient.deployProject(deployOptions);
  service_sid = await getParam(context, 'SERVICE_SID');

  return service_sid;
}


/* --------------------------------------------------------------------------------
 * undeploys sererless service
 * --------------------------------------------------------------------------------
 */
async function undeploy_service(context) {
  const { getParam } = require(Runtime.getFunctions()['helpers'].path);

  const client = context.getTwilioClient();
  // ---------- remove studio flow, if exists
  const service_sid = await getParam(context, 'SERVICE_SID'); // will be null if not deployed
  if (service_sid) {
    const response = await client.serverless.services(service_sid).remove();
  }

  return service_sid;
}




/* --------------------------------------------------------------------------------
 * (re)deploys a deployable
 * --------------------------------------------------------------------------------
 */
const deploy_a_deployable = async (context) => {
  const client = context.getTwilioClient();

  // TODO

  return null;
}

exports.deploy_a_deployable = deploy_a_deployable;

/* --------------------------------------------------------------------------------
 * undeploys a deployable
 * --------------------------------------------------------------------------------
 */
const undeploy_a_deployable = async (context) => {
  const client = context.getTwilioClient();

  // TODO

  return null;
}

exports.undeploy_a_deployable = undeploy_a_deployable;
