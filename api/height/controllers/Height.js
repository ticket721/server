'use strict';

/**
 * Height.js controller
 *
 * @description: A set of functions called "actions" for managing `Height`.
 */

module.exports = {

  /**
   * Retrieve height records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    if (ctx.query._q) {
      return strapi.services.height.search(ctx.query);
    } else {
      return strapi.services.height.fetchAll(ctx.query);
    }
  },

  /**
   * Retrieve a height record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.height.fetch(ctx.params);
  },

  /**
   * Count height records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.height.count(ctx.query);
  },

  /**
   * Create a/an height record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.height.add(ctx.request.body);
  },

  /**
   * Update a/an height record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.height.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an height record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.height.remove(ctx.params);
  }
};
