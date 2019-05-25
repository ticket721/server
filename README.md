# server
Server to store contract data and events for ticket721

## Status

| Name | Shield |
| :---: | :----: |
| Travis | [![Build Status](https://travis-ci.org/ticket721/server.svg?branch=develop)](https://travis-ci.org/ticket721/server) |
| Coveralls | [![Coverage Status](https://coveralls.io/repos/github/ticket721/server/badge.svg?branch=develop)](https://coveralls.io/github/ticket721/server?branch=develop) |

## Env

| Variable | Mandatory | Values | Description |
| :---: | :---: | :---: | :---: |
| `T721_SERVER` | yes | `development` | This value will tell every task how it should behave and configure the strapi backend |

## Tasks

| Name | Description |
| :---: | :---------: |
| `server:setup` | Depending on the `T721_SERVER` value, will raise any required instance of thrid-party softwares and will configure the configurations files for strapi. |
| `server:start` | Checks that setup has been run properly, then starts the strapi backend. |
| `server:clean` | Cleans everything that has been produced by the `server:setup` or `server:start` scripts |

## Modules

| Name | Description | Requirements |
| :---: | :---: | :---: |
| `chain_settings_importer` | Loads all event plugins, event contracts and network configurations into the database | `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `ETH_NODE_PROTOCOL`, `ETH_NODE_HOST`, `ETH_NODE_PORT` |

## Setting up the server

Before anything, you should run the `deploy` task from the `env` directory to make sure that the `network` and `contract` informations are properly written on the portal.

The `T721_SERVER` value should be set.

Will raise any required instance (like `postgres`). Will edit the configurations to match instances.

```shell
env T721_SERVER=development gulp server:setup
```

## Starting the server

The following command required `server:setup` to be run.
Configuration checks will make the command fail if any configuration is missing.

```shell
env T721_SERVER=development gulp server:start
```

## Cleaning the server

The following command cleans the directory.

```shell
env T721_SERVER=development gulp server:clean
```

## Running chain settings importer

```shell
env DATABASE_HOST=127.0.0.1 DATABASE_PORT=5432 DATABASE_NAME=t721 \
    DATABASE_USERNAME=admin DATABASE_PASSWORD=pass ETH_NODE_PROTOCOL=http \
    ETH_NODE_HOST=127.0.0.1 ETH_NODE_PORT=8545 \
    node ./modules/ModuleRunner.js chain_settings_importer
```

