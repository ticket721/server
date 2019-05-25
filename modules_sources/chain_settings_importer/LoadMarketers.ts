import Bookshelf = require('bookshelf');
import { Portalize } from 'portalize';
import * as Signale  from 'signale';
import { name }      from './ChainSettingsImporter';

export const load_marketers = async (MarketerModel: Bookshelf.Model<any>, marketers: any): Promise<void> => {

    for (const marketer of marketers) {
        const loaded_marketers = await MarketerModel.where({
            name: marketer.name,
            solidity_version: marketer.solidity_version,
            t721_version: marketer.t721_version
        }).fetch();

        if (loaded_marketers === null) {
            const artifact = Portalize.get.get(`${marketer.name}.artifact.json`, {module: 'contracts'});

            // @ts-ignore
            const new_marketer = new MarketerModel({
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
            Signale.success(`[${name}] saved marketer ${marketer.name}`);

        }
    }

};
