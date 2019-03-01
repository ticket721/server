'use strict';

/**
 * Network.js controller
 *
 * @description: A set of functions called "actions" for managing `Network`.
 */

module.exports = {

  /**
   * Retrieve network records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    if (ctx.query._q) {
      return strapi.services.network.search(ctx.query);
    } else {
      return strapi.services.network.fetchAll(ctx.query);
    }
  },

  /**
   * Retrieve a network record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.network.fetch(ctx.params);
  },

  /**
   * Count network records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.network.count(ctx.query);
  },

  /**
   * Create a/an network record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.network.add(ctx.request.body);
  },

  /**
   * Update a/an network record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.network.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an network record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.network.remove(ctx.params);
  }
};
