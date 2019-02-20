const {Portalize} = require('portalize');
const {from_current} = require('../misc');

module.exports.portalize_requirements = async function portalize_requirements() {

    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('server');

    if (process.env.T721_SERVER === 'development') {
        if (!Portalize.get.requires({
            action: 'add',
            desc: 'network ready',
            file: 'network.json',
            from: 'network'
        })) {
            throw new Error('In development mode, network is expected to have started a local node');
        }
    }

    const contracts = ['AdministrationBoardV0', 'EventManagersRegistryV0', 'EventRegistryV0', 'T721V0'];

    for (const contract of contracts) {
        if (!Portalize.get.requires({
            action: 'add',
            desc: `deployed ${contract}`,
            file: `${contract}.artifact.json`,
            from: 'contracts'
        })) {
            throw new Error(`Missing informations about ${contract} smart contract`);
        }
    }
};
