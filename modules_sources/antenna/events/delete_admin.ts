import * as Signale from 'signale';

export const delete_admin_fetch_call = async (AdministrationBoard: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await AdministrationBoard.getPastEvents('DeleteAdmin', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics.concat([event.raw.data]),
                    tx_idx: event.transactionIndex
                }))
    );

export const delete_admin_view_call = (raw: string[]): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[1].slice(26),
        to: '0x' + raw[1].slice(26),
        id: 0,
        infos: {}
    });

export async function delete_admin_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][delete_admin] address: ${db_to.attributes.address} block: ${block}`);

    db_to.set('admin', false);

    await db_to.save();

    return ;

}
