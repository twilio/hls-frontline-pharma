# hls-frontline-pharma

_This document is intended to serve as a technical guide for customers
who are interested in setting up an instance of Frontline that uses Salesforce as its CRM in a pharmaceutical context._

_Installation of this application is supported using the latest versions of Chrome and Firefox.
Installation via Internet Explorer has not been officially tested and although issues are not expected, unforeseen problems may occur._

- [Installation Information](#install)
- [Application Overview](#application)
- [Architecture & Components](#architecture)

## Installation Information

This section details the requirements for a successful deployment and installation of the prototype application, including the necessary prerequisite steps, the variables that are needed to initiate installation, and the installation steps themselves.

### Prerequisites

---

The following prerequisites must be satisfied prior to installing the application.

#### Frontline Twilio account

- Create a Twilio account by signing up [here](https://www.twilio.com/try-twilio)
- Once the Twilio account is created,
  please note the “ACCOUNT SID” and “AUTH TOKEN”
  from the [Twilio console](https://console.twilio.com/) for use below
- If you have multiple Twilio Projects under your account, make sure that you are logged into the Project that you want the application to be deployed to
- Search for "Frontline" in the search bar at the top of the Twilio console and select "Overview" in the results
- Click the "Create Frontline Service" button

### Download SalesForce CLI

- Install [this](https://developer.salesforce.com/tools/sfdxcli) tool.
- To verify installation, go to a terminal and run `sdfx -v`. If a version number is printed, you have installed the CLI correctly.

#### Twilio phone number

- After provisioning your Twilio account,
  you will need to [purchase a phone number](https://www.twilio.com/console/phone-numbers/incoming)
  to use in the application
- Make sure the phone number is SMS enabled
- (This will be the phone number patients receive texts from)
- <em>Note: authentication is required in order to complete deployment via the application page,
  which will generate a nominal SMS charge to your connected Twilio account.
  Each authentication SMS sent will cost $0.0075,
  plus an additional $0.05 per successful authentication
  (multi-factor authentication leverages Twilio Verify).
  See Twilio SMS pricing and Twilio Verify pricing for more information.</em>

#### Ensure unique application name

In order to deploy correctly, it is important
that you do not have an existing Twilio Functions Service called ‘hls-frontline-pharma.’
If you do, you will need to delete (or appropriately update the existing name of)
the existing functions service to ensure a conflict doesn’t occur during installation.
You can delete the existing Functions service via executing `make delete`
in the application directory `hls-frontline-pharma` using a terminal or a command prompt.

#### Salesforce Setup

Frontline requires that there is a SSO integrated with your App in order to sign in to the Frontline app. For that we'll need a main Salesforce Developer Account. Ensure that you have already signed up for a Twilio Account and created a bare Twilio Frontline Service within that account.

- First, sign-up for a Salesforce Developer account [here](https://developer.salesforce.com/signup)
- Next we'll need to Create a self-signed certificate in Salesforce
  - In the SalesForce console, go to Setup by clicking the gear icon in the menu bar
  - On the Left Panel go to Settings -> Security -> Certificate and Key Management
  - Click "Create Self-Signed Certificate"
  - Label and Unique name can be the same (ex: SalesforceSSO)
  - Key Size default of 2048
  - Hit Save to create.
  - Download the Certificate afterwards and save it somewhere as we will need this later on for Frontline
- We'll need to Enable Salesforce Identity Provider in Salesforce
  - In Salesforce on the left navigation panel, go to Settings -> Identity -> Identity Provider
  - Press "Enable Identity Provider"
  - Find the certificate You created previously with the unique name you gave it and hit save
- Create your Frontline Service
  - In the [Twilio Console](https://console.twilio.com/?frameUrl=/console), search for "Frontline" in the search bar at the top of the page and select "Overview"
  - Click on the blue button that says "Create Frontline service" (assuming you haven't already) and click "Confirm"
  - After your Frontline service is provisioned, you'll see 4 list items (which are hyperlinks) for which you'll want complete in order
  - Step 4, labeled, "Connect your CRM", will be for later. Just finish steps 1-3 for now
    1. First step should be completed for you already
    2. Click on step 2 and on the right panel Unlock "Handle Inbound Messages with Conversations" by clicking the box next to it and hit save at the bottom of the page
    3. Go to Frontline's Overview and click on step 3, "Enable `Autocreate a Conversation`" and click on "Autocreate a Conversation". Then click on "Sender Pool" and add your phone number you bought from a previous step to the Sender pool.
- Get your Twilio Frontline Realm SID
  - In the [Twilio Console](https://console.twilio.com/?frameUrl=/console), search for "Frontline" in the search bar at the top of the page and select "Overview"
  - On the left bar, select Manage > SSO/Log in
  - Copy your Realm SID (i.e. JBccd16179731fe20736f887e6eXXXXXXX)
- Create a Connected App in Salesforce for Frontline

  - On the left-hand panel, navigate to Platform Tools -> Apps -> App Manager
  - Press "New Connected App"
  - Fill in just the red-highlighted portion:
    - Connected App Name
    - API Name
    - Contact Email
  - Scroll down to "API (Enable OAuth Settings)" and tick "Enable OAuth Settings"
    - Paste `https://login.salesforce.com/services/oauth2/success` into "Callback URL"
    - In "Available OAuth Scopes" select both Manage user data via APIs (api) and Perform requests at any time (refresh_token, offline_accss) and add them to "Selected OAuth Scopes" with the Add arrow
    - Create server.crt and server.key files using [these](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_key_and_cert.htm) instructions
    - Tick "Use digital signatures" and select Choose File, selecting server.crt that you just created and hit save
    - Next on the left panel, navigate to Platform Tools -> Apps -> Connected App -> Manage Connected Apps
      - On the page under the "Action" Column of your connected app, click on "Edit"
      - Under "OAuth Policies":
        - Change "Permitted Users" to "Admin approved users are pre-authorized"
        - Change "IP Relaxation" to "Relax IP restrictions"
        - Hit Save at the bottom
    - Now on the left hand panel, navigate to Administration -> Users -> Profiles and find the "System Administrator" profile and click on it.
      - Click Edit at the top and under "Connected App Access", check on your connected app's name that we created and hit save
    - In a terminal window, run the following code, replacing the variables in triangular brackets:
      - You can find the values for <your_cusumer_key> in the next page after you hit save
      - Your <your_sf_username> can be found by clicking on your avatar in the top right corner and clicking on "Settings"
      - <your_org_name> is usually what you entered when you did the cert step above

  ```bash
  sfdx auth:jwt:grant --clientid <your_consumer_key> \
  --jwtkeyfile <path_to_server.key> --username <your_sf_username> \
  --setdefaultdevhubusername --setalias <your_org_name>
  ```

- Scroll down to the "Web App Settings" portion and tick "Enable SAML"
  - Set "Entity Id" to `https://iam.twilio.com/v2/saml2/metadata/<REALM_SID>` replacing <REALM_SID> with what you recorded in the previous section.
  - Set "ACS URL" to `https://iam.twilio.com/v2/saml2/authenticate/<REALM_SID>`
  - Set "Subject Type" to `Username`
  - Set "Name ID Format" to `urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified`
  - Set "Issuer" to `https://yourdomain.my.salesforce.com`
    - The above url can be found by click on your avatar in the top right corner of the Salesforce Console
  - Set "IdP Certificate" to the you created in the first step (ex. SalesforceSSO)
  - Untick "Verify Request Signatures" and "Encrypt SAML Response"
  - Hit Save
- Add Custom Attributes
  - Now in the left panel, navigate to Platform Tools -> Apps -> Connected Apps -> Manage Connected Apps
  - Click on your App
  - Scroll to the bottom where it says "Custom Attributes" and click "New"
  - "Attribute Key" should be "roles" (excluding the double quotes), and the large Text box should be 'agent' (including the single quotes)
  - Hit Save
- Assign Profile Access to the Connected App
  - Depending on who you would like to access your App, you'll want to grant access to all Salesforce Users who you would like to SSO into Frontline
    - In the left Panel, go to Administration -> Users -> Profiles
    - Select the profile that you want to grant a user, for our case, the Salesforce Account creator would be "System Administrator" so find and click that
    - Scroll down to "Connected App Access" and tick the Connected App Name we created in the previous steps
    - Now Hit Save
- Setup SSO in Frontline
  - In the Twilio console, on the left panel, navigate to Frontline -> Manage -> SSO/Log in
  - Set "Workspace ID" to whatever you want (Org/Company Name)
  - Set "Identiy provider issuer" to `https://yourdomain.my.salesforce.com` where you can find the "yourdomain" URL mentioned in the Salesforce console by clicking on the avatar in the top right corner
  - Set "SSO URL" to `https://yourdomain.my.salesforce.com/idp/endpoint/HttpRedirect`
  - Open your certificate you downloaded in the first step in a text editor and paste the contents inside the "X.509 Certificate" text box.
  - Hit Save
- Deploy your Serverless Project which are the functions in this repo
  - First take the `server.key` file in the `/JWT` directory we created in a previous step and move it to the `/assets` folder of this repo and rename `server.key` to `server.private.key` (This is the Salesforce key which will be cached inside Twilio Sync)
  - Fill out all the fields in `.env` file (SYNC_SID optional as it will be created)
  - run `make service-deploy` at the root level of this directory which deploys your serverless functions needed to connect Frontline and Salesforce
  - Take note of 5 [protected] endpoints after the deployment completes needed for the next 3 steps:
    - `https://hls-frontline-pharma-XXXX-dev.twil.io/inbound-routing`
    - `https://hls-frontline-pharma-XXXX-dev.twil.io/conversation`
    - `https://hls-frontline-pharma-XXXX-dev.twil.io/crm`
    - `https://hls-frontline-pharma-XXXX-dev.twil.io/outgoing-conversation`
    - `https://hls-frontline-pharma-XXXX-dev.twil.io/templates`
- Configure Inbound Routing
  - On your Frontline console, navigate to Frontline -> Manage -> Routing
  - Click on "Custom routing callback URL" and fill in the URL with the first URL above which ends in "/inbound-routing"
- Configure Conversations Global Webhooks
  - On the Twilio Console, on the left panel, navigate to Conversations -> Manage -> Global Webhooks
  - On the page, paste in your `https://hls-frontline-pharma-XXXX-dev.twil.io/conversation` URL to both the "Pre-Event URL" and "Post-Event URL", keep the method to be "HTTP POST"
  - Under "Webhook Filtering" Section check the following boxes:
    - `onConversationAdd`
    - `onMessageAdd`
    - `onParticipantAdd`
    - `onConversationAdded`
    - `onConversationStateUpdated`
    - `onMessageAdded`
    - `onParticipantAdded`
  - Hit Save
- Configure Voice Integration with Frontline
  - In the left Twilio Console Panel, navigate to Frontline -> Manage -> Voice Calling
  - Under "Manage inbound and outbound voice calls", click the "Enabled" Radio button and hit Save
  - Next go the to console and in the left panel, navigate to Phone Numbers -> Manage -> Active Numbers and click on the phone number associated with your Frontline App
  - Scroll down to the "Voice" or "Voice & Fax" section
    - In the "Configure With" dropdown, select "TwiML App"
    - In the "TwiML App dropdown select "Voice in Frontline" and hit save
- Finish Configuring/Connecting your CRM
  - Go to Frontline Overview
  - Step 4 should be the last step to complete now click it
  - Fill in the 3 callback URLs from the previous step and click save
- You're all done! Now Download the Frontline app in the [iOS App Store](https://apps.apple.com/us/app/twilio-frontline/id1541714273) or [Google Play Store](https://play.google.com/store/apps/details?id=com.twilio.frontline)
  and log in with the Workspace ID from the last step and your Salesforce Account Credentials

#### Common Problems/Errors:

- Outbound routing is not working:
  - Usually happens when a Salesforce Contact's phone number is not in E. 164 Format "+1234567890"

#### Configuring Twilio to Work with Your SalesForce Instance

#### Docker Desktop

Install Docker desktop that includes docker compose CLI will be used to run the application installer locally on your machine.
Goto [Docker Desktop](https://www.docker.com/products/docker-desktop) and install with default options.
After installation make sure to start Docker desktop.

#### jq & xq

```shell
$ brew install jq           # install jq
...
$ jq --version              # confirm installation
jq-1.6
$ brew install python-yq    # install yq/xq
...
$ yq --version              # confirm installation
yq 2.13.0
```

### Installation Steps

---

<em>(Installation of this application is supported on the latest versions of Chrome, Firefox, and Safari.
Installation via Internet Explorer has not been officially tested
and although issues are not expected, unforeseen problems may occur)</em>

Please ensure that you do not have any running processes
that is listening on port `3000`
such as development servers or another HLS installer still running.

#### Build Installer Docker Image

```shell
docker build --tag hls-outreach-installer --no-cache https://github.com/bochoi-twlo/hls-outreach-sms.git#main
```

If running on Apple Silicon (M1 chip), add `--platform linux/amd64` option.

#### Run Installer Docker Container

Replace `${TWILIO_ACCOUNT_SID}` and `${TWILIO_AUTH_TOKEN}` with that of your target Twilio account.

```shell
docker run --name hls-outreach-installer --rm --publish 3000:3000  \
--env ACCOUNT_SID=${TWILIO_ACCOUNT_SID} --env AUTH_TOKEN=${TWILIO_AUTH_TOKEN} \
--interactive --tty hls-website-installer
```

If running on Apple Silicon (M1 chip), add `--platform linux/amd64` option.

#### Open installer in browser

Open http://localhost:3000/installer/index.html

#### Terminate installer

To terminate installer:

- Enter Control-C in the terminal where `docker run ...` was executed
- Stop the `hls-frontline-pharma-installer` docker container via the Docker Desktop
