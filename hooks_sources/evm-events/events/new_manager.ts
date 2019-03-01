import * as Signale from 'signale';

export const new_manager_fetch_call = async (EventManagersRegistry: any, begin: number, end: number): Promise<any> =>
    (await EventManagersRegistry.getPastEvents('NewManager', {fromBlock: begin, toBlock: end} as any))
        .map((event: any) =>
            ({
                block: event.blockNumber,
                raw: event.raw.topics.concat([event.raw.data]),
                tx_idx: event.transactionIndex
            }));

export const new_manager_view_call = (raw: string[]): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[2].slice(26),
        to: '0x' + raw[1].slice(26),
        id: 0,
        infos: {}
    });

export async function new_manager_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][new_manager] address: ${db_to.attributes.address} block: ${block}`);

    db_to.set('event_manager', true);

    await db_to.save();

    return ;

}
