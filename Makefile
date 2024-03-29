
# --------------------------------------------------------------------------------------------------------------
# FOR DEVELOPER USE ONLY!!!
# --------------------------------------------------------------------------------------------------------------

# ---------- check twilio credentials from environment variables
# when below 2 variables are set, it will be the 'active' profile of twilio cli
ifndef TWILIO_ACCOUNT_SID
$(info Lookup your "ACCOUNT SID" at https://console.twilio.com/)
$(info execute in your terminal, 'export TWILIO_ACCOUNT_SID=AC********************************')
$(error TWILIO_ACCOUNT_SID environment variable is not set)
endif

ifndef TWILIO_AUTH_TOKEN
$(info Lookup your "AUTH TOKEN" at https://console.twilio.com/)
$(info execute in your terminal, 'export TWILIO_AUTH_TOKEN=********************************')
$(info TWILIO_AUTH_TOKEN environment variable is not set)
endif


# ---------- variables
APPLICATION_NAME := $(shell basename `pwd`)
SERVICE_UNAME    := $(APPLICATION_NAME)
VERSION          := $(shell jq --raw-output .version package.json)
INSTALLER_NAME   := hls-frontline-pharma-installer
INSTALLER_TAG_V  := twiliohls/$(INSTALLER_NAME):$(VERSION)
INSTALLER_TAG_L  := twiliohls/$(INSTALLER_NAME):latest
GIT_REPO_URL     := $(shell git config --get remote.origin.url)
CPU_HARDWARE     := $(shell uname -m)
DOCKER_EMULATION := $(shell [[ `uname -m` == "arm64" ]] && echo --platform linux/amd64)
$(info ================================================================================)
$(info APPLICATION_NAME   : $(APPLICATION_NAME))
$(info GIT_REPO_URL       : $(GIT_REPO_URL))
$(info INSTALLER_NAME     : $(INSTALLER_NAME))
$(info INSTALLER_TAG_V    : $(INSTALLER_TAG_V))
$(info CPU_HARDWARE       : $(shell uname -m))
$(info DOCKER_EMULATION   : $(DOCKER_EMULATION))
$(info TWILIO_ACCOUNT_NAME: $(shell twilio api:core:accounts:fetch --sid=$(TWILIO_ACCOUNT_SID) --no-header --properties=friendlyName))
$(info TWILIO_ACCOUNT_SID : $(TWILIO_ACCOUNT_SID))
$(info TWILIO_AUTH_TOKEN  : $(shell echo $(TWILIO_AUTH_TOKEN) | sed 's/./*/g'))
$(info SERVICE_UNAME      : $(SERVICE_UNAME))
$(info ================================================================================)


targets:
	@echo ----- available make targets:
	@grep '^[A-Za-z0-9\-]*:' Makefile | cut -d ':' -f 1 | sort


installer-build-github:
	$(eval BRANCH := $(shell if [[ -z "$(GIT_BRANCH)" ]]; then echo 'main'; else echo $(GIT_BRANCH); fi))
	docker build  --tag $(INSTALLER_TAG_V) --tag $(INSTALLER_TAG_L) $(DOCKER_EMULATION) --no-cache $(GIT_REPO_URL)#$(BRANCH)


installer-build-local:
	docker build  --tag $(INSTALLER_TAG_V) --tag $(INSTALLER_TAG_L) $(DOCKER_EMULATION) --no-cache .


installer-run:
	docker run --name $(INSTALLER_NAME) --rm --publish 3000:3000 $(DOCKER_EMULATION) \
	--env ACCOUNT_SID=$(TWILIO_ACCOUNT_SID) --env AUTH_TOKEN=$(TWILIO_AUTH_TOKEN) \
	--interactive --tty $(INSTALLER_TAG_V)


installer-open:
	@while [[ -z $(curl --silent --head http://localhost:3000/installer/index.html) ]]; do \
      sleep 2 \
      echo "installer not up yet..." \
    done
	open -a "Google Chrome" http://localhost:3000/installer/index.html


get-service-sid:
	$(eval SERVICE_SID := $(shell twilio api:serverless:v1:services:list -o=json \
	| jq --raw-output '.[] | select(.uniqueName == "$(SERVICE_UNAME)") | .sid'))
	@if [[ ! -z "$(SERVICE_SID)" ]]; then \
      echo "SERVICE_SID=$(SERVICE_SID)"; \
    else \
	  echo "$@: Service named $(SERVICE_UNAME) is not deployed!!! aborting..."; \
	fi
	@[[ ! -z "$(SERVICE_SID)" ]]


get-environment-sid: get-service-sid
	$(eval ENVIRONMENT_SID := $(shell twilio api:serverless:v1:services:environments:list --service-sid $(SERVICE_SID) -o=json \
	| jq --raw-output '.[0].sid'))
	$(eval ENVIRONMENT_NAME := $(shell twilio api:serverless:v1:services:environments:list --service-sid $(SERVICE_SID) -o=json \
	| jq --raw-output '.[0].uniqueName'))
	$(eval ENVIRONMENT_DOMAIN := $(shell twilio api:serverless:v1:services:environments:list --service-sid $(SERVICE_SID) -o=json \
	| jq --raw-output '.[0].domainName'))
	@if [[ ! -z "$(ENVIRONMENT_SID)" ]]; then \
	  echo "ENVIRONMENT_SID=$(ENVIRONMENT_SID)"; \
	  echo "ENVIRONMENT_NAME=$(ENVIRONMENT_NAME)"; \
	  echo "ENVIRONMENT_DOMAIN=$(ENVIRONMENT_DOMAIN)"; \
	else \
	  echo "$@: Environment for service named $(SERVICE_UNAME) is not found!!! aborting..."; \
	fi
	@[[ ! -z "$(ENVIRONMENT_SID)" ]]


make-service-editable: get-service-sid
	twilio api:serverless:v1:services:update --sid=$(SERVICE_SID) --ui-editable -o=json


build-admin-page:
	cd administration && npm run build-assets


deploy-service: build-admin-page
	rm -f .twiliodeployinfo
	twilio serverless:deploy --runtime node14 --override-existing-project


# separate make target needed to be abortable
confirm-delete:
	@read -p "Delete $(SERVICE_UNAME) service? [y/n] " answer && [[ $${answer:-N} = y ]]


undeploy-service: confirm-delete get-service-sid get-verify-sid
	twilio api:serverless:v1:services:remove --sid $(SERVICE_SID)
	rm -f .twiliodeployinfo


deploy-all:  deploy-service make-service-editable
	@echo deployed and configured!


undeploy-all: undeploy-service
	@echo undeployed!


run-serverless:
	@if [[ ! -f .env.localhost ]]; then \
      echo "missing .env.localhost, creating from .env ..."; \
      cp .env .env.localhost; \
    fi
	@[[ -f .env.localhost ]]
	sed -i '' '/^ACCOUNT_SID/d' .env.localhost
	sed -i '' '/^AUTH_TOKEN/d' .env.localhost
	sed -i '' '/^DISABLE_AUTH_FOR_LOCALHOST/d' .env.localhost
	sed -i '' "1s/^/DISABLE_AUTH_FOR_LOCALHOST=true\\n/" .env.localhost
	sed -i '' "1s/^/ACCOUNT_SID=${TWILIO_ACCOUNT_SID}\\n/" .env.localhost
	sed -i '' "1s/^/AUTH_TOKEN=${TWILIO_AUTH_TOKEN}\\n/" .env.localhost
	npm install
	twilio serverless:start --env=.env.localhost


tail-log: get-service-sid get-environment-sid
	twilio serverless:logs --service-sid=$(SERVICE_SID) --environment=$(ENVIRONMENT_SID) --tail


# ensure your backend is already running first before calling this! Also disable Verify authentication.
reset-and-seed: 
	curl -X POST http://localhost:3000/seeding/reset
	curl -X POST http://localhost:3000/seeding/seed


create-rsa-private-key-n-ssl-cert:
# reference: https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_key_and_cert.htm
	rm -f server.private.key
	rm -f server.crt
	openssl genrsa -des3 -passout pass:password -out server.pass.key 2048
	openssl rsa -passin pass:password -in server.pass.key -out server.private.key
	rm server.pass.key
	openssl req -new -key server.private.key -out server.csr -subj "/C=US/ST=California/L=San Francisco/O=Twilio/OU=HLS/CN=twilio.com"
	openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.private.key -out server.crt
	rm server.csr
	@echo "new RSA private key is available at ./server.private.key. Move this into /assets folder to overwrite previous key"
	@echo "new SSL self-signed certificate is available at ./server.crt. Move this into /assets folder to overwrite certificate"

