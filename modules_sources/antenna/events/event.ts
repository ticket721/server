import * as Signale from 'signale';
import * as BIP39 from 'bip39';

import { ActionModel, ECModel, QEModel, EventModel, UploadFileMorphModel } from '../models';

export const event_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Event', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics,
                    tx_idx: event.transactionIndex,
                    tx_hash: event.transactionHash
                }))
    );

export const event_view_call = (raw: string[], block: any, tx_hash: string): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[1].slice(26),
        to: '0x' + raw[2].slice(26),
        id: 0,
        infos: {
            event_timestamp: block.timestamp,
            tx_hash
        }
    });

export async function event_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {
    Signale.info(`[evm-events][event] created by: ${db_by.attributes.address} at address: ${db_to.attributes.address} block: ${block}`);
    const action = new ActionModel({
        by: db_by.id,
        to: db_to.id,
        action_type: 'event',
        infos: infos,
        block: block,
        tx_hash: infos.tx_hash,
        action_timestamp: new Date(infos.event_timestamp * 1000)
    });
    await action.save();

    const code = await this.web3.eth.getCode(db_to.attributes.address);
    const eventcontract = await ECModel.where({runtime_binary: code.toLowerCase()}).fetch();

    const queuedevent = await QEModel.where({address: db_to.attributes.address}).fetchAll({
        withRelated: ['image', 'banners']
    });

    const data: any = {};

    if (queuedevent.length !== 0) {
        const ev = queuedevent.models[0];
        data.name = ev.attributes.name;
        data.description = ev.attributes.description;

        if (ev.relations.banners.length !== 0) {
            data.banners = ev.relations.banners.models.map((banner: any): number => banner.attributes.upload_file_id);
        }

        if (ev.relations.image) {
            data.image = ev.relations.image.attributes.upload_file_id;
        }

        data.location = ev.attributes.location;
        data.start = ev.attributes.start;
        data.end = ev.attributes.end;

    }

    const event = new EventModel({
        address: db_to.id,
        name: data.name || BIP39.generateMnemonic().split(' ').slice(0, 3).map((name: string): string => `${name.charAt(0).toUpperCase()}${name.slice(1)}`).join(' '),
        description: data.description,
        owner: db_by.id,
        eventcontract: eventcontract !== null ? eventcontract.id : null,
        location: data.location,
        start: data.start,
        end: data.end,
        creation: new Date(Date.now())
    });

    await event.save();

    if (data.image) {
        const morph_jointure = new UploadFileMorphModel({
            upload_file_id: data.image,
            related_id: event.id,
            related_type: 'event',
            field: 'image'
        });

        await morph_jointure.save();
    }

    if (data.banners && data.banners.length) {

        for (const banner of data.banners) {
            const morph_jointure = new UploadFileMorphModel({
                upload_file_id: banner,
                related_id: event.id,
                related_type: 'event',
                field: 'banners'
            });

            await morph_jointure.save();
        }

    }

    if (queuedevent.length !== 0) {
        await QEModel.where({address: db_to.attributes.address}).destroy();
    }

    db_to.set('event', true);
    db_to.set('linked_event', event.id);

    await db_to.save();

    return ;
}
