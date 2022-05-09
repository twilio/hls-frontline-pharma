# --------------------------------------------------------------------------------
# Dockerfile for local installer
# --------------------------------------------------------------------------------
FROM twilio/twilio-cli:3.2.1

RUN twilio plugins:install @twilio-labs/plugin-serverless

# directory to copy/run application
WORKDIR /hls-deploy

# copy github files needed for running locally
COPY . /hls-deploy/

# TODO: CD into installer folder, npm install and run, expose port 3000

# expose default port for running locally
EXPOSE 3000

CMD ["twilio", "serverless:start", "--load-local-env"]