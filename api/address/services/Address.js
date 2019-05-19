/* global Address */
'use strict';
const { convertRestQueryParams, buildQuery } = require('strapi-utils');

/**
 * Address.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

// Strapi utilities.
const utils = require('strapi-hook-bookshelf/lib/utils/');
const ethers = require('ethers');

module.exports = {

    /**
     * Promise to fetch all addresses.
     *
     * @return {Promise}
     */

    fetchAll: (params, populate) => {
        // Select field to populate.

        if (params.address)
            params.address = ethers.utils.getAddress(params.address.toLowerCase());

        const withRelated = populate || Address.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const filters = convertRestQueryParams(params);

        return Address.query(buildQuery({ model: Address, filters }))
            .fetchAll({ withRelated })
            .then(data => data.toJSON());
    },

    /**
     * Promise to fetch a/an address.
     *
     * @return {Promise}
     */

    fetch: (params) => {
        // Select field to populate.

        if (params.address)
            params.address = ethers.utils.getAddress(params.address.toLowerCase());

        const populate = Address.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        return Address.forge(_.pick(params, 'id')).fetch({
            withRelated: populate
        });
    },

    /**
     * Promise to count a/an address.
     *
     * @return {Promise}
     */

    count: (params, populate) => {
        // Convert `params` object to filters compatible with Bookshelf.

        if (params.address)
            params.address = ethers.utils.getAddress(params.address.toLowerCase());

        const filters = convertRestQueryParams(params);

        return Address.query(buildQuery({ model: Address, filters: _.pick(filters, 'where') })).count();
    },

    /**
     * Promise to add a/an address.
     *
     * @return {Promise}
     */

    add: async (values) => {
        // Extract values related to relational data.
        const relations = _.pick(values, Address.associations.map(ast => ast.alias));
        const data = _.omit(values, Address.associations.map(ast => ast.alias));

        // Create entry with no-relational data.
        const entry = await Address.forge(data).save();

        // Create relational data and return the entry.
        return Address.updateRelations({ id: entry.id , values: relations });
    },

    /**
     * Promise to edit a/an address.
     *
     * @return {Promise}
     */

    edit: async (params, values) => {
        // Extract values related to relational data.
        const relations = _.pick(values, Address.associations.map(ast => ast.alias));
        const data = _.omit(values, Address.associations.map(ast => ast.alias));

        // Create entry with no-relational data.
        const entry = Address.forge(params).save(data);

        // Create relational data and return the entry.
        return Address.updateRelations(Object.assign(params, { values: relations }));
    },

    /**
     * Promise to remove a/an address.
     *
     * @return {Promise}
     */

    remove: async (params) => {
        params.values = {};
        Address.associations.map(association => {
            switch (association.nature) {
                case 'oneWay':
                case 'oneToOne':
                case 'manyToOne':
                case 'oneToManyMorph':
                    params.values[association.alias] = null;
                    break;
                case 'oneToMany':
                case 'manyToMany':
                case 'manyToManyMorph':
                    params.values[association.alias] = [];
                    break;
                default:
            }
        });

        await Address.updateRelations(params);

        return Address.forge(params).destroy();
    },

    /**
     * Promise to search a/an address.
     *
     * @return {Promise}
     */

    search: async (params) => {
        // Convert `params` object to filters compatible with Bookshelf.
        const filters = strapi.utils.models.convertParams('address', params);
        // Select field to populate.
        const populate = Address.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const associations = Address.associations.map(x => x.alias);
        const searchText = Object.keys(Address._attributes)
            .filter(attribute => attribute !== Address.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['string', 'text'].includes(Address._attributes[attribute].type));

        const searchNoText = Object.keys(Address._attributes)
            .filter(attribute => attribute !== Address.primaryKey && !associations.includes(attribute))
            .filter(attribute => !['string', 'text', 'boolean', 'integer', 'decimal', 'float'].includes(Address._attributes[attribute].type));

        const searchInt = Object.keys(Address._attributes)
            .filter(attribute => attribute !== Address.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['integer', 'decimal', 'float'].includes(Address._attributes[attribute].type));

        const searchBool = Object.keys(Address._attributes)
            .filter(attribute => attribute !== Address.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['boolean'].includes(Address._attributes[attribute].type));

        const query = (params._q || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

        return Address.query(qb => {
            // Search in columns which are not text value.
            searchNoText.forEach(attribute => {
                qb.orWhereRaw(`LOWER(${attribute}) LIKE '%${_.toLower(query)}%'`);
            });

            if (!_.isNaN(_.toNumber(query))) {
                searchInt.forEach(attribute => {
                    qb.orWhereRaw(`${attribute} = ${_.toNumber(query)}`);
                });
            }

            if (query === 'true' || query === 'false') {
                searchBool.forEach(attribute => {
                    qb.orWhereRaw(`${attribute} = ${_.toNumber(query === 'true')}`);
                });
            }

            // Search in columns with text using index.
            switch (Address.client) {
                case 'mysql':
                    qb.orWhereRaw(`MATCH(${searchText.join(',')}) AGAINST(? IN BOOLEAN MODE)`, `*${query}*`);
                    break;
                case 'pg': {
                    const searchQuery = searchText.map(attribute =>
                        _.toLower(attribute) === attribute
                            ? `to_tsvector(${attribute})`
                            : `to_tsvector('${attribute}')`
                    );

                    qb.orWhereRaw(`${searchQuery.join(' || ')} @@ to_tsquery(?)`, query);
                    break;
                }
            }

            if (filters.sort) {
                qb.orderBy(filters.sort.key, filters.sort.order);
            }

            if (filters.skip) {
                qb.offset(_.toNumber(filters.skip));
            }

            if (filters.limit) {
                qb.limit(_.toNumber(filters.limit));
            }
        }).fetchAll({
            width: populate
        });
    }
};
