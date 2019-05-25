import * as Signale from 'signale';

export const mint_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Mint', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics,
                    tx_idx: event.transactionIndex
                }))
    );

export const mint_view_call = (raw: string[]): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[1].slice(26),
        id: parseInt(raw[2], 16),
        infos: {}
    });

export async function mint_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][mint] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
    const {db_id}: { db_id: any; } = await this.ticket_check(id);
    const action = new this.action({
        by: db_by.id,
        to: db_to.id,
        on_ticket: db_id.id,
        action_type: 'mint',
        infos: infos,
        block: block
    });
    await action.save();

    const event = await this.event.where({address: db_to.id}).fetch();

    if (event) {
        db_id.set({
            mint_block: block,
            owner: db_to.id,
            event: event.id,
            issuer: db_to.id
        });
    } else {
        db_id.set({
            mint_block: block,
            owner: db_to.id,
            event: null,
            issuer: db_to.id
        });
    }
    await db_id.save();
    return ;

}
