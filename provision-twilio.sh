#!/bin/bash
set -o errexit

# ---------- set TWILIO credentials
if [ -z "${TWILIO_ACCOUNT_SID}" ]; then
  echo "Lookup your ACCOUNT SID at https://console.twilio.com/"
  echo "Execute in your terminal, 'export TWILIO_ACCOUNT_SID=AC********************************'"
  echo "TWILIO_ACCOUNT_SID environment variable is not set!!!"
  exit 1
fi

if [ -z "${TWILIO_AUTH_TOKEN}" ]; then
  echo "Lookup your AUTH_TOKEN SID at https://console.twilio.com/"
  echo "Execute in your terminal, 'export TWILIO_AUTH_TOKEN=AC********************************'"
  echo "TWILIO_AUTH_TOKEN environment variable is not set!!!"
  exit 1
fi

# ---------- variables
APPLICATION_NAME=$(basename `pwd`)
TWILIO_ACCOUNT_NAME=$(twilio api:core:accounts:fetch --sid=${TWILIO_ACCOUNT_SID} --no-header --properties=friendlyName)
echo "================================================================================"
echo "APPLICATION_NAME   : ${APPLICATION_NAME}"
echo "TWILIO_ACCOUNT_NAME: ${TWILIO_ACCOUNT_NAME}"
echo "================================================================================"


# ---------- check account is not a flex account
set +o errexit

twilio api:flex:v1:configuration:fetch > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
  echo 'Frontline service cannot be enabled on Flex Twilio account!!! aborting...'
  exit 1
else
  echo 'No Flex service found in Twilio account...'
fi

set -o errexit

# ---------- check organization, manually --------------------------------------------------
while
  echo 'Opening https://www.twilio.com/console/admin ...'
  open -a "Google Chrome" https://www.twilio.com/console/admin
  echo -n 'Have you created Organization for your Twilio account? [y/n] '
  read yn
  if [[ "${yn}" == "n" ]]; then
    echo 'Opening https://www.twilio.com/console/organization ...'
    open -a "Google Chrome" https://www.twilio.com/console/organization
  fi
  [[ "${yn}" == "n" ]]
do :; done

# TODO programmatically (1) checking organization existence; (2) creating if non-existent using id-organization-service internal API


# ---------- check phone number: sms & voice capable US phone number --------------------------------------------------
# list incoming-phone-numbers of this account
IP_SID_ARRAY=($(twilio api:core:incoming-phone-numbers:list -o=json | jq --raw-output '.[].sid'))
if [[ ${IP_SID_ARRAY} == "No results" ]]; then
  echo "Found 0 incoming phone numbers"
else
  echo "Found ${#IP_SID_ARRAY[@]} incoming phone numbers"
fi

if [[ ${IP_SID_ARRAY} != "No results" ]]; then
  for sid in ${IP_SID_ARRAY}; do
    SMS_CAPABLE=$(twilio api:core:incoming-phone-numbers:fetch --sid ${sid} -o=json | jq '.[0].capabilities.sms')
    VOX_CAPABLE=$(twilio api:core:incoming-phone-numbers:fetch --sid ${sid} -o=json | jq '.[0].capabilities.voice')
    if [[ "${SMS_CAPABLE}" && "${VOX_CAPABLE}" ]]; then
      INCOMING_PHONE_NUMBER=$(twilio api:core:incoming-phone-numbers:fetch --sid ${sid} -o=json | jq '.[0].phoneNumber')
      INCOMING_PHONE_SID=${sid}
      echo "Found sms & voice capable incoming phone: ${INCOMING_PHONE_NUMBER} ${INCOMING_PHONE_SID}"
      break
    fi
  done
fi

# no incoming phone found, so provision new
if [[ -z ${INCOMING_PHONE_SID} ]]; then
  INCOMING_PHONE_NUMBER=$(twilio api:core:available-phone-numbers:local:list \
  --sms-enabled --voice-enabled --country-code US --limit=1 -o=json \
  | jq --raw-output '.[0].phoneNumber')

  INCOMING_PHONE_SID=$(twilio api:core:incoming-phone-numbers:create \
  --phone-number ${INCOMING_PHONE_NUMBER} -o=json \
  | jq --raw-output '.[0].sid')

  echo "Provisioned sms & voice capable incoming phone: ${INCOMING_PHONE_NUMBER} ${INCOMING_PHONE_SID}"
fi


# ---------- create frontline service, manually --------------------------------------------------
yn="n"
while
  if [[ "${yn}" == "n" ]]; then
    echo 'Opening https://www.twilio.com/console/frontline ...'
    open -a "Google Chrome" https://www.twilio.com/console/frontline
    echo "1. Click on 'Create Frontline service' button"
    echo "2. In pop-up, select the checkbox and then click the 'Confirm' button"
  fi
  echo -n 'Front service creation is complete? [y/n] '
  read yn
  [[ "${yn}" == "n" ]]
do :; done


# ---------- configure conversations --------------------------------------------------
# find conversation service named 'Frontline Service' created from frontline service creation
# in case there are multiple matching friendlyName, return first match
FRONTLINE_CONVERSATION_FNAME='Frontline Service'
FRONTLINE_CONVERSATION_SID=$(twilio api:conversations:v1:services:list -o=json \
| jq --raw-output --arg fname "${FRONTLINE_CONVERSATION_FNAME}" '.[] | select(.friendlyName == $fname) | .sid' \
| head -1)

if [[ ! -z "${FRONTLINE_CONVERSATION_SID}" ]]; then
  echo "FRONTLINE_CONVERSATION_SID=${FRONTLINE_CONVERSATION_SID}"
else
	echo "Conversation Service named ${FRONTLINE_CONVERSATION_FNAME} is not found!!! aborting..."
	exit 1
fi

# set default conversation service
DEFAULT_CONVERSATION_SERVICE_SID=$(twilio api:conversations:v1:configuration:fetch -o=json \
| jq --raw-output '.[0].defaultChatServiceSid')
if [[ "${DEFAULT_CONVERSATION_SERVICE_SID}" != "${FRONTLINE_CONVERSATION_SID}" ]]; then
  twilio api:conversations:v1:configuration:update \
  --default-chat-service-sid ${FRONTLINE_CONVERSATION_SID} -o=json
  echo "Set Default Conversation Service = ${FRONTLINE_CONVERSATION_SID}"
else
  echo "Confirmed Default Conversation Service = ${FRONTLINE_CONVERSATION_SID}"
fi


# ---------- set auto-create conversation, all messages, manually  --------------------------------------------------
DEFAULT_MESSAGING_SERVICE_SID=$(twilio api:conversations:v1:configuration:fetch -o=json \
| jq --raw-output '.[0].defaultMessagingServiceSid')


# TODO if below does not work
# open https://www.twilio.com/console/conversations/configuration/defaults
# - unlock the "Handle Inbound Messages with Conversations"
# - click "Save" button on lower right
# open https://console.twilio.com/?frameUrl=/console/sms/services/MG46002ec8c487a512318c2033ab0eee2e
# - Click the "Autocreate a Conversation" setting
# - click "Save" button on lower right
# open senders pool https://console.twilio.com/us1/service/sms/MG46002ec8c487a512318c2033ab0eee2e/sms-senders
# - click the "Add Senders" button
# - select Twilio phone number INCOMING_PHONE_NUMBER
# - click "Add Phone Numbers"

# set auto-create conversation, per user phone number
twilio api:conversations:v1:configuration:addresses:create \
  --friendly-name "My Test Configuration" \
  --auto-creation.enabled  \
  --auto-creation.type webhook \
  --auto-creation.conversation-service-sid ${FRONTLINE_CONVERSATION_SID} \
  --auto-creation.webhook-url https://example.com \
  --auto-creation.webhook-method POST \
  --auto-creation.webhook-filters onParticipantAdded onMessageAdded \
  --type sms \
  --address +19705362258


# TODO ---------- configure frontline SSO, manually  --------------------------------------------------
# need information from SF SSO setup

# workspace-id: owl-pharma
# identiy provider linl: from SF
# sso url: from SF
# click 'Save' button on lower left

# open https://www.twilio.com/console/frontline/sso
