'use strict';

/**
 * Sale.js controller
 *
 * @description: A set of functions called "actions" for managing `Sale`.
 */

module.exports = {

  /**
   * Retrieve sale records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    if (ctx.query._q) {
      return strapi.services.sale.search(ctx.query);
    } else {
      return strapi.services.sale.fetchAll(ctx.query);
    }
  },

  /**
   * Retrieve a sale record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.sale.fetch(ctx.params);
  },

  /**
   * Count sale records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.sale.count(ctx.query);
  },

  /**
   * Create a/an sale record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.sale.add(ctx.request.body);
  },

  /**
   * Update a/an sale record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.sale.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an sale record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.sale.remove(ctx.params);
  }
};
