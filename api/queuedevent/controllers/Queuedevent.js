'use strict';

const { utils } = require('ethers');

/**
 * Queuedevent.js controller
 *
 * @description: A set of functions called "actions" for managing `Queuedevent`.
 */

module.exports = {

    /**
     * Retrieve queuedevent records.
     *
     * @return {Object|Array}
     */

    find: async (ctx, next, {populate} = {}) => {
        if (ctx.query._q) {
            return strapi.services.queuedevent.search(ctx.query);
        } else {
            return strapi.services.queuedevent.fetchAll(ctx.query, populate);
        }
    },

    /**
     * Retrieve a queuedevent record.
     *
     * @return {Object}
     */

    findOne: async (ctx) => {
        return strapi.services.queuedevent.fetch(ctx.params);
    },

    /**
     * Count queuedevent records.
     *
     * @return {Number}
     */

    count: async (ctx, next, {populate} = {}) => {
        return strapi.services.queuedevent.count(ctx.query, populate);
    },

    /**
     * Create a/an queuedevent record.
     *
     * @return {Object}
     */

    // check that tx is creation tx
    // check that owner is tx sender
    // check that code is matching one of the eventcontracts
    create: async (ctx) => {

        try {


            const event_contracts = await strapi.services.eventcontract.fetchAll({});

            const tx_receipt = await strapi.ethereum.web3.eth.getTransactionReceipt(ctx.request.body.transaction_hash);

            if (tx_receipt === null) {
                throw new Error('Invalid transaction hash. Transaction not found.')
            }

            if (!tx_receipt.contractAddress) {
                throw new Error('Invalid transaction hash. No contract deployed during this transaction.')
            }

            tx_receipt.contractAddress = utils.getAddress(tx_receipt.contractAddress.toLowerCase());

            const code = await strapi.ethereum.web3.eth.getCode(tx_receipt.contractAddress);

            const event_type = event_contracts.models.findIndex((model) => {
                return code.toLowerCase() === model.attributes.runtime_binary;
            });

            if (event_type === -1) {
                throw new Error('Invalid contract. On Chain code does not match known reference contracts');
            }

            ctx.request.body.type = event_contracts.models[event_type].id;

            const queued_event = await strapi.services.queuedevent.fetchAll({
                address: tx_receipt.contractAddress
            });

            if (queued_event.models.length !== 0) {
                throw new Error('Event already queued');
            }

            tx_receipt.from = utils.getAddress(tx_receipt.from.toLowerCase());

            let owner = await strapi.services.address.fetchAll({address: tx_receipt.from});

            if (owner.models.length === 0) {

                await strapi.services.address.add({
                    address: tx_receipt.from,
                    admin: false,
                    event:false
                });

                owner = await strapi.services.address.fetchAll({address: tx_receipt.from});

            }

            const contract_address = await strapi.services.address.fetchAll({address: tx_receipt.contractAddress});

            if (contract_address.models.length !== 0) {
                throw new Error('Contract already live and present on the server');
            }

            ctx.request.body.owner = owner.models[0].attributes.id;
            ctx.request.body.address = tx_receipt.contractAddress;
            ctx.request.body.creation = new Date(Date.now());

        } catch (e) {
            return ctx.response.badRequest(e);
        }

        return strapi.services.queuedevent.add(ctx.request.body);
    },

    /**
     * Update a/an queuedevent record.
     *
     * @return {Object}
     */

    update: async (ctx, next) => {
        return strapi.services.queuedevent.edit(ctx.params, ctx.request.body) ;
    },

    /**
     * Destroy a/an queuedevent record.
     *
     * @return {Object}
     */

    destroy: async (ctx, next) => {
        return strapi.services.queuedevent.remove(ctx.params);
    }
};
