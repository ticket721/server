const {postgres_development_clean} = require('./postgres/development');
const {eth_node_development_clean} = require('./eth_node/development');
const {from_current} = require('./misc');
const rimraf = require('rimraf');

module.exports.remove_hooks = async function remove_hooks() {
    rimraf.sync(from_current('./hooks'));
};

module.exports.clean = async function clean() {
    switch (process.env.T721_SERVER) {
        case 'development':
            await postgres_development_clean();
            await eth_node_development_clean();
            return ;
    }
};
