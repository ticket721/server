'use strict';

/**
 * Ticket.js controller
 *
 * @description: A set of functions called "actions" for managing `Ticket`.
 */

module.exports = {

    /**
     * Retrieve ticket records.
     *
     * @return {Object|Array}
     */

    find: async (ctx, next, {populate} = {}) => {
        if (ctx.query._q) {
            return strapi.services.ticket.search(ctx.query);
        } else {
            return strapi.services.ticket.fetchAll(ctx.query, populate);
        }
    },

    /**
     * Retrieve a ticket record.
     *
     * @return {Object}
     */

    findOne: async (ctx) => {
        return strapi.services.ticket.fetch(ctx.params);
    },

    /**
     * Count ticket records.
     *
     * @return {Number}
     */

    count: async (ctx, next, {populate} = {}) => {
        if (ctx.query._q) {
            return strapi.services.ticket.filterableCountSearch(ctx.query);
        } else {
            return strapi.services.ticket.filterableCountFetchAll(ctx.query, populate);
        }
    },

    /**
     * Create a/an ticket record.
     *
     * @return {Object}
     */

    create: async (ctx) => {
        return strapi.services.ticket.add(ctx.request.body);
    },

    /**
     * Update a/an ticket record.
     *
     * @return {Object}
     */

    update: async (ctx, next) => {
        return strapi.services.ticket.edit(ctx.params, ctx.request.body) ;
    },

    /**
     * Destroy a/an ticket record.
     *
     * @return {Object}
     */

    destroy: async (ctx, next) => {
        return strapi.services.ticket.remove(ctx.params);
    }
};
