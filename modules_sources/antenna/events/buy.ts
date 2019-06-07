import * as Signale               from 'signale';
import { ActionModel, SaleModel } from '../models';
import { imitate }                from 'testdouble';
import { info }                   from 'ethers/errors';

export const buy_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Buy', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics.concat([`0x${event.raw.data.slice(2, 2 + 64)}`, `0x${event.raw.data.slice(2 + 64, 2 + 2 * 64)}`, `0x${event.raw.data.slice(2 + 2 * 64)}`]),
                    tx_idx: event.transactionIndex,
                    tx_hash: event.transactionHash
                }))
    );

export const buy_view_call = (raw: string[], block: any, tx_hash: string): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[4].slice(26),
        id: parseInt(raw[2], 16),
        infos: {
            event_timestamp: block.timestamp,
            end: block.timestamp,
            tx_hash,
            price: raw[5],
            currency: '0x' + raw[6].slice(26)
        }
    });

export async function buy_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][buy] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
    const {db_id}: { db_id: any; } = await this.ticket_check(id);
    const action = new ActionModel({
        by: db_by.id,
        to: db_to.id,
        on_ticket: db_id.id,
        action_type: 'buy',
        infos: infos,
        block: block,
        tx_hash: infos.tx_hash,
        action_timestamp: new Date(infos.event_timestamp * 1000)
    });

    await action.save();

    const sale = await (new SaleModel({ticket: db_id.id, status: 'open'})).fetch();
    sale.set({
        end: new Date(infos.end * 1000),
        status: 'bought',
        live: null
    });
    await sale.save();
    db_id.set('current_sale', null);
    await db_id.save();

    return ;

}
