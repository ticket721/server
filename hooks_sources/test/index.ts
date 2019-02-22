export = (strapi: StrapiCtx): Hook => {

    const hook: Hook = {

        defaults: {
            // config object
        },

        initialize: (cb: () => void): void => {
            console.log('Test hook loaded');
            cb();
        }
    };

    return hook;
};
