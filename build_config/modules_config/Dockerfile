FROM node:lts

WORKDIR /usr/src/modules
COPY ./modules_sources ./modules_sources
COPY ./portal ./portal

WORKDIR /usr/src/modules/modules_sources
RUN npm install
RUN npm run lint
RUN npm run build


