const {postgres_development} = require('./postgres/development');

module.exports.postgres = async function postgres() {
    switch (process.env.T721_SERVER) {
        case 'development':
            return postgres_development();
    }
};
