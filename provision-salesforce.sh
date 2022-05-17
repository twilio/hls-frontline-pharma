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
echo "TWILIO_ACCOUNT_NAME: ${TWILIO_ACCOUNT_NAME} (must be frontline enabled)"
echo "================================================================================"

echo ---------- check salesforce account --------------------------------------------------
while
  echo -n 'Have you created your Salesforce account? [y/n]: '
  read yn
  if [[ "${yn}" != "y" ]]; then
    echo 'Sign-up for a Salesforce Developer account'
    echo 'Use same email that you will use to login into the Frontline Twilio account'
    echo 'Opening https://developer.salesforce.com/signup ...'
    open -a "Google Chrome" https://developer.salesforce.com/signup
  fi
  [[ "${yn}" != "y" ]]
do :; done

echo -n 'Enter hostname of your Salesforce account (e.g., twilio119-dev-ed.my.salesforce.com): '
read SALESFORCE_HOSTNAME
echo "SALESFORCE_HOSTNAME: ${SALESFORCE_HOSTNAME}"

echo ---------- log into salesforce account --------------------------------------------------
echo 'Login into your Salesforce account'
URL="https://${SALESFORCE_HOSTNAME}/"
echo "Opening ${URL}"
open -a "Google Chrome" "${URL}"
yn="n"
while
  echo -n 'Logged into your Salesforce account? [y/n] '
  read yn
  [[ "${yn}" != "y" ]]
do :; done

LIGHTNING_HOSTNAME=${SALESFORCE_HOSTNAME/my.salesforce/lightning.force}
echo "LIGHTNING_HOSTNAME= ${LIGHTNING_HOSTNAME}"

echo ---------- create self-signed certificate --------------------------------------------------
URL="https://${LIGHTNING_HOSTNAME}/one/one.app#/setup/CertificatesAndKeysManagement/home"
echo "Opening ${URL}"
echo "Click 'Create Self-Signed Certificate' button"
echo "Enter the following:"
echo "  Label                 : FrontlinePharmaSSO"
echo "  Unique Name           : FrontlinePharmaSSO"
echo "  Exportable Private Key: checked"
echo "  Key Size              : 2048"
echo "Hit 'Save' button to create"
open -a "Google Chrome" "${URL}"

echo "Click 'Download Certificate' button and save it on your laptop to use later"
echo "default location: ~/Downloads/FrontlinePharmaSSO.crt"

yn="n"
while
  echo -n 'Self-signed certificate created & downloaded? [y/n] '
  read yn
  [[ "${yn}" != "y" ]]
do :; done

if [[ -f ~/Downloads/FrontlinePharmaSSO.crt ]]; then
  echo "Found certificate at ~/Downloads/FrontlinePharmaSSO.crt"
else
  echo "Not found certificate at ~/Downloads/FrontlinePharmaSSO.crt"
fi

echo ---------- enable Salesforce IDP --------------------------------------------------
URL="https://${LIGHTNING_HOSTNAME}/one/one.app#/setup/IdpPage/home"
echo "Opening ${URL}"
echo "Press 'Enable Identity Provider' button"
echo "Find & select the certificate you created previously (named FrontlinePharmaSSO)"
echo "Hit 'Save' button'"
echo "Select 'OK' to warning dialog about IdP Certificate change"
open -a "Google Chrome" "${URL}"

yn="n"
while
  echo -n 'Salesforce IDP enabled? [y/n] '
  read yn
  [[ "${yn}" != "y" ]]
do :; done

echo ---------- create Salesforce ConnectedApp for frontline --------------------------------------------------
URL="https://console.twilio.com/us1/develop/frontline/manage/single-sign-on?frameUrl=%2Fconsole%2Ffrontline%2Fsso%3Fx-target-region%3Dus1"
echo "Opening ${URL}"
echo "Copy the Realm SID (e.g., JBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)"
open -a "Google Chrome" "${URL}"
while
  echo -n 'Enter Twilio Frontline Realm SID: '
  read FRONTLINE_REALM_SID
  [[ -z "${FRONTLINE_REALM_SID}" ]]
do :; done
echo "FRONTLINE_REALM_SID=${FRONTLINE_REALM_SID}"


URL="https://${LIGHTNING_HOSTNAME}/one/one.app#/setup/NavigationMenus/home"
echo "Opening ${URL}"
echo "Click 'New Connected App' button"
echo "In 'Basic Information' section, enter:"
echo "  Connected App Name: FrontlinePharma"
echo "  API Name          : FrontlinePharma"
echo "  Contact Email     : emailed used to signup for salesforce account"
echo "In 'Web App Settings' section, check 'Enable SAML' and enter:"
echo "  Entity Id                          : https://iam.twilio.com/v2/saml2/metadata/${FRONTLINE_REALM_SID}"
echo "  ACS URL                            : https://iam.twilio.com/v2/saml2/authenticate/${FRONTLINE_REALM_SID}"
echo "  Subject Type              (default): Username"
echo "  Name ID Format            (default): urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"
echo "  Issuer                    (default): https://${SALESFORCE_HOSTNAME}"
echo "  IdP Certificate                    : FrontlinePharmaSSO"
echo "  Verify Request Signatures (default): unchecked"
echo "  Encrypt SAML Response     (default): unchecked"
echo "Hit 'Save'button"
open -a "Google Chrome" "${URL}"

yn="n"
while
  echo -n 'Created ConnectedApp? [y/n] '
  read yn
  [[ "${yn}" != "y" ]]
do :; done

echo ---------- add custom attributes to ConnectedApp --------------------------------------------------
URL="https://${LIGHTNING_HOSTNAME}/lightning/setup/ConnectedApplication/home"
echo "Opening ${URL}"
echo "Select 'FrontlinePharma' application"
echo "Scroll to the bottom 'Custom Attributes' section"
echo "Click 'New' button"
echo "Enter:"
echo "  Attribute Key  : roles"
echo "  Attribute value: 'agent'"
echo "Click 'Save' button"
open -a "Google Chrome" "${URL}"

yn="n"
while
  echo -n 'Added custom attributes? [y/n] '
  read yn
  [[ "${yn}" != "y" ]]
do :; done


echo ---------- assign profiles to access FrontlinePharma ConnectedApp --------------------------------------------------
URL="https://${LIGHTNING_HOSTNAME}/lightning/setup/ConnectedApplication/home"
echo "Opening ${URL}"
echo "Select 'FrontlinePharma' application"
echo "Scroll to 'Profiles' section"
echo "Click 'Manage Profiles' button"
echo "Select 'Standard User' & 'System Administrator'"
echo "Click 'Save' button"
open -a "Google Chrome" "${URL}"

yn="n"
while
  echo -n 'Assigned profile to access? [y/n] '
  read yn
  [[ "${yn}" != "y" ]]
do :; done

echo ---------- Salesforce SSO provisioning is complete --------------------------------------------------

echo ---------- Configure Frontline SSO to Salesforce --------------------------------------------------
URL="https://console.twilio.com/us1/develop/frontline/manage/single-sign-on?frameUrl=%2Fconsole%2Ffrontline%2Fsso%3Fx-target-region%3Dus1"
echo "Opening ${URL}"
echo "Enter:"
echo "  Workspace ID           : ${SALESFORCE_HOSTNAME%%.*}"
echo "  Identiy provider issuer: https://${SALESFORCE_HOSTNAME}"
echo "  SSO URL                : https://${SALESFORCE_HOSTNAME}/idp/endpoint/HttpRedirect"
echo "  X.509 Certificate      : paste below into text area"
cat ~/Downloads/FrontlinePharmaSSO.crt
echo "Click 'Save' button"
open -a "Google Chrome" "${URL}"

yn="n"
while
  echo -n 'Assigned profile to access? [y/n] '
  read yn
  [[ "${yn}" != "y" ]]
do :; done

echo ---------- Launch Frontline Mobile App --------------------------------------------------
