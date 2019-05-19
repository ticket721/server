/* global Ticket */
'use strict';
const { convertRestQueryParams, buildQuery } = require('strapi-utils');

/**
 * Ticket.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

// Strapi utilities.
const utils = require('strapi-hook-bookshelf/lib/utils/');

module.exports = {

    /**
     * Promise to fetch all tickets.
     *
     * @return {Promise}
     */

    fetchAll: (params, populate) => {
        const withRelated = populate || Ticket.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const filters = convertRestQueryParams(params);

        return Ticket.query(buildQuery({ model: Ticket, filters }))
            .fetchAll({ withRelated })
            .then(data => data.toJSON());

    },

    /**
     * Promise to fetch a/an ticket.
     *
     * @return {Promise}
     */

    fetch: (params) => {
        // Select field to populate.
        const populate = Ticket.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        return Ticket.forge(_.pick(params, 'id')).fetch({
            withRelated: populate
        });
    },

    /**
     * Promise to count a/an ticket, search style.
     *
     * @return {Promise}
     */

    filterableCountSearch: (params) => {
        // Convert `params` object to filters compatible with Bookshelf.
        const filters = strapi.utils.models.convertParams('ticket', params);
        // Select field to populate.
        const populate = Ticket.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const associations = Ticket.associations.map(x => x.alias);
        const searchText = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['string', 'text'].includes(Ticket._attributes[attribute].type));

        const searchNoText = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => !['string', 'text', 'boolean', 'integer', 'decimal', 'float'].includes(Ticket._attributes[attribute].type));

        const searchInt = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['integer', 'decimal', 'float'].includes(Ticket._attributes[attribute].type));

        const searchBool = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['boolean'].includes(Ticket._attributes[attribute].type));

        const query = (params._q || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

        return Ticket.query(qb => {
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
            switch (Ticket.client) {
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
        }).count();
    },

    /**
     * Promise to count a/an ticket, fetchAll style.
     *
     * @return {Promise}
     */

    filterableCountFetchAll: (params, populate) => {
        const withRelated = populate || Ticket.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const filters = convertRestQueryParams(params);

        return Ticket.query(buildQuery({ model: Ticket, filters })).count()
    },
    /**
     * Promise to count a/an ticket.
     *
     * @return {Promise}
     */

    count: (params) => {
        // Convert `params` object to filters compatible with Bookshelf.
        const filters = convertRestQueryParams(params);

        return Ticket.query(buildQuery({ model: Ticket, filters: _.pick(filters, 'where') })).count();
    },

    /**
     * Promise to add a/an ticket.
     *
     * @return {Promise}
     */

    add: async (values) => {
        // Extract values related to relational data.
        const relations = _.pick(values, Ticket.associations.map(ast => ast.alias));
        const data = _.omit(values, Ticket.associations.map(ast => ast.alias));

        // Create entry with no-relational data.
        const entry = await Ticket.forge(data).save();

        // Create relational data and return the entry.
        return Ticket.updateRelations({ id: entry.id , values: relations });
    },

    /**
     * Promise to edit a/an ticket.
     *
     * @return {Promise}
     */

    edit: async (params, values) => {
        // Extract values related to relational data.
        const relations = _.pick(values, Ticket.associations.map(ast => ast.alias));
        const data = _.omit(values, Ticket.associations.map(ast => ast.alias));

        // Create entry with no-relational data.
        const entry = Ticket.forge(params).save(data);

        // Create relational data and return the entry.
        return Ticket.updateRelations(Object.assign(params, { values: relations }));
    },

    /**
     * Promise to remove a/an ticket.
     *
     * @return {Promise}
     */

    remove: async (params) => {
        params.values = {};
        Ticket.associations.map(association => {
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

        await Ticket.updateRelations(params);

        return Ticket.forge(params).destroy();
    },

    /**
     * Promise to search a/an ticket.
     *
     * @return {Promise}
     */

    search: async (params) => {
        // Convert `params` object to filters compatible with Bookshelf.
        const filters = strapi.utils.models.convertParams('ticket', params);
        // Select field to populate.
        const populate = Ticket.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias);

        const associations = Ticket.associations.map(x => x.alias);
        const searchText = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['string', 'text'].includes(Ticket._attributes[attribute].type));

        const searchNoText = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => !['string', 'text', 'boolean', 'integer', 'decimal', 'float'].includes(Ticket._attributes[attribute].type));

        const searchInt = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['integer', 'decimal', 'float'].includes(Ticket._attributes[attribute].type));

        const searchBool = Object.keys(Ticket._attributes)
            .filter(attribute => attribute !== Ticket.primaryKey && !associations.includes(attribute))
            .filter(attribute => ['boolean'].includes(Ticket._attributes[attribute].type));

        const query = (params._q || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

        return Ticket.query(qb => {
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
            switch (Ticket.client) {
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
