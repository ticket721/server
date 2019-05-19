'use strict';

/**
 * Minter.js controller
 *
 * @description: A set of functions called "actions" for managing `Minter`.
 */

module.exports = {

  /**
   * Retrieve minter records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, {populate} = {}) => {
    if (ctx.query._q) {
      return strapi.services.minter.search(ctx.query);
    } else {
      return strapi.services.minter.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a minter record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.minter.fetch(ctx.params);
  },

  /**
   * Count minter records.
   *
   * @return {Number}
   */

  count: async (ctx, next, {populate} = {}) => {
    return strapi.services.minter.count(ctx.query, populate);
  },

  /**
   * Create a/an minter record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.minter.add(ctx.request.body);
  },

  /**
   * Update a/an minter record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.minter.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an minter record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.minter.remove(ctx.params);
  }
};
