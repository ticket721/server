import * as Signale from 'signale';
import { BigNumber }  from 'ethers/utils';

import { ActionModel, EventModel }        from '../models';
import { available, register, signature } from './signature';

export const mint_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Mint', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics.concat([`0x${event.raw.data.slice(2, 64 + 2)}`, `0x${event.raw.data.slice(2 + 64)}`]),
                    tx_idx: event.transactionIndex,
                    tx_hash: event.transactionHash,
                    log_idx: event.logIndex
                }))
    );

export const mint_view_call = (raw: string[], block: any, tx_hash: string, log_idx: number): { by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[1].slice(26),
        id: parseInt(raw[2], 16),
        infos: {
            event_timestamp: block.timestamp,
            price: raw[4],
            currency: raw[5],
            tx_hash,
            event_signature: signature(raw, 'Mint', tx_hash, log_idx)
        }
    });

export async function mint_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][mint] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);

    if (!await available(infos.event_signature)) {
        Signale.warn(`[evm-events][mint] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block} | Already registered`);
        return ;
    }

    const {db_id}: { db_id: any; } = await this.ticket_check(id);
    const action = new ActionModel({
        by: db_by.id,
        to: db_to.id,
        on_ticket: db_id.id,
        action_type: 'mint',
        infos: infos,
        block: block,
        tx_hash: infos.tx_hash,
        action_timestamp: new Date(infos.event_timestamp * 1000)
    });
    await action.save();

    const decimal_price = new BigNumber(infos.price).toString();
    const currency = `0x${infos.currency.slice(26)}`;

    const event = await EventModel.where({address: db_to.id}).fetch();

    if (event) {
        db_id.set({
            mint_block: block,
            owner: db_to.id,
            event: event.id,
            issuer: db_to.id,
            creation: new Date(infos.event_timestamp * 1000),
            mint_price: decimal_price,
            mint_currency: currency
        });
    } else {
        db_id.set({
            mint_block: block,
            owner: db_to.id,
            event: null,
            issuer: db_to.id,
            creation: new Date(infos.event_timestamp * 1000),
            mint_price: decimal_price,
            mint_currency: currency
        });
    }
    await db_id.save();

    await register(infos.event_signature);

    return;

}
