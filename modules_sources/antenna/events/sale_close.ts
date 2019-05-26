import * as Signale from 'signale';

import { ActionModel, SaleModel } from '../models';

export const sale_close_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('SaleClose', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics,
                    tx_idx: event.transactionIndex
                }))
    );

export const sale_close_view_call = (raw: string[], block: any): { by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[1].slice(26),
        id: parseInt(raw[2], 16),
        infos: {
            end: block.timestamp
        }
    });

export async function sale_close_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][sale_close] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
    const {db_id}: { db_id: any; } = await this.ticket_check(id);
    const action = new ActionModel({
        by: db_by.id,
        to: db_to.id,
        on_ticket: db_id.id,
        action_type: 'sale_close',
        infos: infos,
        block: block
    });

    await action.save();

    const sale = await SaleModel.where({ticket: db_id.id, status: 'open'}).fetch();
    sale.set({
        end: new Date(infos.end * 1000),
        status: 'closed',
        live: null
    });
    await sale.save();
    db_id.set('current_sale', null);
    await db_id.save();

    return;

}
