import * as eth_node_config from '@portal/server/eth_node.json';
import * as network_config  from '@portal/network/network.json';
import { EventBridge }      from './EventBridge';
import Web3 = require('web3');
import { subscriber }       from './subscriber';

export = (strapi: StrapiCtx): Hook => {

    const evm_events: Hook = {

        defaults: {
            // config object
        },

        initialize: async (cb: HookCallback): Promise<void> => {
            strapi.log.info('[evm-events] Starting');

            // @ts-ignore
            const web3 = new Web3(new Web3.providers.HttpProvider(`http://${network_config.host}:${network_config.port}`));

            if (!strapi.models) {
                return cb(new Error('Services are not loaded in the strapi models'));
            }

            if (!strapi.models.address || !strapi.models.action || !strapi.models.ticket || !strapi.models.height || !strapi.models.event || !strapi.models.sale || !strapi.models.eventcontract || !strapi.models.queuedevent) {
                return cb(new Error('Missing models'));
            }

            strapi.log.info('[evm-events] Loaded models');
            const eb = new EventBridge(strapi, web3);

            subscriber(network_config, web3, eb, strapi.models.height, strapi.models.sale)
                .then((): void => {
                    console.error('Subscribe loop ended');
                })
                .catch((e: Error): void => {
                    console.error('Subscribe loop crashed: ');
                    console.error(e);
                });

            strapi.log.info('[evm-events] Ready');
            cb();
        }
    };

    return evm_events;
};
