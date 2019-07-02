'use strict';

const { utils } = require('ethers');
const EthSigUtil = require('eth-sig-util');

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

        if (!ctx.request.body.transaction_hash) {
            return ctx.response.badRequest(`No transaction hash provided`);
        }

        try {

            const event_contracts = await strapi.services.eventcontract.fetchAll({});

            let tx_receipt = null;
            let tries = 0;

            while (tries < 40 && tx_receipt === null) {
                try {
                    console.log(`[INFO] Fetching tx ${ctx.request.body.transaction_hash}`);
                    tx_receipt = await strapi.ethereum.web3.eth.getTransactionReceipt(ctx.request.body.transaction_hash);
                    console.log(`[INFO] Fetched tx ${ctx.request.body.transaction_hash}`);
                } catch (e) {
                    tx_receipt = null;
                    console.error(`Cannot find transaction, waiting 5 sec and retrying [${tries}/40]`);
                    ++tries;
                    await new Promise((ok, ko) => setTimeout(ok, 5000));
                }
            }

            if (tries === 40) {
                return ctx.response.notFound(`Cannot find transaction ${ctx.request.body.transaction_hash}`);
            }

            if (tx_receipt === null) {
                throw new Error('Invalid transaction hash. Transaction not found.')
            }

            if (!tx_receipt.contractAddress) {
                throw new Error('Invalid transaction hash. No contract deployed during this transaction.')
            }

            tx_receipt.contractAddress = utils.getAddress(tx_receipt.contractAddress.toLowerCase());

            const code = await strapi.ethereum.web3.eth.getCode(tx_receipt.contractAddress);

            const event_type = event_contracts.findIndex((model) => {
                return code.toLowerCase() === model.runtime_binary;
            });

            if (event_type === -1) {
                throw new Error('Invalid contract. On Chain code does not match known reference contracts');
            }

            ctx.request.body.type = event_contracts[event_type].id;

            const queued_event = await strapi.services.queuedevent.fetchAll({
                address: tx_receipt.contractAddress
            });

            if (queued_event.length !== 0) {
                throw new Error('Event already queued');
            }

            tx_receipt.from = utils.getAddress(tx_receipt.from.toLowerCase());

            let owner = await strapi.services.address.fetchAll({address: tx_receipt.from});

            if (owner.length === 0) {

                await strapi.services.address.add({
                    address: tx_receipt.from,
                    admin: false,
                    event:false
                });

                owner = await strapi.services.address.fetchAll({address: tx_receipt.from});

            }

            const contract_address = await strapi.services.address.fetchAll({address: tx_receipt.contractAddress});

            if (contract_address.length !== 0) {
                throw new Error('Contract already live and present on the server');
            }

            ctx.request.body.owner = owner[0].id;
            ctx.request.body.address = tx_receipt.contractAddress;
            ctx.request.body.creation = new Date(Date.now());

        } catch (e) {
            console.error(e);
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
        const edit_body = ctx.request.body.body;
        const edit_signature = ctx.request.body.signature;
        const date = Date.now();


        if (!edit_body || !edit_signature) {
            return ctx.response.unauthorized();
        }

        const authorized_fields = ['name', 'description', 'start', 'end', 'location', 'image', 'banners', 'timestamp'];

        for (const field of edit_body) {
            if (authorized_fields.indexOf(field.name) === -1) {
                return ctx.response.badRequest(`Illegal field in signature payload: ${field.name}`);
            }
        }

        const timestamp_idx = edit_body.findIndex((elem) => elem.name === 'timestamp');

        if (timestamp_idx === -1 || typeof edit_body[timestamp_idx].value !== 'number') {
            return ctx.response.badRequest('Missing timestamp');
        }

        if (date > edit_body[timestamp_idx].value + (2 * 60 * 1000)) {
            return ctx.response.clientTimeout();
        }

        try {
            const signer = EthSigUtil.recoverTypedSignature({
                data: edit_body,
                sig: edit_signature
            });

            const event = await strapi.services.queuedevent.fetch(ctx.params);
            const owner = await strapi.services.address.fetch({id: event.attributes.owner});

            if (!event || !owner || signer.toLowerCase() !== owner.attributes.address.toLowerCase()) {
                return ctx.response.unauthorized();
            }

            const ignored_fields = ['timestamp'];

            const body = {};
            edit_body
                .filter((elem) => ignored_fields.indexOf(elem.name) === -1)
                .filter((elem) => {
                    if (['start', 'end'].indexOf(elem.name) !== -1) {
                        if (elem.value === 'none') {
                            return false;
                        } else {
                            elem.value = new Date(parseInt(elem.value));
                            return true;
                        }
                    } else return true
                })
                .filter((elem) => {
                    if (['location'].indexOf(elem.name) !== -1) {
                        if (elem.value === 'none') {
                            return false;
                        } else {
                            try {
                                const load = JSON.parse(elem.value);

                                if (!load.label || typeof load.label !== 'string') {
                                    console.error('Invalid location label in payload');
                                    return false;
                                }

                                if (!load.location || load.location.lat === undefined || load.location.lat === null || load.location.lng === undefined || load.location.lng === null) {
                                    console.error('Invalid location in payload');
                                    return false;
                                }

                                elem.value = {
                                    label: load.label,
                                    location: {
                                        lat: load.location.lat,
                                        lng: load.location.lng
                                    }
                                }

                            } catch (e) {
                                console.error('Invalid location in payload');
                                return false;
                            }

                            return true;
                        }
                    } else return true
                })
                .forEach((elem) => body[elem.name] = elem.value);

            if (body.name && body.name.length >= 50) {
                return ctx.response.badRequest('Name cannot exceed 50 characters');
            }

            if (body.description && body.description.length >= 1000) {
                return ctx.response.badRequest('Description cannot exceed 1000 characters');
            }

            if (body.image) {
                body.image = parseInt(body.image);
            }

            if (body.banners) {
                body.banners = JSON.parse(body.banners);
            }

            return strapi.services.queuedevent.edit(ctx.params, body) ;

        } catch (e) {
            return ctx.response.badRequest();
        }
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
