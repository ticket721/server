/* global Eventcontract */
'use strict';
const { convertRestQueryParams, buildQuery } = require('strapi-utils');

/**
 * Eventcontract.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

// Strapi utilities.
const utils = require('strapi-hook-bookshelf/lib/utils/');

module.exports = {

    /**
     * Promise to fetch all eventcontracts.
     *
     * @return {Promise}
     */

    fetchAll: (params, populate) => {
        const withRelated = populate || Eventcontract.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const filters = convertRestQueryParams(params);

        return Eventcontract.query(buildQuery({ model: Eventcontract, filters }))
            .fetchAll({ withRelated })
            .then(data => data.toJSON());
    },

    /**
     * Promise to fetch a/an eventcontract.
     *
     * @return {Promise}
     */

    fetch: (params) => {
        // Select field to populate.
        const populate = Eventcontract.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        return Eventcontract.forge(_.pick(params, 'id')).fetch({
            withRelated: populate
        });
    },

    /**
     * Promise to count a/an eventcontract.
     *
     * @return {Promise}
     */

    count: (params, populate) => {
        // Convert `params` object to filters compatible with Bookshelf.
        const filters = convertRestQueryParams(params);

        return Eventcontract.query(buildQuery({ model: Eventcontract, filters: _.pick(filters, 'where') })).count();
    },

    /**
     * Promise to add a/an eventcontract.
     *
     * @return {Promise}
     */

    add: async (values) => {
        // Extract values related to relational data.
        const relations = _.pick(values, Eventcontract.associations.map(ast => ast.alias));
        const data = _.omit(values, Eventcontract.associations.map(ast => ast.alias));

        // Create entry with no-relational data.
        const entry = await Eventcontract.forge(data).save();

        // Create relational data and return the entry.
        return Eventcontract.updateRelations({ id: entry.id , values: relations });
    },

    /**
     * Promise to edit a/an eventcontract.
     *
     * @return {Promise}
     */

    edit: async (params, values) => {
        // Extract values related to relational data.
        const relations = _.pick(values, Eventcontract.associations.map(ast => ast.alias));
        const data = _.omit(values, Eventcontract.associations.map(ast => ast.alias));

        // Create entry with no-relational data.
        const entry = Eventcontract.forge(params).save(data);

        // Create relational data and return the entry.
        return Eventcontract.updateRelations(Object.assign(params, { values: relations }));
    },

    /**
     * Promise to remove a/an eventcontract.
     *
     * @return {Promise}
     */

    remove: async (params) => {
        params.values = {};
        Eventcontract.associations.map(association => {
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

        await Eventcontract.updateRelations(params);

        return Eventcontract.forge(params).destroy();
    },

    /**
     * Promise to search a/an eventcontract.
     *
     * @return {Promise}
     */

    search: async (params) => {
        // Convert `params` object to filters compatible with Bookshelf.
        const filters = strapi.utils.models.convertParams('eventcontract', params);
        // Select field to populate.
        const populate = Eventcontract.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const associations = Eventcontract.associations.map(x => x.alias);
        const searchText = Object.keys(Eventcontract._attributes)
            .filter(attribute => attribute !== Eventcontract.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['string', 'text'].includes(Eventcontract._attributes[attribute].type));

        const searchNoText = Object.keys(Eventcontract._attributes)
            .filter(attribute => attribute !== Eventcontract.primaryKey && !associations.includes(attribute))
            .filter(attribute => !['string', 'text', 'boolean', 'integer', 'decimal', 'float'].includes(Eventcontract._attributes[attribute].type));

        const searchInt = Object.keys(Eventcontract._attributes)
            .filter(attribute => attribute !== Eventcontract.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['integer', 'decimal', 'float'].includes(Eventcontract._attributes[attribute].type));

        const searchBool = Object.keys(Eventcontract._attributes)
            .filter(attribute => attribute !== Eventcontract.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['boolean'].includes(Eventcontract._attributes[attribute].type));

        const query = (params._q || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

        return Eventcontract.query(qb => {
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
            switch (Eventcontract.client) {
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
