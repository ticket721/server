const {postgres_development_clean} = require('./postgres/development');

module.exports.postgres_clean = async function postgres_clean() {
    switch (process.env.T721_SERVER) {
        case 'development':
            return postgres_development_clean();
    }
};
