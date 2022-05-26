#!/bin/bash

if [[ -z "${1}" ]]; then
  echo "SALESFORCE_USERNAME              : ${SALESFORCE_USERNAME}"
  echo "SALESFORCE_URL                   : ${SALESFORCE_URL}"
  echo "SALESFORCE_HOSTNAME              : ${SALESFORCE_HOSTNAME}"
  echo "LIGHTNING_HOSTNAME               : ${LIGHTNING_HOSTNAME}"
  echo "FRONTLINE_REALM_SID              : ${FRONTLINE_REALM_SID}"
  echo "Frontline Workspace ID           : ${FRONTLINE_WORKSPACE_ID}"
  echo "Frontline Identiy provider issuer: ${SALESFORCE_URL}"
  echo "Frontline SSO ULR                : ${SALESFORCE_URL}/idp/endpoint/HttpRedirect"
  echo "Frontline X.509 Certificate      : \n$(cat ~/Downloads/SalesforceIDP.crt)"
  echo "Web App Settings -> Entity Id    : https://iam.twilio.com/v2/saml2/metadata/${FRONTLINE_REALM_SID}"
  echo "Web App Settings -> ACS URL      : https://iam.twilio.com/v2/saml2/authenticate/${FRONTLINE_REALM_SID}"
  echo "Authorize ConnectedApp           : sfdx auth:jwt:grant --clientid ${SALESFORCE_API_KEY} --jwtkeyfile assets/server.private.key --username ${SALESFORCE_USERNAME} --setdefaultdevhubusername --setalias owlhealth"
  echo "FRONTLINE_SERVICE_HOSTNAME       : ${FRONTLINE_SERVICE_HOSTNAME}"
  echo "Frontline CRM Callback URL                   : https://${FRONTLINE_SERVICE_HOSTNAME}/crm"
  echo "Frontline Outgoing Conversations Callback URL: https://${FRONTLINE_SERVICE_HOSTNAME}/outgoing-conversation"
  echo "Frontline Templates Callback URL             : https://${FRONTLINE_SERVICE_HOSTNAME}/template"
  echo "Frontline Pre-Event URL                      : https://${FRONTLINE_SERVICE_HOSTNAME}/conversation"
  echo "Frontline Post-Event URL                     : https://${FRONTLINE_SERVICE_HOSTNAME}/conversation"
fi


if [[ "${1}" == "FRONTLINE_REALM_SID" ]]; then
  while
    if [[ ! -z ${FRONTLINE_REALM_SID} ]]; then
      echo "FRONTLINE_REALM_SID: ${FRONTLINE_REALM_SID}"
      echo -n "Correct? [y/n] "
      read yn
    fi
    if [[ "${yn}" == "n" ]] || [[ -z ${FRONTLINE_REALM_SID} ]]; then
      echo -n 'Enter FRONTLINE_REALM_SID: '
      read FRONTLINE_REALM_SID
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  return 0
fi


if [[ "${1}" == "SALESFORCE_URL" ]]; then
  while
    if [[ ! -z ${SALESFORCE_URL} ]]; then
      echo "SALESFORCE_URL: ${SALESFORCE_URL}"
      echo -n "Correct? [y/n] "
      read yn
    fi
    if [[ "${yn}" == "n" ]] || [[ -z ${SALESFORCE_URL} ]]; then
      echo -n 'Enter SALESFORCE_URL: '
      read SALESFORCE_URL
      if [[ ! "${SALESFORCE_URL}" == *salesforce* ]]; then
        echo "Entered URL ${SALESFORCE_URL} does NOT is wrong!!! must end in salesforce.com!!!"
        yn="n"
      fi
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  SALESFORCE_HOSTNAME="${SALESFORCE_URL/https:\/\//}"
  SALESFORCE_SUBDOMAIN=${SALESFORCE_HOSTNAME/.my.salesforce.com/}
  LIGHTNING_HOSTNAME="${SALESFORCE_HOSTNAME}.lightning.force.com"
  FRONTLINE_WORKSPACE_ID=${SALESFORCE_SUBDOMAIN}
  return 0
fi


if [[ "${1}" == "SALESFORCE_USERNAME" ]]; then
  while
    if [[ ! -z ${SALESFORCE_USERNAME} ]]; then
      echo "SALESFORCE_USERNAME: ${SALESFORCE_USERNAME}"
      echo -n "Correct? [y/n] "
      read yn
    fi
    if [[ "${yn}" == "n" ]] || [[ -z ${SALESFORCE_USERNAME} ]]; then
      echo -n 'Enter SALESFORCE_USERNAME: '
      read SALESFORCE_USERNAME
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  return 0
fi


if [[ "${1}" == "SALESFORCE_API_KEY" ]]; then
  while
    if [[ ! -z ${SALESFORCE_API_KEY} ]]; then
      echo "SALESFORCE_API_KEY: ${SALESFORCE_API_KEY}"
      echo -n "Correct? [y/n] "
      read yn
    fi
    if [[ "${yn}" == "n" ]] || [[ -z ${SALESFORCE_API_KEY} ]]; then
      echo -n 'Enter SALESFORCE_API_KEY: '
      read SALESFORCE_API_KEY
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  return 0
fi


if [[ "${1}" == "FRONTLINE_SERVICE_HOSTNAME" ]]; then
  while
    if [[ ! -z ${FRONTLINE_SERVICE_HOSTNAME} ]]; then
      echo "FRONTLINE_SERVICE_HOSTNAME: ${FRONTLINE_SERVICE_HOSTNAME}"
      echo -n "Correct? [y/n] "
      read yn
    fi
    if [[ "${yn}" == "n" ]] || [[ -z ${FRONTLINE_SERVICE_HOSTNAME} ]]; then
      echo -n 'Enter FRONTLINE_SERVICE_HOSTNAME: '
      read FRONTLINE_SERVICE_HOSTNAME
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  return 0
fi
