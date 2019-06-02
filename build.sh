#! /bin/bash

npm install -g portalize

curl -u "$NEXUS_USERNAME:$NEXUS_PASSWORD" "$NEXUS_ENDPOINT/repository/$NEXUS_REPOSITORY/artifacts/latest.tar.gz" -o portal.tar.gz

env PORTALIZE_ARCHIVE_NAME=portal.tar.gz portalize restore ./build_config/portalize.config.json

rm portal.tar.gz

docker build -f ./build_config/modules_config/Dockerfile -t server-modules .
docker build -f ./build_config/server_config/Dockerfile -t server --build-arg server_mode=$TRAVIS_BRANCH .

rm -rf portal

