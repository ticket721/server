const signale = require('signale');
const {Portalize} = require('portalize');
const {from_current} = require('../misc');


module.exports.eth_node_development = async function postgres_development() {
    signale.info(`Setting up server's own eth node`);
    const net = require('@portal/network/network.json');

    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('server');

    Portalize.get.add('eth_node.json', net, {desc: 'eth_node ready'});

    signale.success(`Finished setting up server's own eth node`);
};

module.exports.eth_node_development_clean =  async function eth_node_development_clean() {

};

