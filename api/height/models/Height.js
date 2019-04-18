'use strict';

/**
 * Lifecycle callbacks for the `Height` model.
 */

module.exports = {
    // Before saving a value.
    // Fired before an `insert` or `update` query.
    //beforeSave: async (model) => {
    //    console.log('called');
    //},

    // After saving a value.
    // Fired after an `insert` or `update` query.
    // afterSave: async (model, result) => {},

    // Before fetching all values.
    // Fired before a `fetchAll` operation.
    // beforeFetchAll: async (model) => {},

    // After fetching all values.
    // Fired after a `fetchAll` operation.
    // afterFetchAll: async (model, results) => {},

    // Fired before a `fetch` operation.
    // beforeFetch: async (model) => {},

    // After fetching a value.
    // Fired after a `fetch` operation.
    // afterFetch: async (model, result) => {},

    // Before creating a value.
    // Fired before an `insert` query.
    // beforeCreate: async (model) => {},

    // After creating a value.
    // Fired after an `insert` query.
    // afterCreate: async (model, result) => {},

    // Before updating a value.
    // Fired before an `update` query.
    beforeUpdate: async (model) => {
        const new_height = model.changed.height;
        const last_height = model._previousAttributes.height;

        if (new_height <= last_height) {
            throw new Error('Useless or invalid height update. Not an important error, ignore it. This is the only solution to prevent an update from its lifecycle callback.');
        }
    },

    // After updating a value.
    // Fired after an `update` query.
    // afterUpdate: async (model, result) => {},

    // Before destroying a value.
    // Fired before a `delete` query.
    // beforeDestroy: async (model) => {},

    // After destroying a value.
    // Fired after a `delete` query.
    // afterDestroy: async (model, result) => {}
};
