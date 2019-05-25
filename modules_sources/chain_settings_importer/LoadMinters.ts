import Bookshelf = require('bookshelf');
import { Portalize } from 'portalize';
import * as Signale  from 'signale';
import { name }      from './ChainSettingsImporter';

export const load_minters = async (MinterModel: Bookshelf.Model<any>, minters: any): Promise<void> => {

    for (const minter of minters) {
        const loaded_minters = await MinterModel.where({
            name: minter.name,
            solidity_version: minter.solidity_version,
            t721_version: minter.t721_version
        }).fetch();

        if (loaded_minters === null) {
            const artifact = Portalize.get.get(`${minter.name}.artifact.json`, {module: 'contracts'});

            // @ts-ignore
            const new_minter = new MinterModel({
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
            Signale.success(`[${name}] saved minter ${minter.name}`);

        }
    }

};
