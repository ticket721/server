'use strict';

/**
 * Action.js controller
 *
 * @description: A set of functions called "actions" for managing `Action`.
 */

module.exports = {

    /**
     * Retrieve action records.
     *
     * @return {Object|Array}
     */

    find: async (ctx) => {
        if (ctx.query._q) {
            return strapi.services.action.search(ctx.query);
        } else {
            return strapi.services.action.fetchAll(ctx.query);
        }
    },

    /**
     * Retrieve a action record.
     *
     * @return {Object}
     */

    findOne: async (ctx) => {
        return strapi.services.action.fetch(ctx.params);
    },

    /**
     * Count action records.
     *
     * @return {Number}
     */

    count: async (ctx) => {
        return strapi.services.action.count(ctx.query);
    },

    /**
     * Create a/an action record.
     *
     * @return {Object}
     */

    create: async (ctx) => {
        return strapi.services.action.add(ctx.request.body);
    },

    /**
     * Update a/an action record.
     *
     * @return {Object}
     */

    update: async (ctx, next) => {
        return strapi.services.action.edit(ctx.params, ctx.request.body) ;
    },

    /**
     * Destroy a/an action record.
     *
     * @return {Object}
     */

    destroy: async (ctx, next) => {
        return strapi.services.action.remove(ctx.params);
    }
};
