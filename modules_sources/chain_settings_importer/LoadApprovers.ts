import Bookshelf = require('bookshelf');
import { Portalize } from 'portalize';
import * as Signale  from 'signale';
import { name }      from './ChainSettingsImporter';

export const load_approvers = async (ApproverModel: Bookshelf.Model<any>, approvers: any): Promise<void> => {

    for (const approver of approvers) {
        const loaded_approvers = await ApproverModel.where({
            name: approver.name,
            solidity_version: approver.solidity_version,
            t721_version: approver.t721_version
        }).fetch();

        if (loaded_approvers === null) {
            const artifact = Portalize.get.get(`${approver.name}.artifact.json`, {module: 'contracts'});

            // @ts-ignore
            const new_approver = new ApproverModel({
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
            Signale.success(`[${name}] saved approver ${approver.name}`);

        }
    }

};
