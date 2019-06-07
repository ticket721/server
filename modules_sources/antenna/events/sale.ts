import * as Signale from 'signale';

import { ActionModel, EventModel, SaleModel } from '../models';

export const sale_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Sale', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics.concat([event.raw.data]),
                    tx_idx: event.transactionIndex,
                    tx_hash: event.transactionHash
                }))
    );

export const sale_view_call = (raw: string[], block: any, tx_hash: string): { by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[1].slice(26),
        id: parseInt(raw[2], 16),
        infos: {
            event_timestamp: block.timestamp,
            begin: block.timestamp,
            end: parseInt(raw[4], 16),
            tx_hash
        }
    });

export async function sale_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][sale] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
    const {db_id}: { db_id: any; } = await this.ticket_check(id);
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
    await sale.save();
    db_id.set('current_sale', sale.id);
    await db_id.save();

    await action.save();
    return;

}
