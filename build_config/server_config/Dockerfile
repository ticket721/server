FROM node:lts

ARG server_mode

WORKDIR /usr/src/server
COPY ./ ./

RUN npm install
RUN npm run postinstall
RUN npm install -g gulp

ENV T721_SERVER=$server_mode

RUN apt-get update && apt-get install -y libgl1-mesa-glx && apt-get clean
RUN rm -rf ./node_modules/websocket/.git

RUN npm run setup --plugins --debug
RUN gulp server:setup
CMD gulp server:start



