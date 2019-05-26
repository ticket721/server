import { Portalize } from 'portalize';
import * as path from 'path';
import Web3 = require('web3');

const from_current = (add_path: string): string => path.join(path.resolve(path.join(__dirname, '../..')), add_path);

export = (strapi: StrapiCtx): Hook => {

    const hook: Hook = {

        defaults: {
            // config object
        },

        initialize: async (cb: (error?: Error) => void): Promise<void> => {
            Portalize.get.setPortal(from_current('./portal'));
            Portalize.get.setModuleName('server');

            if (!Portalize.get.requires({
                file: 'event_infos.json',
                from: 'contracts',
                action: 'add'
            })) {
                return cb(new Error('Cannot find event informations inside the portal'));
            }

            const network_config = Portalize.get.get('network.json', {module: 'network'});

            // @ts-ignore
            const web3 = new Web3(new Web3.providers.HttpProvider(`http://${network_config.host}:${network_config.port}`));

            strapi.ethereum = {
                web3
            };

            cb();
        }
    };

    return hook;
};
