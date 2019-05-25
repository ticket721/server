import Bookshelf = require('bookshelf');
import { Portalize } from 'portalize';
import * as Signale  from 'signale';
import { name }      from './ChainSettingsImporter';

export const load_event_contracts = async (ECModel: Bookshelf.Model<any>, MinterModel: Bookshelf.Model<any>, MarketerModel: Bookshelf.Model<any>, ApproverModel: Bookshelf.Model<any>, events: any): Promise<void> => {

    for (const event of events) {

        const db_event = await ECModel.where({
            name: event.name,
            solidity_version: event.solidity_version,
            t721_version: event.t721_version
        }).fetch();

        if (db_event === null) {

            const artifact = Portalize.get.get(`${event.name}.artifact.json`, {module: 'contracts'});

            const db_minter = await MinterModel.where({
                name: event.minter,
                solidity_version: event.solidity_version,
                t721_version: event.t721_version
            }).fetch();
            const db_marketer = await MarketerModel.where({
                name: event.marketer,
                solidity_version: event.solidity_version,
                t721_version: event.t721_version
            }).fetch();
            const db_approver = await ApproverModel.where({
                name: event.approver,
                solidity_version: event.solidity_version,
                t721_version: event.t721_version
            }).fetch();

            if (db_minter === null || db_marketer === null || db_approver === null) {
                throw new Error(`Cannot add ${event.name}, missing module`);
            }

            // @ts-ignore
            const new_event = new ECModel({
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
            Signale.success(`[${name}] saved event ${event.name}`);
        }
    }

};
