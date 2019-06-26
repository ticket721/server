import Web3 = require('web3');

export = (strapi: StrapiCtx): Hook => {

    const hook: Hook = {

        defaults: {
            // config object
        },

        initialize: async (cb: (error?: Error) => void): Promise<void> => {

            // @ts-ignore
            const web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ETH_NODE_PROTOCOL}://${process.env.ETH_NODE_HOST}:${process.env.ETH_NODE_PORT}`));

            strapi.ethereum = {
                web3
            };

            cb();
        }
    };

    return hook;
};
