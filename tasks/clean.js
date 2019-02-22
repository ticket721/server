const {postgres_development_clean} = require('./postgres/development');
const {from_current} = require('./misc');
const rimraf = require('rimraf');

module.exports.remove_hooks = async function remove_hooks() {
    rimraf.sync(from_current('./hooks'));
};

module.exports.postgres_clean = async function postgres_clean() {
    switch (process.env.T721_SERVER) {
        case 'development':
            return postgres_development_clean();
    }
};
