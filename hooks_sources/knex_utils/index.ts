
export = (strapi: StrapiCtx): Hook => {

    const hook: Hook = {

        defaults: {
            // config object
        },

        initialize: async (cb: (error?: Error) => void): Promise<void> => {

            // @ts-ignore

            const knex = strapi.connections.default;

            try {
                await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
                strapi.log.info('Enabled pg_trgm');
            } catch (e) {
                return cb(e);
            }

            return cb();
        }
    };

    return hook;
};
