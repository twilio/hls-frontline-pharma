# --------------------------------------------------------------------------------
# Dockerfile for local installer
# --------------------------------------------------------------------------------
FROM twilio/twilio-cli:3.4.1

RUN twilio plugins:install @twilio-labs/plugin-serverless

# directory to copy/run application
WORKDIR /hls-installer

# copy github files needed for running locally
COPY Dockerfile package.json .env .twilioserverlessrc /hls-installer/
COPY assets /hls-installer/assets
COPY functions /hls-installer/functions

# install node dependencies in package.json
RUN npm install

RUN apt-get update && apt-get install -y xsel

# expose default port for running locally
EXPOSE 3000

CMD ["twilio", "serverless:start", "--load-local-env"]