import * as Signale                       from 'signale';
import { available, register, signature } from './signature';

export const delete_admin_fetch_call = async (AdministrationBoard: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await AdministrationBoard.getPastEvents('DeleteAdmin', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics.concat([event.raw.data]),
                    tx_idx: event.transactionIndex,
                    tx_hash: event.transactionHash,
                    log_idx: event.logIndex
                }))
    );

export const delete_admin_view_call = (raw: string[], block: any, tx_hash: string, log_idx: number): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[1].slice(26),
        to: '0x' + raw[1].slice(26),
        id: 0,
        infos: {
            event_timestamp: block.timestamp,
            tx_hash,
            event_signature: signature(raw, 'DeleteAdmin', tx_hash, log_idx)
        }
    });

export async function delete_admin_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][delete_admin] address: ${db_to.attributes.address} block: ${block}`);

    if (!await available(infos.event_signature)) {
        Signale.warn(`[evm-events][delete_admin] address: ${db_to.attributes.address} block: ${block} | Already registered`);
        return ;
    }

    db_to.set('admin', false);

    await db_to.save();

    await register(infos.event_signature);

    return ;

}
