'use strict';

/**
 * Approver.js controller
 *
 * @description: A set of functions called "actions" for managing `Approver`.
 */

module.exports = {

  /**
   * Retrieve approver records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, {populate} = {}) => {
    if (ctx.query._q) {
      return strapi.services.approver.search(ctx.query);
    } else {
      return strapi.services.approver.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a approver record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.approver.fetch(ctx.params);
  },

  /**
   * Count approver records.
   *
   * @return {Number}
   */

  count: async (ctx, next, {populate} = {}) => {
    return strapi.services.approver.count(ctx.query, populate);
  },

  /**
   * Create a/an approver record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.approver.add(ctx.request.body);
  },

  /**
   * Update a/an approver record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.approver.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an approver record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.approver.remove(ctx.params);
  }
};
