# hls-frontline-pharma

- [Installation](#initial-installation)
- [Deploy Blueprint Service](#deploy-blueprint-service)
- [Developer Notes](#developer-notes)


---
---

## Initial Installation

This section details the requirements for a successful initial provisioning and installation of the blueprint application, including the necessary prerequisite steps, the variables that are needed to initiate installation, and the installation steps themselves.

- [Prerequsites](#prerequisites)
- [Retrieve Latest Blueprint from Github](#retrieve-latest-blueprint-from-github)
- [Provision Frontline Twilio Account](#provision-frontline-twilio-account)
- [Provision Salesforce Account](#provision-salesforce-account)
- [Deploy Frontline Serverless](#deploy-frontline-serverless)
- [Configure Frontline SSO to Salesforce](#configure-frontline-sso-with-salesforce)

---
### Prerequisites

The following prerequisites must be satisfied prior to installing the application.

#### Docker Desktop

Install Docker desktop that includes docker compose CLI will be used to run the application installer locally on your machine.
Goto [Docker Desktop](https://www.docker.com/products/docker-desktop) and install with default options.
After installation make sure to start Docker desktop.

#### SalesForce CLI (sfdx)

- Download and install from https://developer.salesforce.com/tools/sfdxcli.
- To verify installation, go to a terminal and run
  ```shell
  sfdx --version
  ```
  If a version number is printed, you have installed the CLI correctly.


---
### Retrieve Latest Blueprint from Github

- If this is your first time installing this blueprint, open a terminal and execute the following:

  ```shell
  git clone https://github.com/twilio/hls-frontline-pharma.git
  ```

- Otherwise, open a terminal and `cd` to the `hls-frontline-pharma` folder and execute the following:

  ```shell
  git pull
  ```

---

### Provision Frontline Twilio Account

A separate Twilio account is required for Frontline.
Note that Flex service **CANNOT** be enabled on this Twilio account.

#### 1. Create New Twilio Account

- Account creation page at https://www.twilio.com/console/projects/create

  - Set account name to `hls-frontline-pharma` & click 'Verify' button
  - Verify the new Twilio account either via email or phone
  - Once the Twilio account is created,
    please note the `Account SID` and `Auth Token` from the [Twilio console](https://console.twilio.com/) for later use.
  - *If you have multiple Twilio Projects under your account, make sure that you are logged into the Project that you want the application to be deployed to.*

- If you don't already have a Twilio account, goto Free trial page at https://www.twilio.com/try-twilio


<sub>*If you have multiple Twilio Projects under your account, make sure that you are logged into the Project that you want the application to be deployed to.*</sub>


#### 2. Create Organization

- Open Admin Center at https://www.twilio.com/console/admin
- If opening errors, then look for `'Create an Organization'` menu item from the console account selection menu
- Click `'Create an Organization'`
- Create an organization, you can name it anything (e.g., OwlHealth)


#### 3. Buy Twilio Phone Number

- Open Active numbers page at https://www.twilio.com/console/phone-numbers/incoming
- Click ![](https://img.shields.io/badge/-Buy_a_Number-blue)
- Find a phone number that has SMS & Voice capabilties
- Click ![](https://img.shields.io/badge/-Buy-blue) on the right of the phone number


<sub>*If you intend to send outbound SMS from this Twilio account, please get the account upgraded to an employee acount.*</sub>


#### 4. Create Frontline Service

- Open Frontline Overview page at https://www.twilio.com/console/frontline
- Click ![](https://img.shields.io/badge/-Create_Frontline_service-blue)
  - In `'Set Frontline service as your default'` pop-up window, check the checkbox
  - Click ![](https://img.shields.io/badge/-Confirm-blue)
  - Wait until complete ... if you encounter an error message, please check with HLS engineering team.
- After your Frontline service is created, you'll see 4 list items under `'Configure the Frontline application'`
  where the first step should be completed (striked-out) for you already.


#### 5. Configure Frontline Service

- Open Conversations Defaults page at https://www.twilio.com/console/conversations/configuration/defaults
- Changed `Handle Inbound Messages with Conversations`
  from ![](https://img.shields.io/badge/-LOCKED-blue) to ![](https://img.shields.io/badge/-UNLOCKED-blue)
- Click ![](https://img.shields.io/badge/-Save-blue) at the bottom


- Click ![](https://img.shields.io/badge/-View_Service-blue) of `Default Messaging Service`
  to open Messaging Integration page
- Select `Autocreate a Conversation` radio button
- Click ![](https://img.shields.io/badge/-Save-blue) at the bottom


- Select `Sender Pool` in the left pane
- Click ![](https://img.shields.io/badge/-Add_Senders-blue)
- Keep Sender Type as `'Phone Number'`
- Click ![](https://img.shields.io/badge/-Continue-blue)
- Select checkbox next to your Twilio phone number bought above.
  (lookup at https://www.twilio.com/console/phone-numbers/incoming)
- Click ![](https://img.shields.io/badge/-Add_Phone_Numbers-blue)


#### 6. Frontline SSO Realm SID
- Open Frontline Configure SSO page at https://www.twilio.com/console/frontline/sso
- Note Realm SID (e.g., `JBccd16179731fe20736f887e6eXXXXXXX`)<br/>
  and save by executing `source ./configuration.sh FRONTLINE_REALM_SID`


---
### Provision Salesforce Account

Frontline requires that there is a SSO integrated with your App in order to sign in to the Frontline app.
For that we'll need a Salesforce Developer Account.


#### 1. Provision Salesforce Account

- Open sign up page at https://developer.salesforce.com/signup
- Enter the following information:

  |Field|Value|
  |---:|---|
  |First Name|`your-first-name`
  |Last Name|`your-last-name`
  |Email|`your-twilio-email +1`<br/>(e.g., `bochoi+sf@twilio.com` to identify email used per sign-up)
  |Role|*Developer*
  |Company|*Twilio*
  |Country/Region|*United States*
  |Postal Code|*94105*
  |Username|`login-name-to-use` (e.g., `bj@owlhealth.com`.<br/>Note that username can be different from email and used to log into frontline app) 

- Click ![](https://img.shields.io/badge/-Sign_me_Up-blue)
- Wait until you see `'Please check your email to confirm your account'`
- Wait until you receive email with subject `'Welcome to Salesforce: Verify your account'`
- Open the email and note the following:
  - Salesforce URL (e.g., https\://twilio-b3-dev-ed.my.salesforce.com)<br/>
    and save by executing `source ./configuration.sh SALESFORCE_URL`
  - Username above entered during sign-up<br/>
    and save by executing `source ./configuration.sh SALESFORCE_USERNAME`
- Click ![](https://img.shields.io/badge/-Verify_Account-blue)
- In `Change Your Password` page, enter your password and remember it as you'll need it to login on the frontline app
- Click ![](https://img.shields.io/badge/-Change_Password-blue)
- You will be logged into your Salesforce account
  - **LIGHTNING_HOSTNAME**: used below (e.g., twilio-b3-dev-ed.lightning.force.com)


#### 2. Create IDP Certificate

- From `Setup Home`, navigate to `SETTINGS ⮕ Security ⮕ Certificate and Key Management`
  - https://**LIGHTNING_HOSTNAME**/lightning/setup/CertificatesAndKeysManagement/home
- Click ![](https://img.shields.io/badge/-Create_Self_Signed_Certificate-blue)
- Enter the following information:

  |Field|Value|
  |---:|---|
  |Label|*SalesforceIDP*
  |Unique Name|*SalesforceIDP*
  |Exportable Private Key|✔
  |Key Size|*2048*
  |Company|*Twilio*
  |Country/Region|*United States*
  |Postal Code|*94105*

- Click ![](https://img.shields.io/badge/-Save-blue)
- Click ![](https://img.shields.io/badge/-Download_Certificate-blue) that will download `SalesforceIDP.crt` file to `~/Downloads` folder for later use


#### 3. Enable Identity Provider

- From `Setup Home`, navigate to `SETTINGS ⮕ Identity ⮕ Identity Provider`
  - https://**LIGHTNING_HOSTNAME**/lightning/setup/IdpPage/home
- Click ![](https://img.shields.io/badge/-Enable_Identity_Provider-blue)
- Select certificate `SalesforceIDP`
- Click ![](https://img.shields.io/badge/-Save-blue)
- Select ![](https://img.shields.io/badge/-OK-blue) to warning dialog about IdP Certificate change


#### 4. Create ConnectedApp for Frontline

- From `Setup Home`, navigate to `PLATFORM TOOLS ⮕ Apps ⮕ App Manager`
  - https://**LIGHTNING_HOSTNAME**/lightning/setup/NavigationMenus/home
- Click ![](https://img.shields.io/badge/-New_Connected_App-blue) in upper right
- In `Basic Information` section, fill in the following:

  |Field|Value|
    |---:|---|
  |Connected App Name|*FrontlinePharma*
  |API Name|*FrontlinePharma*
  |Contact Email|`email-used-to-sign-up` (e.g., bochoi+sf@twilio.com)

- In `API (Enable OAuth Settings)` section, enter the following:

  |Field|Value|
  |---:|---|
  |Enable OAuth Settings|✔
  |Callback URL|*https\://login.salesforce.com/services/oauth2/success*
  |Use digital signatures|✔ and click ![](https://img.shields.io/badge/-Choose_File-blue) and upload `hls-frontline-pharma/assets/server.crt`
  |Selected OAuth Scopes|Add `Manage user data via APIs (api)` & `Perform requests at any time (refresh_token, offline_access)` to 'Selected OAuth Scopes'

- In `Web App Settings` section, enter the following replacing **FRONTLINE_REALM_SID** with your Realm SID<br/>
  or generate by executing `source ./configuration.sh`:

  |Field|Value|
  |---:|---|
  |Enable SAML|✔
  |Entity Id|*https\://iam.twilio.com/v2/saml2/metadata/__FRONTLINE_REALM_SID__*
  |ACS URL|*https\://iam.twilio.com/v2/saml2/authenticate/__FRONTLINE_REALM_SID__*
  |IdP Certificate|*SalesforceIDP*

- Click ![](https://img.shields.io/badge/-Save-blue) at the bottom
- Click ![](https://img.shields.io/badge/-Continue-blue) on the next page


#### 5. Configure FrontlinePharma ConnectedApp

- From `Setup Home`, navigate to `PLATFORM TOOLS ⮕ Apps ⮕ Connected Apps ⮕ Manage Connected Apps`
  - https://**LIGHTNING_HOSTNAME**/lightning/setup/ConnectedApplication/home
- Select `FrontlinePharma` app
- Scroll down to `Profiles` section
  - Click ![](https://img.shields.io/badge/-Manage_Profiles-blue)
  - Select `Standard User` & `System Administrator` profiles
  - Click ![](https://img.shields.io/badge/-Save-blue) at the bottom right
- Scroll down to `Custom Attributes` section
  - Click ![](https://img.shields.io/badge/-New-blue)
  - Enter `Attribute Key` to `roles`
  - Enter `Attribute value` to `'agent'` (including enclosing single quotes)
  - Click ![](https://img.shields.io/badge/-Save-blue)
  

- From `Setup Home`, navigate to `PLATFORM TOOLS ⮕ Apps ⮕ Connected Apps ⮕ Manage Connected Apps`
  - https://**LIGHTNING_HOSTNAME**/lightning/setup/ConnectedApplication/home
- Click ![](https://img.shields.io/badge/-Edit-blue) button to the left of `FrontlinePharma` App
- In `OAuth Policies` section,

  |Field|Value|
  |---:|---|
  |Permitted Users|Change to `Admin approved users are pre-authorized`
  |IP Relaxation|Change to `Relax IP restrictions`

- Click ![](https://img.shields.io/badge/-Save-blue) button at the bottom


#### 6. Authorize ConnectedApp to Frontline

- From `Setup Home`, navigate to `PLATFORM TOOLS ⮕ Apps ⮕ App Manager`
  - https://**LIGHTNING_HOSTNAME**/lightning/setup/NavigationMenus/home
- Locate `FrontlinePharma` app and click ![](https://img.shields.io/badge/-View-blue) from the right drop down menu
- In `API (Enable OAuth Settings)` section:
  - Save Consumer Key by executing `source ./configuration.sh SALESFORCE_API_KEY`
- Open a terminal and cd to your `hls-frontline-pharma` folder
- Execute the following script replacing **SALESFORCE_API_KEY** and **SALESFORCE_USERNAME** below with your values<br/>
  or generate by executing `source ./configuration.sh`

  ```shell
  sfdx auth:jwt:grant \
  --clientid SALESFORCE_API_KEY \
  --jwtkeyfile assets/server.private.key \
  --username SALESFORCE_USERNAME \
  --setdefaultdevhubusername --setalias owlhealth
  ```

---
### Deploy Frontline Serverless

Follow the steps in [Deploy Blueprint Service](#deploy-blueprint-service)


---
### Configure Frontline SSO with Salesforce


#### 1. Configure Frontline SSS

- Open Frontline Configure SSO page at https://www.twilio.com/console/frontline/sso
- Enter the following, replacing **SALESFORCE_URL** or execute `source ./configuration.sh`:

  |Field|Value|
  |---:|---|
  |Workspace ID|Subdomain of **SALESFORCE_URL**<br/>(e.g., twilio-b3-dev-ed)
  |Identiy provider issuer|**SALESFORCE_URL**
  |SSO URL|**SALESFORCE_URL**/idp/endpoint/HttpRedirect
  |X.509 Certificate|paste the contents of executing `cat ~/Download/SalesforceIDP.crt`<br/><br/>`-----BEGIN CERTIFICATE-----`<br/>`MIIEcjCCA1qgAwIBAgIOAYD5aqycAAAAABDSggIwDQYJKoZIhvcNAQELBQAwfjEW`<br/>...<br/>`-----END CERTIFICATE-----`

- Click ![](https://img.shields.io/badge/-Save-blue) button at the bottom


#### 2. Configure Frontline Routing & Callbacks

- Open Functions Services at https://www.twilio.com/console/functions/overview/services
- Click service named `hls-frontline-pharma`
- Scroll to the bottom and note the hostname just above ![](https://img.shields.io/badge/-Deploy_All-blue) button (e.g., hls-frontline-pharma-6110-dev.twil.io)<br/>
  and save by executing `source ./configuration.sh FRONTLINE_SERVICE_HOSTNAME`


- Open Frontline Manage Routing at https://www.twilio.com/console/frontline/routing
- Click on `'Custom routing'` radio button
- Enter for 'Custom routing callback URL', `https://FRONTLINE_SERVICE_HOSTNAME/inbound-routing`
- Click ![](https://img.shields.io/badge/-Save-blue) button at the bottom


- Open Frontline Manage Callbacks https://www.twilio.com/console/frontline/configure
- Enter following by replacing **FRONTLINE_SERVICE_HOSTNAME** or executing `source ./configuration.sh`:

  |Field|Value|
  |---:|---|
  |CRM Callback URL                   |https://**FRONTLINE_SERVICE_HOSTNAME**/crm
  |Outgoing Conversations Callback URL|https://**FRONTLINE_SERVICE_HOSTNAME**/outgoing-conversation
  |Templates Callback URL             |https://**FRONTLINE_SERVICE_HOSTNAME**/template

- Click ![](https://img.shields.io/badge/-Save-blue) button at the bottom


#### 3. Configure Conversation Global Webhooks

- Open Conversations Webhooks https://www.twilio.com/console/conversations/configuration/webhooks
- Enter following by replacing **FRONTLINE_SERVICE_HOSTNAME** or executing `source ./configuration.sh`:

  |Field|Value|
  |---:|---|
  |Pre-Event URL |https://**FRONTLINE_SERVICE_HOSTNAME**/conversation
  |Post-Event URL|https://**FRONTLINE_SERVICE_HOSTNAME**/conversation
  |Pre-webhooks  |Select<br/>`onConversationAdd`<br/>`onMessageAdd`<br/>`onParticipantAdd`
  |Post-webhooks |Select<br/>`onConversationAdded`, `onConversationUpdated`, `onConversationStateUpdated`<br/>`onMessageAdded`<br/>`onParticipantAdded`

- Click ![](https://img.shields.io/badge/-Save-blue) button at the bottom


#### 4. Configure Voice Integration

- Open Frontline Manage Callbacks https://www.twilio.com/console/frontline/voice
- Select `Enabled` radio button
- Click ![](https://img.shields.io/badge/-Save-blue)


- Open Active numbers page at https://www.twilio.com/console/phone-numbers/incoming
- Select your Twilio phone number
- Scroll down to `Voice & Fax` section
  - In 'Configure With' dropdown, select `TwiML App`
  - In the 'TWIML APP' dropdown, select `Voice in Frontline`
  - Click ![](https://img.shields.io/badge/-Save-blue) at the bottom


#### 5. Configure Frontline Mobile App

- Open Frontline at https://www.twilio.com/console/frontline
- If configuration was succesful, you should be `'Download the Twilio Frontline app'` section
- Download the Frontline app
  - [iOS App Store](https://apps.apple.com/us/app/twilio-frontline/id1541714273)
  - [Google Play Store](https://play.google.com/store/apps/details?id=com.twilio.frontline)
- Start the Frontline app on your mobile device
- Login using **FRONTLINE_WORKSPACE_ID** (Frontline Workspace ID) and **SALESFORCE_USERNAME**
- If logging in for the first time, email with subject 'Verify your identity in Salesforce'
  will be sent to your email used to sign up for Salesforce account above.

  
#### A. Common Problems/Errors:

- **Outbound routing is not working:**
  - Usually happens when a Salesforce Contact's phone number is not in E. 164 Format "+1234567890"


---
---
## Deploy Blueprint Service

Frontline Twilio & Salesforce accounts must be already provisioned.

Please ensure that you do not have any running processes
that is listening on port `3000`
such as development servers or another HLS installer still running.

Make sure to increase the docker desktop memory from default 2GB to 6GB.

#### 1. Build Installer Docker Image

```shell
docker build --tag hls-frontline-pharma-installer --no-cache .
```

If running on Apple Silicon (M1 chip), add `--platform linux/amd64` option.

#### 2. Run Installer Docker Container

Replace `${TWILIO_ACCOUNT_SID}` and `${TWILIO_AUTH_TOKEN}` with that of your target Twilio account.

```shell
docker run --name hls-frontline-pharma-installer --rm --publish 3000:3000  \
--env ACCOUNT_SID=${TWILIO_ACCOUNT_SID} --env AUTH_TOKEN=${TWILIO_AUTH_TOKEN} \
--interactive --tty hls-frontline-pharma-installer
```

If running on Apple Silicon (M1 chip), add `--platform linux/amd64` option.


#### 3. Open installer in browser

- Open http://localhost:3000/installer/index.html
- Enter the following information:

  |Field|Value|
  |---:|---|
  |Administrator|Your mobile phone number for receiving MFA in E.164 format
  |Application Password|password for applciation administrator page access<br/>(recommend just using `password`)
  |Sf Consumer Key|**SALESFORCE_API_KEY**
  |Sf Username|**SALESFORCE_USERNAME**
  |Sf Instance Url|**SALESFORCE_URL**<br/>(e.g., https\://twilio-b3-dev-ed.my.salesforce.com)

- Click ![](https://img.shields.io/badge/-Deploy-blue) at the bottom and wait ...
- When *'✔ Application is deployed'*, deployment is complete


#### 4. Terminate installer

To terminate installer:

- Enter Control-C in the terminal where `docker run ...` was executed; or
- Stop the `hls-frontline-pharma-installer` docker container via the Docker Desktop



---
---
## Developer Notes

TBD
