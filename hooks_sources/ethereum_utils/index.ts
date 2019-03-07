import { Portalize } from 'portalize';
import * as path from 'path';
import * as signale from 'signale';
import Web3 = require('web3');
import * as fs from 'fs';

const from_current = (add_path: string): string => path.join(path.resolve(path.join(__dirname, '../..')), add_path);

export = (strapi: StrapiCtx): Hook => {

    const hook: Hook = {

        defaults: {
            // config object
        },

        initialize: async (cb: (error?: Error) => void): Promise<void> => {
            Portalize.get.setPortal(from_current('./portal'));
            Portalize.get.setModuleName('server');

            if (!Portalize.get.requires({
                file: 'event_infos.json',
                from: 'contracts',
                action: 'add'
            })) {
                return cb(new Error('Cannot find event informations inside the portal'));
            }

            const network_config = Portalize.get.get('network.json', {module: 'network'});

            // @ts-ignore
            const web3 = new Web3(new Web3.providers.HttpProvider(`http://${network_config.host}:${network_config.port}`));

            if (!strapi.models.minter || !strapi.models.approver || !strapi.models.marketer || !strapi.models.eventcontract || !strapi.models.network) {
                return cb(new Error('Cannot find required models'));
            }

            const event_infos = Portalize.get.get('event_infos.json', {module: 'contracts'});

            for (const minter of event_infos.minters) {

                const db_model = await strapi.models.minter.where({name: minter.name, solidity_version: minter.solidity_version, t721_version: minter.t721_version}).fetch();

                if (db_model === null) {
                    const artifact = Portalize.get.get(`${minter.name}.artifact.json`, {module: 'contracts'});

                    const new_minter = new strapi.models.minter({
                        sources: minter.sources,
                        build_arguments: JSON.stringify(minter.build_args),
                        action_arguments: JSON.stringify(minter.action_args),
                        symbol: minter.symbol,
                        name: minter.name,
                        t721_version: minter.t721_version,
                        solidity_version: minter.solidity_version,
                        binary: artifact.runtimeBin.toLowerCase(),
                        abi: JSON.stringify(artifact.abi)
                    });

                    await new_minter.save();
                    signale.success(`Saved Minter ${minter.name}`);
                }
            }

            for (const marketer of event_infos.marketers) {

                const db_model = await strapi.models.marketer.where({name: marketer.name, solidity_version: marketer.solidity_version, t721_version: marketer.t721_version}).fetch();

                if (db_model === null) {
                    const artifact = Portalize.get.get(`${marketer.name}.artifact.json`, {module: 'contracts'});

                    const new_marketer = new strapi.models.marketer({
                        sources: marketer.sources,
                        build_arguments: JSON.stringify(marketer.build_args),
                        action_arguments: JSON.stringify(marketer.action_args),
                        symbol: marketer.symbol,
                        name: marketer.name,
                        t721_version: marketer.t721_version,
                        solidity_version: marketer.solidity_version,
                        binary: artifact.runtimeBin.toLowerCase(),
                        abi: JSON.stringify(artifact.abi)
                    });

                    await new_marketer.save();
                    signale.success(`Saved Marketer ${marketer.name}`);
                }
            }

            for (const approver of event_infos.approvers) {

                const db_model = await strapi.models.approver.where({name: approver.name, solidity_version: approver.solidity_version, t721_version: approver.t721_version}).fetch();

                if (db_model === null) {
                    const artifact = Portalize.get.get(`${approver.name}.artifact.json`, {module: 'contracts'});

                    const new_approver = new strapi.models.approver({
                        sources: approver.sources,
                        build_arguments: JSON.stringify(approver.build_args),
                        action_arguments: JSON.stringify(approver.action_args),
                        symbol: approver.symbol,
                        name: approver.name,
                        t721_version: approver.t721_version,
                        solidity_version: approver.solidity_version,
                        binary: artifact.runtimeBin.toLowerCase(),
                        abi: JSON.stringify(artifact.abi)
                    });

                    await new_approver.save();
                    signale.success(`Saved Approver ${approver.name}`);
                }
            }

            for (const event of event_infos.events) {

                const db_event = await strapi.models.eventcontract.where({name: event.name, solidity_version: event.solidity_version, t721_version: event.t721_version}).fetch();

                if (db_event === null) {

                    const artifact = Portalize.get.get(`${event.name}.artifact.json`, {module: 'contracts'});

                    const db_minter = await strapi.models.minter.where({
                        name: event.minter,
                        solidity_version: event.solidity_version,
                        t721_version: event.t721_version
                    }).fetch();
                    const db_marketer = await strapi.models.marketer.where({
                        name: event.marketer,
                        solidity_version: event.solidity_version,
                        t721_version: event.t721_version
                    }).fetch();
                    const db_approver = await strapi.models.approver.where({
                        name: event.approver,
                        solidity_version: event.solidity_version,
                        t721_version: event.t721_version
                    }).fetch();

                    if (db_minter === null || db_marketer === null || db_approver === null) {
                        return cb(new Error(`Cannot add ${event.name}, missing module`));
                    }

                    const new_event = new strapi.models.eventcontract({
                        name: event.name,
                        binary: artifact.bin.toLowerCase(),
                        runtime_binary: artifact.runtimeBin.toLowerCase(),
                        sources: event.sources,
                        t721_version: event.t721_version,
                        solidity_version: event.solidity_version,
                        abi: JSON.stringify(artifact.abi),
                        minter: db_minter.id,
                        marketer: db_marketer.id,
                        approver: db_approver.id
                    });

                    await new_event.save();
                    signale.success(`Saved Event ${event.name}`);
                }
            }

            const net_id = await web3.eth.net.getId();
            const net_infos = (await strapi.models.network.fetchAll()).models[0];

            if (net_infos === undefined) {
                const genesis = (await web3.eth.getBlock(0)).hash.toLowerCase();
                const contracts = {};

                const files = fs.readdirSync(from_current('./portal/contracts'));

                for (const file of files) {
                    if (file.indexOf('.artifact.json') !== -1) {
                        const artifact = require(from_current(path.join('./portal/contracts', file)));

                        if (artifact.networks[net_id]) {
                            const code = (await web3.eth.getCode(artifact.networks[net_id].address)).toLowerCase();

                            contracts[artifact.name] = {
                                address: artifact.networks[net_id].address,
                                runtime_binary: code,
                                abi: JSON.stringify(artifact.abi)
                            };
                        }
                    }
                }

                const new_net_infos = new strapi.models.network({
                    net_id,
                    contracts: JSON.stringify(contracts),
                    genesis_block_hash: genesis,
                    node_host: network_config.host,
                    node_port: network_config.port,
                    node_connection_protocol: network_config.connection_protocol
                });

                await new_net_infos.save();

            } else {
                if (net_infos.attributes.net_id !== net_id) {
                    return cb(new Error('This server was not configured with the current ethereum network'));
                }
            }

            cb();
        }
    };

    return hook;
};
