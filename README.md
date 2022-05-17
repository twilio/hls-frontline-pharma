# hls-frontline-pharma

*This document is intended to serve as a technical guide for customers
who are interested in setting up an instance of Frontline that uses Salesforce as its CRM in a pharmaceutical context.*

*Installation of this application is supported using the latest versions of Chrome and Firefox.
Installation via Internet Explorer has not been officially tested and although issues are not expected, unforeseen problems may occur.*

- [Installation Information](#install)
- [Application Overview](#application)
- [Architecture & Components](#architecture)

## Installation Information

This section details the requirements for a successful deployment and installation of the prototype application, including the necessary prerequisite steps, the variables that are needed to initiate installation, and the installation steps themselves.

### Prerequisites
***
The following prerequisites must be satisfied prior to installing the application.

#### Twilio account

  - Create a Twilio account by signing up [here](https://www.twilio.com/try-twilio)
  - Once the Twilio account is created,
    please note the “ACCOUNT SID” and “AUTH TOKEN”
    from the [Twilio console](https://console.twilio.com/) for use below
  - If you have multiple Twilio Projects under your account, make sure that you are logged into the Project that you want the application to be deployed to

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

#### Salesforce SSO (Salesforce Single-Sign On)

Frontline requires that there is a SSO integrated with your App in order to sign in to the Frontline app. For that we'll need a main Salesforce Developer Account.  Ensure that you have already signed up for a Twilio Account and created a bare Twilio Frontline Service within that account.

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
- Create a Connected App in Salesforce for Frontline
  - On the left-hand panel, navigate to Platform Tools -> Apps -> App Manager
  - Press "New Connected App"
  - Fill in just the red-highlighted portion:
    - Connected App Name
    - API Name
    - Contact Email
  - Hit Save at the bottom
- Configure The Web App Settings
  - After hitting Save described in the previous section, scroll down to the "Web App Settings" portion and tick "Enable SAML"
  - Set "Entity Id" to `https://iam.twilio.com/v2/saml2/metadata/<REALM_SID>` where `REALM_SID`, in the form of `JBxxxxxxx`, can be found in your Twilio Frontline Console.
    - From the Twilio Frontline Console, the path, Frontline -> Manage -> SSO/Log in, should have your Realm SID
  - Set "ACS URL" to `https://iam.twilio.com/v2/saml2/authenticate/<REALM_SID>`
  - Set "Subject Type" to `Username`
  - Set "Name ID Format" to `urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified`
  - Set "Issuer" to `https://yourdomain.my.salesforce.com`
    - The above url can be found by click on your avatar in the top right corner of the Salesforce Console
  - Set "IdP Certificat" to the you created in the first step
  - Untick "Verify Request Signatures" and "Encrypt SAML Response"
  - Hit Save
- Add Custom Attributes
  - Now in the left panel, navigate to Platform Tools -> Apps -> Connected Apps -> Manage Connected Apps
  - Click on your App
  - Scroll to the bottom where it says "Custom Attributes" and click "New"
  - "Attribute Key" should be "roles", and the large Text box should be 'agent' (with single quotes)
  - Hit Save
- Assign Profile Access to the Connected App
  - Depending on who you would like to access your App, you'll want to grant access to all Salesforce Users who you would like to SSO into Frontline
    - In the left Panel, go to Administration -> Users -> Profiles
    - Select the profile that you want to grant a user, for our case, the Salesforce Account creator would be "System Administrator" so find and click that
    - Scroll down to "Connected App Access" and tick the Connected App Name we created in the previous steps
    - Now Hit Save
- Setup SSO in Frontline (Last Step!)
  - In the Twilio console, on the left panel, navigate to Frontline -> Manage -> SSO/Log in
  - Set "Workspace ID" to whatever you want (Org/Company Name)
  - Set "Identiy provider issuer" to `https://yourdomain.my.salesforce.com` where you can find the "yourdomain" URL mentioned in the Salesforce console by clicking on the avatar in the top right corner
  - Set "SSO URL" to `https://yourdomain.my.salesforce.com/idp/endpoint/HttpRedirect`
  - Open your certificate you downloaded in the first step in a text editor and paste the contents inside the "X.509 Certificate" text box.
  - Hit Save
- You're all done! Now Download the Frontline app in the [iOS App Store](https://apps.apple.com/us/app/twilio-frontline/id1541714273) or [Google Play Store](https://play.google.com/store/apps/details?id=com.twilio.frontline)
and log in with the Workspace ID from the last step and your Salesforce Account Credentials

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
***
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
