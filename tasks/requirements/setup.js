const {Portalize} = require('portalize');
const {from_current} = require('../misc');

module.exports.setup_requirements = async function setup_requirements() {

    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('server');

    switch (process.env.T721_SERVER) {
        case 'development':
            if (!Portalize.get.requires({
                action: 'add',
                desc: 'postgres ready',
                file: 'postgres.json',
                from: 'server'
            })) {
                throw new Error('Cannot find postgres configuration in portal. Run gulp task "server:setup" first');
            }
            if (!Portalize.get.requires({
                action: 'add',
                desc: 'eth_node ready',
                file: 'eth_node.json',
                from: 'server'
            })) {
                throw new Error('Cannot find eth_node configuration in portal. Run gulp task "server:setup" first');
            }

    }

};
