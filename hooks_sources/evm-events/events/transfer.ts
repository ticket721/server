import * as Signale from 'signale';

export const transfer_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Transfer', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics.concat([event.raw.data]),
                    tx_idx: event.transactionIndex
                }))
    );

export const transfer_view_call = (raw: string[]): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[1].slice(26),
        to: '0x' + raw[2].slice(26),
        id: parseInt(raw[3], 16),
        infos: {}
    });

export async function transfer_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][transfer] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
    const {db_id}: { db_id: any; } = await this.ticket_check(id);
    const action = new this.action({
        by: db_by.id,
        to: db_to.id,
        on_ticket: db_id.id,
        action_type: 'transfer',
        infos: infos,
        block: block
    });
    await action.save();

    db_id.set({
        owner: db_to.id
    });
    await db_id.save();
    return ;

}
