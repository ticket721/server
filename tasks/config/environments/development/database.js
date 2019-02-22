const signale = require('signale');
const fs = require('fs');
const {from_current} = require('../../../misc');

module.exports.environments_development_database = async function environments_development_database() {
    signale.info(`Editing environments/development/database.json`);
    const config = JSON.parse(fs.readFileSync(from_current('./config/environments/development/database.json')).toString());

    switch (process.env.T721_SERVER) {
        case 'development':
            const portal_config = require('@portal/server/postgres.json');
            config.connections.default.settings = {
                ...config.connections.default.settings,
                client: 'postgres',
                host: portal_config.host,
                port: parseInt(portal_config.port),
                database: portal_config.db,
                username: portal_config.user,
                password: portal_config.pass
            }
    }

    fs.writeFileSync(from_current('./config/environments/development/database.json'), JSON.stringify(config, null, 4));
    signale.success(`Edited environments/development/database.json`);
};
