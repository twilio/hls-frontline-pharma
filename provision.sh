#!/bin/bash
# Note that cocoaDialog cannot have exit on error (i.e., set -o errexit)

TITLE="Frontline Blueprint Provisioning"
BLUEPRINT_NAME='hls-frontline-pharma'
if [[ "${BLUEPRINT_NAME}" != $(basename `pwd`) ]]; then
  echo "This script MUST be run in the ${BLUEPRINT_NAME} root directory"
  exit 1
fi

function check_prerequisites
# --------------------------------------------------------------------------------
# uses:
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- check prerequisites'
  echo '. check sfdx'
  which sfdx
  if [[ $? == '1' ]]; then
    echo '. install sfdx'
    curl -O https://developer.salesforce.com/media/salesforce-cli/sfdx/channels/stable/sfdx.pkg
    open sfdx.pkg
  fi

  echo '. check cocoaDialog'
  if [[ ! -f '/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog' ]]; then
    echo ". install cocoaDialog"
    echo "  . open https://web.archive.org/web/20140623125426/https://cloud.github.com/downloads/mstratman/cocoadialog/cocoaDialog_3.0.0-beta7.dmg"
    echo "  . open cocoaDialog_3.0.0-beta7.dmg"
    echo "  . drag cocoaDialog.app into your /Application folder"
  fi

  yn="n"
  while
    echo -n 'installed prerequisites? [y/n] '
    read yn
    [[ "${yn}" != "y" ]]
  do :; done
}


function provision_twilio_account
# --------------------------------------------------------------------------------
# uses:
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- provision twilio account'
  open -a "Google Chrome" https://www.twilio.com/try-twilio

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Twilio account provisioning' \
  --informative-text "
✔ Create a new Twilio account, naming it 'hls-frontline-pharam'
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo '. provisioned twilio account'
}


function check_twilio_credentials
# --------------------------------------------------------------------------------
# uses:
# sets: TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN
# --------------------------------------------------------------------------------
{
  echo '---------- check twilio credentials'

  if [ ! -z "${TWILIO_ACCOUNT_SID}" ] && [ ! -z "${TWILIO_AUTH_TOKEN}" ]; then
    echo ". TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}"
    echo ". TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}"
    return
  fi

  open -a "Google Chrome" https://console.twilio.com/

  response=$(/Applications/CocoaDialog.app/Contents/MacOS/CocoaDialog inputbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --informative-text "Please enter Account SID from Twilio console" \
  --button1 "Next" --button2 "Exit")
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi
  responseArray=(${response})
  TWILIO_ACCOUNT_SID=${responseArray[1]}

  response=$(/Applications/CocoaDialog.app/Contents/MacOS/CocoaDialog inputbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --informative-text "Please enter Auth Token from Twilio console" \
  --button1 "Next" --button2 "Exit")
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi
  responseArray=(${response})
  TWILIO_AUTH_TOKEN=${responseArray[1]}

  echo ". TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}"
  echo ". TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}"
}


function check_twilio_account
# --------------------------------------------------------------------------------
# uses: TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN
# sets: TWILIO_ACCOUNT_NAME
# --------------------------------------------------------------------------------
{
  echo '---------- check twilio account'

  TWILIO_ACCOUNT_NAME=$(twilio api:core:accounts:fetch --sid=${TWILIO_ACCOUNT_SID} --no-header --properties=friendlyName)
  if [[ $? != 0 ]]; then
    echo "ERROR: Invalid Twilio credentails ${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}!!!"
    exit 1
  fi
  echo ". TWILIO_ACCOUNT_NAME=${TWILIO_ACCOUNT_NAME}"

  twilio api:flex:v1:configuration:fetch > /dev/null 2>&1
  if [[ $? -eq 0 ]]; then
    echo 'ERROR: This account has Flex service enabled. Please use a different account!!!'
    exit 1
  else
    echo '. Flex service not enabled in Twilio account'
  fi

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Twilio account check' \
  --informative-text "
✔ Valid Twilio Account: ${TWILIO_ACCOUNT_NAME}
✔ No Flex service enabled
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo '. checked twilio account'
}


function check_organization
# --------------------------------------------------------------------------------
# uses:
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- check organization'

  open -a "Google Chrome" https://www.twilio.com/console/admin

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Check Organization' \
  --informative-text "
If you don't see any organizations, create one.
You can assign any name.
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo ". organization exists"
}


function check_twilio_phone_number
# --------------------------------------------------------------------------------
# uses: TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN
# sets: TWILIO_PHONE_NUMBER TWILIO_PHONE_SID
# --------------------------------------------------------------------------------
{
  echo '---------- check/buy twilio phone number'

  IP_SID_ARRAY=($(twilio api:core:incoming-phone-numbers:list -o=json | jq --raw-output '.[].sid'))
  if [[ ${IP_SID_ARRAY} == "No results" ]]; then
    echo ". found 0 twilio phone numbers"
  else
    echo ". found ${#IP_SID_ARRAY[@]} twilio phone numbers"
  fi

  if [[ ${IP_SID_ARRAY} != "No results" ]]; then
    for sid in ${IP_SID_ARRAY}; do
      SMS_CAPABLE=$(twilio api:core:incoming-phone-numbers:fetch --sid ${sid} -o=json | jq '.[0].capabilities.sms')
      VOX_CAPABLE=$(twilio api:core:incoming-phone-numbers:fetch --sid ${sid} -o=json | jq '.[0].capabilities.voice')
      if [[ "${SMS_CAPABLE}" && "${VOX_CAPABLE}" ]]; then
        TWILIO_PHONE_NUMBER=$(twilio api:core:incoming-phone-numbers:fetch --sid ${sid} -o=json | jq --raw-output '.[0].phoneNumber')
        TWILIO_PHONE_SID=${sid}
        break
      fi
    done
  fi

  if [[ -z ${TWILIO_PHONE_SID} ]]; then
    TWILIO_PHONE_NUMBER=$(twilio api:core:available-phone-numbers:local:list \
    --sms-enabled --voice-enabled --country-code US --limit=1 -o=json \
    | jq --raw-output '.[0].phoneNumber')

    TWILIO_PHONE_SID=$(twilio api:core:incoming-phone-numbers:create \
    --phone-number ${TWILIO_PHONE_NUMBER} -o=json \
    | jq --raw-output '.[0].sid')

    TWILIO_PHONE_PROVISIONED=1

    echo ". provisioned sms & voice capable twilio phone number"
  fi

  if [[ -z $TWILIO_PHONE_PROVISIONED ]]; then
    verb='Found'
  else
    verb='Bought'
  fi
  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Check/Buy Twilio Phone Number' \
  --informative-text "
${verb} sms & voice capable Twilio incoming phone number

${TWILIO_PHONE_NUMBER} (${TWILIO_PHONE_SID})
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo ". found/provisioned incoming phone: ${TWILIO_PHONE_NUMBER} (${TWILIO_PHONE_SID})"
}


function provision_frontline
# --------------------------------------------------------------------------------
# uses:
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- create frontline service'

  open -a "Google Chrome" https://www.twilio.com/console/frontline

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Create Frontline service' \
  --informative-text "
✔ Click on "Create Frontline service" button
✔ In pop-up, select the checkbox and then click the "Confirm" button
✔ Wait for completion
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo ". created frontline service"
}


function check_frontline_service
# --------------------------------------------------------------------------------
# uses:
# sets: FRONTLINE_CONVERSATION_SID FRONTLINE_MESSAGING_SID
# --------------------------------------------------------------------------------
{
  echo '---------- check frontline service'

  FRONTLINE_CONVERSATION_FNAME='Frontline Service'
  FRONTLINE_CONVERSATION_SID=$(twilio api:conversations:v1:services:list -o=json \
  | jq --raw-output --arg fname "${FRONTLINE_CONVERSATION_FNAME}" '.[] | select(.friendlyName == $fname) | .sid' \
  | head -1)
  if [[ ! -z "${FRONTLINE_CONVERSATION_SID}" ]]; then
    echo ". FRONTLINE_CONVERSATION_SID=${FRONTLINE_CONVERSATION_SID}"
  else
    echo "ERROR: Frontline service does not seem to be provisioned correctly. Please check with HLS development team!!!"
    exit 1
  fi

  # set default conversation service
  DEFAULT_CONVERSATION_SERVICE_SID=$(twilio api:conversations:v1:configuration:fetch -o=json \
  | jq --raw-output '.[0].defaultChatServiceSid')
  if [[ "${DEFAULT_CONVERSATION_SERVICE_SID}" != "${FRONTLINE_CONVERSATION_SID}" ]]; then
    twilio api:conversations:v1:configuration:update \
    --default-chat-service-sid ${FRONTLINE_CONVERSATION_SID} -o=json
    verb='Set'
  else
    verb='Checked'
  fi

  FRONTLINE_MESSAGING_SID=$(twilio api:conversations:v1:configuration:fetch -o=json \
  | jq --raw-output '.[0].defaultMessagingServiceSid')
  echo ". FRONTLINE_MESSAGING_SID=${FRONTLINE_MESSAGING_SID}"

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 --width 600 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Check Frontline service' \
  --informative-text "
✔ FRONTLINE_CONVERSATION_SID=${FRONTLINE_CONVERSATION_SID}
✔ FRONTLINE_MESSAGING_SID=${FRONTLINE_MESSAGING_SID}
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo ". checked frontline service"
}


function configure_frontline_service
# --------------------------------------------------------------------------------
# uses: FRONTLINE_MESSAGING_SID TWILIO_PHONE_NUMBER
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- configure frontline service'

  open -a "Google Chrome" https://www.twilio.com/console/conversations/configuration/defaults

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Check Frontline service' \
  --informative-text "
✔ Unlock the 'Handle Inbound Messages with Conversations'
✔ Click 'Save' button
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  open -a "Google Chrome"  https://console.twilio.com/us1/service/sms/${FRONTLINE_MESSAGING_SID}/properties

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Check Frontline service' \
  --informative-text "
✔ Click the 'Autocreate a Conversation' setting
✔ Click 'Save' button
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  open -a "Google Chrome" https://www.twilio.com/console/sms/services/${FRONTLINE_MESSAGING_SID}/properties

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Check Frontline service' \
  --informative-text "
✔ Click the 'Senders Pool' in the left pane
✔ Click the 'Add Senders' button
✔ Select Sender Type = 'Phone Number' and click 'Continue' button
✔ Select Twilio phone number ${TWILIO_PHONE_NUMBER}
✔ Click 'Add Phone Numbers'
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo '. configured frontline service'
}


function configure_frontline_service_programatically
# --------------------------------------------------------------------------------
# uses: FRONTLINE_CONVERSATION_SID TWILIO_PHONE_NUMBER
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- configure frontline service'

  CONFIGURATION_ADDRESS_SID=$(twilio api:conversations:v1:configuration:addresses:list -o=json \
  | jq --raw-output '.[] | select(.friendlyName == "FrontlineConfiguration") | .sid')

  # set auto-create conversation, per user phone number

  if [[ -z "${CONFIGURATION_ADDRESS_SID}" ]]; then
    twilio api:conversations:v1:configuration:addresses:create \
      --friendly-name "FrontlineConfiguration" \
      --auto-creation.enabled  \
      --auto-creation.type webhook \
      --auto-creation.conversation-service-sid ${FRONTLINE_CONVERSATION_SID} \
      --auto-creation.webhook-url https://example.com \
      --auto-creation.webhook-method POST \
      --auto-creation.webhook-filters onParticipantAdded onMessageAdded \
      --type sms \
      --address ${TWILIO_PHONE_NUMBER}
    CONFIGURATION_ADDRESS_SID=$(twilio api:conversations:v1:configuration:addresses:list -o=json \
    | jq --raw-output '.[] | select(.friendlyName == "FrontlineConfiguration") | .sid')
    echo ". created CONFIGURATION_ADDRESS_SID=${CONFIGURATION_ADDRESS_SID}"
  fi
}


function check_salesforce_credentials
# --------------------------------------------------------------------------------
# uses:
# sets: SALESFORCE_HOSTNAME LIGHTNING_HOSTNAME SALESFORCE_USERNAME
# --------------------------------------------------------------------------------
{
  echo '---------- check salesforce credentials'

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Check Saleforce Account' \
  --informative-text "Have you created your Salesforce Account?" \
  --button1 'Yes' --button2 'No')
  echo ". response: ${response}"

  if [[ "${response}" == "No" ]]; then
    open -a "Google Chrome" https://developer.salesforce.com/signup

    /Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
    --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
    --string-output --no-newline \
    --title "${TITLE}" \
    --text 'Check Saleforce Account' \
    --informative-text "
Sign-up for a Salesforce Developer account
Use same email that you will use to login into the Frontline Twilio account
(e.g., bochoi+frontline@twilio.com)
    " \
    --button1 'Next' --button2 'Exit'
    echo ". response: ${response}"
    if [[ "${response}" == "Exit"* ]]; then exit 1; fi
    echo '. new salesforce account created'
  fi

  response=$(/Applications/CocoaDialog.app/Contents/MacOS/CocoaDialog inputbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --informative-text "Salesforce hostname (e.g., twilio145-dev-ed.my.salesforce.com)" \
  --button1 "Next" --button2 "Exit")
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi
  responseArray=(${response})
  SALESFORCE_HOSTNAME=${responseArray[1]}
  echo ". SALESFORCE_HOSTNAME=${SALESFORCE_HOSTNAME}"
  LIGHTNING_HOSTNAME="${SALESFORCE_HOSTNAME/my.salesforce/lightning.force}"
  echo ". LIGHTNING_HOSTNAME=${LIGHTNING_HOSTNAME}"

  response=$(/Applications/CocoaDialog.app/Contents/MacOS/CocoaDialog inputbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --informative-text "Salesforce username used during creation" \
  --button1 "Next" --button2 "Exit")
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi
  responseArray=(${response})
  SALESFORCE_USERNAME=${responseArray[1]}
  echo ". SALESFORCE_USERNAME=${SALESFORCE_USERNAME}"

  open -a "Google Chrome" "https://${SALESFORCE_HOSTNAME}"
}


function create_salesforce_idp_certificate
# --------------------------------------------------------------------------------
# uses: LIGHTNING_HOSTNAME
# sets: SALESFORCE_IDP_CERTIFICATE
# --------------------------------------------------------------------------------
{
  echo '---------- create salesforce IDP certificate'

  SALESFORCE_IDP_CERTIFICATE='FrontlinePharmaIDPCertificate'

  open -a "Google Chrome" "https://${LIGHTNING_HOSTNAME}/one/one.app#/setup/CertificatesAndKeysManagement/home"

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 --width 600 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Create Salesforce IDP Certificate' \
  --informative-text "
✔ Click 'Create Self-Signed Certificate' button

✔ Enter the following:
      Label = ${SALESFORCE_IDP_CERTIFICATE}
      Unique Name = ${SALESFORCE_IDP_CERTIFICATE}
      Exportable Private Key = checked
      Key Size = 2048

✔ Hit 'Save' button to create
✔ Click 'Download Certificate' button and save it on your laptop to use later
    default location: ~/Downloads/${SALESFORCE_IDP_CERTIFICATE}.crt
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  if [[ -f ~/Downloads/FrontlinePharmaSSO.crt ]]; then
    echo ". found downloaded certificate at ~/Downloads/${SALESFORCE_IDP_CERTIFICATE}.crt"
  else
    echo ". no downloaded certificate at ~/Downloads/${SALESFORCE_IDP_CERTIFICATE}.crt!!!"
    exit
  fi

  echo ". created salesforce idp certicate: ${SALESFORCE_IDP_CERTIFICATE}"
}


function enable_salesforce_idp
# --------------------------------------------------------------------------------
# uses: LIGHTNING_HOSTNAME SALESFORCE_IDP_CERTIFICATE
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- enable salesforce IDP'

  open -a "Google Chrome" "https://${LIGHTNING_HOSTNAME}/one/one.app#/setup/IdpPage/home"

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 --width 600 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Enable Salesforce IDP' \
  --informative-text "
✔ Press 'Enable Identity Provider' button
✔ Find & select the IDP certificate named '${SALESFORCE_IDP_CERTIFICATE}'
✔ Hit 'Save' button'
✔ Select 'OK' to warning dialog about IdP Certificate change
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo '. enabled salesforce IDP'
}


function create_salesforce_connected_app
# --------------------------------------------------------------------------------
# uses: LIGHTNING_HOSTNAME
# sets: SALESFORCE_CONNECTED_APP FRONTLINE_REALM_SID
# --------------------------------------------------------------------------------
{
  echo '---------- create salesforce connectedApp for frontline'

  SALESFORCE_CONNECTED_APP='FrontlinePharma'

  open -a "Google Chrome" "https://console.twilio.com/us1/develop/frontline/manage/single-sign-on?frameUrl=%2Fconsole%2Ffrontline%2Fsso%3Fx-target-region%3Dus1"

  response=$(/Applications/CocoaDialog.app/Contents/MacOS/CocoaDialog inputbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --informative-text "Enter Frontline Realm SID copied from Twilio console" \
  --button1 "Next" --button2 "Exit")
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi
  responseArray=(${response})
  FRONTLINE_REALM_SID=${responseArray[1]}
  echo ". FRONTLINE_REALM_SID=${FRONTLINE_REALM_SID}"

  open -a "Google Chrome" "https://${LIGHTNING_HOSTNAME}/one/one.app#/setup/NavigationMenus/home"

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 --width 600 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Create ConnectedApp' \
  --informative-text "
✔ Click 'New Connected App' button

✔ In 'Basic Information' section, enter:
      Connected App Name = ${SALESFORCE_CONNECTED_APP}
      API Name = ${SALESFORCE_CONNECTED_APP}
      Contact Email = ${SALESFORCE_USERNAME}

✔ In 'API (Enable OAuth Settings)' section:
      Enable OAuth Settings = checked
      Callback URL = https://login.salesforce.com/services/oauth2/success
      Use digital signatures = choose/upload ~/Downloads/server.crt
      Selected OAuth Scope = Add 'Manage user data via APIs (api)' & 'Perform requests at any time (refresh_token, offline_access)'
      Require Secret for Web Server Flow = checked
      Require Secret for Refresh Token Flow = checked

✔ In 'Web App Settings' section
      Enable SAML = checked
      Entity Id = https://iam.twilio.com/v2/saml2/metadata/${FRONTLINE_REALM_SID}
      ACS URL = https://iam.twilio.com/v2/saml2/authenticate/${FRONTLINE_REALM_SID}
      Subject Type (default) = Username
      Name ID Format (default) = urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified
      Issuer (default) = https://${SALESFORCE_HOSTNAME}
      IdP Certificate = ${SALESFORCE_IDP_CERTIFICATE}
      Verify Request Signatures (default) = unchecked
      Encrypt SAML Response (default) = unchecked

✔ Hit 'Save'button
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo '. created connected app for frontline'
}


function configure_salesforce_connected_app
# --------------------------------------------------------------------------------
# uses: LIGHTNING_HOSTNAME
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- create salesforce connectedApp for frontline'

  open -a "Google Chrome" "https://${LIGHTNING_HOSTNAME}/lightning/setup/ConnectedApplication/home"

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 --width 600 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Configure ConnectedApp' \
  --informative-text "
✔ Select 'FrontlinePharma' application
✔ Scroll to 'Custom Attributes' section
✔ Click 'New' button and enter:
    Attribute Key: roles
    Attribute value: 'agent' (with single quotes)
✔ Click 'Save' button
✔ Scroll to 'Profiles' section
✔ Click 'Manage Profiles' button
✔ Select 'Standard User' & 'System Administrator'
✔ Click 'Save' button

✔ Edit 'FrontlinePharma' application
✔ Scroll to 'OAuth Policies' section
✔ Click 'New' button and enter:
    Permitted Users: Admin approved users are pre-authorized
    IP Relaxation: Relax IP restrictions
✔ Click 'Save' button
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo '. configured connected app for frontline'
}


function authorize_salesforce_connected_app
# --------------------------------------------------------------------------------
# uses: LIGHTNING_HOSTNAME
# sets: SALESFORNCE_API_CONSUMER_KEY
# --------------------------------------------------------------------------------
{
  echo '---------- authorize salesforce connectedApp for frontline'

  open -a "Google Chrome"  https://${LIGHTNING_HOSTNAME}/lightning/setup/ConnectedApplication/home

  response=$(/Applications/CocoaDialog.app/Contents/MacOS/CocoaDialog inputbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --informative-text "Please Consumer Key from API (Enable OAuth Settings) section" \
  --button1 "Next" --button2 "Exit")
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi
  responseArray=(${response})
  SALESFORNCE_API_CONSUMER_KEY=${responseArray[1]}

  sfdx auth:jwt:grant
  --clientid {$SALESFORNCE_API_CONSUMER_KEY} \
  --jwtkeyfile assets/server.private.key \
  --username ${SALESFORCE_USERNAME} \
  --setdefaultdevhubusername --setalias 'owlhealth'

  echo '. authorized'
}


function configure_frontline_sso
# --------------------------------------------------------------------------------
# uses: SALESFORCE_HOSTNAME SALESFORCE_IDP_CERTIFICATE
# sets:
# --------------------------------------------------------------------------------
{
  echo '---------- configure frontline sso to salesforce'

  open -a "Google Chrome" "https://console.twilio.com/us1/develop/frontline/manage/single-sign-on?frameUrl=%2Fconsole%2Ffrontline%2Fsso%3Fx-target-region%3Dus1"

  response=$(/Applications/cocoaDialog.app/Contents/MacOS/cocoaDialog msgbox \
  --icon 'preferences' --icon-size 64  --float --posX 300 --posY 200 --width 600 \
  --string-output --no-newline \
  --title "${TITLE}" \
  --text 'Configure Frontline SSO' \
  --informative-text "
✔ Enter the following:
    Workspace ID = ${SALESFORCE_HOSTNAME%%.*}
    Identiy provider issuer = https://${SALESFORCE_HOSTNAME}
    SSO URL = https://${SALESFORCE_HOSTNAME}/idp/endpoint/HttpRedirect
    X.509 Certificate = paste below into text area

$(cat ~/Downloads/${SALESFORCE_IDP_CERTIFICATE}.crt)

✔ Click 'Save' button
" \
  --button1 'Next' --button2 'Exit')
  echo ". response: ${response}"
  if [[ "${response}" == "Exit"* ]]; then exit 1; fi

  echo '. sso configuration complete'
}


check_prerequisites

provision_twilio_account

check_twilio_credentials

check_twilio_account

check_organization

check_twilio_phone_number

provision_frontline

check_frontline_service

configure_frontline_service

check_salesforce_credentials

create_salesforce_idp_certificate

enable_salesforce_idp

create_salesforce_connected_app

configure_salesforce_connected_app

authorize_salesforce_connected_app

configure_frontline_sso

# deploy_serverless

# configure_frontline_blueprint

