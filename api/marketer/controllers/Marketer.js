'use strict';

/**
 * Marketer.js controller
 *
 * @description: A set of functions called "actions" for managing `Marketer`.
 */

module.exports = {

  /**
   * Retrieve marketer records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    if (ctx.query._q) {
      return strapi.services.marketer.search(ctx.query);
    } else {
      return strapi.services.marketer.fetchAll(ctx.query);
    }
  },

  /**
   * Retrieve a marketer record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.marketer.fetch(ctx.params);
  },

  /**
   * Count marketer records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.marketer.count(ctx.query);
  },

  /**
   * Create a/an marketer record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.marketer.add(ctx.request.body);
  },

  /**
   * Update a/an marketer record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.marketer.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an marketer record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.marketer.remove(ctx.params);
  }
};
