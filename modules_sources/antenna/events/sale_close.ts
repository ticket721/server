import * as Signale from 'signale';

import { ActionModel, BS, SaleModel }                  from '../models';
import { available, register_tx, signature } from './signature';

export const sale_close_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('SaleClose', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics,
                    tx_idx: event.transactionIndex,
                    tx_hash: event.transactionHash,
                    log_idx: event.logIndex
                }))
    );

export const sale_close_view_call = (raw: string[], block: any, tx_hash: string, log_idx: number): { by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[1].slice(26),
        id: parseInt(raw[2], 16),
        infos: {
            event_timestamp: block.timestamp,
            end: block.timestamp,
            tx_hash,
            event_signature: signature(raw, 'SaleClose', tx_hash, log_idx)
        }
    });

export async function sale_close_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][sale_close] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);

    if (!await available(infos.event_signature)) {
        Signale.warn(`[evm-events][sale_close] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block} | Already registered`);
        return ;
    }

    await BS.transaction(async (t: any) => {

        const {db_id}: { db_id: any; } = await this.ticket_check(id, t);
        const action = new ActionModel({
            by: db_by.id,
            to: db_to.id,
            on_ticket: db_id.id,
            action_type: 'sale_close',
            infos: infos,
            block: block,
            tx_hash: infos.tx_hash,
            action_timestamp: new Date(infos.event_timestamp * 1000)
        });

        await action.save(null, {transacting: t});

        const sale = await SaleModel.where({ticket: db_id.id, status: 'open'}).fetch();
        sale.set({
            end: new Date(infos.end * 1000),
            status: 'closed',
            live: null
        });
        await sale.save(null, {transacting: t});
        db_id.set('current_sale', null);
        await db_id.save(null, {transacting: t});

        await register_tx(infos.event_signature, t);

    })
        .then((): void => {
            Signale.success(`[evm-events][sale_close] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
        })
        .catch((e: Error): void => {
            Signale.error(`[evm-events][sale_close] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
            Signale.error(e);
            throw e; // Not sure about this one => should we make it restart until it passes ?
        });

    return;

}
