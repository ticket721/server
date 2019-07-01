'use strict';
const EthSigUtil = require('eth-sig-util');

/**
 * Event.js controller
 *
 * @description: A set of functions called "actions" for managing `Event`.
 */

module.exports = {

    /**
     * Retrieve event records.
     *
     * @return {Object|Array}
     */

    find: async (ctx, next, {populate} = {}) => {
        if (ctx.query._q) {
            return strapi.services.event.search(ctx.query);
        } else {
            return strapi.services.event.fetchAll(ctx.query, populate);
        }
    },

    /**
     * Retrieve a event record.
     *
     * @return {Object}
     */

    findOne: async (ctx, next, {populate} = {}) => {
        return strapi.services.event.fetch(ctx.params, populate);
    },

    /**
     * Count event records.
     *
     * @return {Number}
     */

    count: async (ctx) => {
        return strapi.services.event.count(ctx.query);
    },

    /**
     * Create a/an event record.
     *
     * @return {Object}
     */

    create: async (ctx) => {
        return strapi.services.event.add(ctx.request.body);
    },

    /**
     * Update a/an event record.
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

        const authorized_fields = ['name', 'description', 'start', 'end', 'location', 'timestamp'];

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

            const event = await strapi.services.event.fetch(ctx.event);
            const owner = await strapi.services.address.fetch(event.attributes.owner);

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

            return strapi.services.event.edit(ctx.params, body) ;

        } catch (e) {
            return ctx.response.badRequest();
        }
    },

    /**
     * Destroy a/an event record.
     *
     * @return {Object}
     */

    destroy: async (ctx, next) => {
        return strapi.services.event.remove(ctx.params);
    }
};
