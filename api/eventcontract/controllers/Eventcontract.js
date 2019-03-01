'use strict';

/**
 * Eventcontract.js controller
 *
 * @description: A set of functions called "actions" for managing `Eventcontract`.
 */

module.exports = {

  /**
   * Retrieve eventcontract records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    if (ctx.query._q) {
      return strapi.services.eventcontract.search(ctx.query);
    } else {
      return strapi.services.eventcontract.fetchAll(ctx.query);
    }
  },

  /**
   * Retrieve a eventcontract record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.eventcontract.fetch(ctx.params);
  },

  /**
   * Count eventcontract records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.eventcontract.count(ctx.query);
  },

  /**
   * Create a/an eventcontract record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.eventcontract.add(ctx.request.body);
  },

  /**
   * Update a/an eventcontract record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.eventcontract.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an eventcontract record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.eventcontract.remove(ctx.params);
  }
};
