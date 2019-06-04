import Bookshelf = require('bookshelf');
import { from_current } from './ChainSettingsImporter';
import { name }         from './ChainSettingsImporter';
import * as fs          from 'fs';
import * as path        from 'path';
import * as Signale     from 'signale';

export const load_networks = async (NetworksModel: Bookshelf.Model<any>, web3: any): Promise<void> => {

    const net_id = await web3.eth.net.getId();
    // @ts-ignore
    const net_infos = (await NetworksModel.fetchAll()).models[0];

    if (net_infos === undefined) {
        const genesis = (await web3.eth.getBlock(0)).hash.toLowerCase();
        const contracts = {};

        const files = fs.readdirSync(from_current('./portal/contracts'));

        for (const file of files) {
            if (file.indexOf('.artifact.json') !== -1) {
                const artifact = require(from_current(path.join('./portal/contracts', file)));

                if (artifact.networks && artifact.networks[net_id]) {
                    const code = (await web3.eth.getCode(artifact.networks[net_id].address)).toLowerCase();

                    contracts[artifact.name] = {
                        address: artifact.networks[net_id].address,
                        runtime_binary: code,
                        abi: JSON.stringify(artifact.abi)
                    };
                }
            }
        }

        // @ts-ignore
        const new_net_infos = new NetworksModel({
            net_id,
            contracts: JSON.stringify(contracts),
            genesis_block_hash: genesis,
            node_host: process.env.PUBLIC_ETH_NODE_HOST || process.env.ETH_NODE_HOST,
            node_port: process.env.PUBLIC_ETH_NODE_PORT || process.env.ETH_NODE_PORT,
            node_connection_protocol: process.env.PUBLIC_ETH_NODE_PROTOCOL || process.env.ETH_NODE_PROTOCOL
        });

        await new_net_infos.save();
        Signale.success(`[${name}] saved network ${net_id} configuration`);

    } else {
        if (net_infos.attributes.net_id !== net_id) {
            throw new Error('This server was not configured with the current ethereum network');
        }
    }

};
