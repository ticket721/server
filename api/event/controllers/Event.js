'use strict';
const EthSigUtil = require('eth-sig-util');

/**
 * Event.js controller
 *
 * @description: A set of functions called "actions" for managing `Event`.
 */

const sort_types = ['start'];

module.exports = {

    countAllIncoming: async (ctx, next, {populate} = {}) => {

        const count = await Event.query(
            qb => {
                if (!ctx.query.name) {
                    qb.whereNotNull('start');
                    qb.where('start', '>', new Date(Date.now()));
                }

                if (ctx.query.marketplace === 'true') {
                    qb.whereExists(function() {
                        this
                            .select('*')
                            .from('sale')
                            .whereRaw('sale.event = event.id')
                            .andWhereRaw('sale.live IS NOT null')
                    })
                }

                if (ctx.query.name) {
                    qb.whereRaw(`similarity('${ctx.query.name}', name) > 0.2`);
                }

            }
        ).count();

        return count;
    },

    findAllIncoming: async (ctx, next, {populate} = {}) => {

        const withRelated = populate || Event.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const sort = ctx.query.sort;

        if (sort_types.indexOf(sort) === -1) {
            return ctx.response.badRequest(`Invalid sort value: ${ctx.query.sort}`);
        }

        let limit = ctx.query.limit;

        if (limit >= 12) {
            limit = 12;
        }

        let offset = ctx.query.offset;

        const events = await Event.query(
            qb => {
                if (!ctx.query.name) {
                    qb.whereNotNull('start');
                    qb.where('start', '>', new Date(Date.now()));
                }

                if (ctx.query.marketplace === 'true') {
                    qb.whereExists(function() {
                        this
                            .select('*')
                            .from('sale')
                            .whereRaw('sale.event = event.id')
                            .andWhereRaw('sale.live IS NOT null')
                    })
                }

                if (ctx.query.name) {
                    qb.whereRaw(`similarity('${ctx.query.name}', name) > 0.2`);
                    qb.orderByRaw(`similarity('${ctx.query.name}', name) DESC`);
                }

                qb.orderBy(sort, 'asc');

                qb.offset(offset);
                qb.limit(limit);
            }
        ).fetchAll({withRelated});

        return events;
    },

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

            const event = await strapi.services.event.fetch(ctx.params);
            const owner = await strapi.services.address.fetch({id: event.attributes.owner});

            if (!event || !owner || signer.toLowerCase() !== owner.attributes.address.toLowerCase()) {
                return ctx.response.unauthorized();
            }

            const ignored_fields = ['timestamp'];

            const body = {};
            edit_body
                .filter((elem) => ignored_fields.indexOf(elem.name) === -1)
                .filter((elem) => (elem.value !== 'none'))
                .filter((elem) => {
                    if (['start', 'end'].indexOf(elem.name) !== -1) {
                        elem.value = new Date(parseInt(elem.value));
                    }
                    return true;
                })
                .filter((elem) => {
                    if (['location'].indexOf(elem.name) !== -1) {
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
                    }

                    return true;
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
