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
| `contracts:setup` | Depending on the `T721_SERVER` value, will raise any required instance of thrid-party softwares and will configure the configurations files for strapi. |
| `contracts:start` | Checks that setup has been run properly, then starts the strapi backend. |
| `contracts:clean` | Cleans everything that has been produced by the `contracts:setup` or `contracts:start` scripts |

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
