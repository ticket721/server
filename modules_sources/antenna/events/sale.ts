import * as Signale from 'signale';

import { ActionModel, BS, EventModel, SaleModel }      from '../models';
import { available, register_tx, signature } from './signature';

export const sale_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Sale', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics.concat([event.raw.data]),
                    tx_idx: event.transactionIndex,
                    tx_hash: event.transactionHash,
                    log_idx: event.logIndex
                }))
    );

export const sale_view_call = (raw: string[], block: any, tx_hash: string, log_idx: number): { by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[1].slice(26),
        id: parseInt(raw[2], 16),
        infos: {
            event_timestamp: block.timestamp,
            begin: block.timestamp,
            end: parseInt(raw[4], 16),
            tx_hash,
            event_signature: signature(raw, 'Sale', tx_hash, log_idx)
        }
    });

export async function sale_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][sale] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);

    if (!await available(infos.event_signature)) {
        Signale.warn(`[evm-events][sale] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block} | Already registered`);
        return ;
    }

    await BS.transaction(async (t: any) => {

        const {db_id}: { db_id: any; } = await this.ticket_check(id, t);
        const action = new ActionModel({
            by: db_by.id,
            to: db_to.id,
            on_ticket: db_id.id,
            action_type: 'sale',
            infos: infos,
            block: block,
            tx_hash: infos.tx_hash,
            action_timestamp: new Date(infos.event_timestamp * 1000)
        });

        const event = await EventModel.where({address: db_to.attributes.id}).fetch();

        const sale = new SaleModel({
            ticket: db_id.id,
            end: new Date(infos.end * 1000),
            begin: new Date(infos.begin * 1000),
            status: 'open',
            event: event ? event.id : null,
            update_height: 0,
            live: db_id.id
        });
        await sale.save(null, {transacting: t});
        db_id.set('current_sale', sale.id);
        await db_id.save(null, {transacting: t});

        await action.save(null, {transacting: t});

        await register_tx(infos.event_signature, t);
    })
        .then((): void => {
            Signale.success(`[evm-events][sale] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
        })
        .catch((e: Error): void => {
            Signale.error(`[evm-events][sale] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
            Signale.error(e);
            throw e; // Not sure about this one => should we make it restart until it passes ?
        });

    return;

}
