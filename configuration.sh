#!/bin/bash

# enforce using source to run this script and direct execute
if [[ "${BASH_SOURCE[0]}" -ef "$0" ]]; then
  echo "Usage: source ./configuration.sh [SALESFORCE_URL|SALESFORCE_USERNAME|FRONTLINE_REALM_SID|SALESFORCE_API_KEY|FRONTLINE_SERVICE_HOSTNAME]"
  exit 1
fi

if [[ -z "${1}" ]]; then
  echo "Confirm your input:"
  echo "SALESFORCE_URL            : ${SALESFORCE_URL}"
  echo "SALESFORCE_USERNAME       : ${SALESFORCE_USERNAME}"
  echo "FRONTLINE_REALM_SID       : ${FRONTLINE_REALM_SID}"
  echo "SALESFORCE_API_KEY        : ${SALESFORCE_API_KEY}"
  echo "FRONTLINE_SERVICE_HOSTNAME: ${FRONTLINE_SERVICE_HOSTNAME}"
  echo -n "Correct? [y/n]: "
  read yn
  [[ "${yn}" != 'y' ]] && return

  echo "SALESFORCE_HOSTNAME              : ${SALESFORCE_HOSTNAME}"
  echo "LIGHTNING_HOSTNAME               : ${LIGHTNING_HOSTNAME}"
  echo "Frontline Workspace ID           : ${SALESFORCE_SUBDOMAIN}"
  echo "Frontline Identiy provider issuer: ${SALESFORCE_URL}"
  echo "Frontline SSO URL                : ${SALESFORCE_URL}/idp/endpoint/HttpRedirect"
  echo "Frontline X.509 Certificate      : \n$(cat ~/Downloads/SalesforceIDP.crt)"
  echo "Web App Settings -> Entity Id    : https://iam.twilio.com/v2/saml2/metadata/${FRONTLINE_REALM_SID}"
  echo "Web App Settings -> ACS URL      : https://iam.twilio.com/v2/saml2/authenticate/${FRONTLINE_REALM_SID}"
  echo "Authorize ConnectedApp           : sfdx auth:jwt:grant --clientid ${SALESFORCE_API_KEY} --jwtkeyfile assets/server.private.key --username ${SALESFORCE_USERNAME} --setdefaultdevhubusername --setalias ${SALESFORCE_USERNAME}"
  echo "FRONTLINE_SERVICE_HOSTNAME       : ${FRONTLINE_SERVICE_HOSTNAME}"
  echo "Frontline CRM Callback URL                   : https://${FRONTLINE_SERVICE_HOSTNAME}/crm"
  echo "Frontline Outgoing Conversations Callback URL: https://${FRONTLINE_SERVICE_HOSTNAME}/outgoing-conversation"
  echo "Frontline Templates Callback URL             : https://${FRONTLINE_SERVICE_HOSTNAME}/template"
  echo "Frontline Pre-Event URL                      : https://${FRONTLINE_SERVICE_HOSTNAME}/conversation"
  echo "Frontline Post-Event URL                     : https://${FRONTLINE_SERVICE_HOSTNAME}/conversation"
fi


yn='n'
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
      VALID_SALESFORCE_URL_REGEX='^(https://)(.+)(.salesforce.com)$'
      if [[ ${SALESFORCE_URL} =~ ${VALID_SALESFORCE_URL_REGEX} ]]; then
        echo "valid url: ${SALESFORCE_URL}"
      else
        echo "invalid url!!! must start with https & end with salesforce.com"
        return
      fi
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  SALESFORCE_HOSTNAME="${SALESFORCE_URL/https:\/\//}"
  SALESFORCE_SUBDOMAIN=${SALESFORCE_HOSTNAME/.my.salesforce.com/}
  LIGHTNING_HOSTNAME="${SALESFORCE_HOSTNAME}.lightning.force.com"
  return 0
fi


yn='n'
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

      VALID_SALESFORCE_USERNAME_REGEX='^([a-zA-Z0-9_\-\.\+]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$'
      if [[ ${SALESFORCE_USERNAME} =~ ${VALID_SALESFORCE_USERNAME_REGEX} ]]; then
        echo "valid username: ${SALESFORCE_USERNAME}"
      else
        echo "invalid username !!! must be email format"
        return
      fi
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  return 0
fi


yn='n'
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


yn='n'
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
      VALID_FRONTLINE_REALM_SID_REGEX='^(JB)(.{32})$'
      if [[ ${FRONTLINE_REALM_SID} =~ ${VALID_FRONTLINE_REALM_SID_REGEX} ]]; then
        echo "valid SID: ${FRONTLINE_REALM_SID}"
      else
        echo "invalid SID!!! must be like JBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        return
      fi
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  return 0
fi


yn='n'
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
      VALID_FRONTLINE_SERVICE_HOSTNAME_REGEX='^(hls-frontline-pharma-)(.+)(.twil.io)$'
      if [[ ${FRONTLINE_SERVICE_HOSTNAME} =~ ${VALID_FRONTLINE_SERVICE_HOSTNAME_REGEX} ]]; then
        echo "valid format: ${FRONTLINE_SERVICE_HOSTNAME}"
      else
        echo "invalid format: ${FRONTLINE_SERVICE_HOSTNAME}"
        return
      fi
    fi
    [[ "${yn}" == "n" ]]
  do :; done
  return 0
fi
