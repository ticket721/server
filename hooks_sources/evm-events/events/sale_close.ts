import * as Signale from 'signale';

export const sale_close_fetch_call = async (T721: any, begin: number, end: number): Promise<any> =>
    (await T721.getPastEvents('SaleClose', {fromBlock: begin, toBlock: end} as any))
        .map((event: any) =>
            ({
                block: event.blockNumber,
                raw: event.raw.topics,
                tx_idx: event.transactionIndex
            }));

export const sale_close_view_call = (raw: string[], block: number): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[3].slice(26),
        to: '0x' + raw[1].slice(26),
        id: parseInt(raw[2], 16),
        infos: {}
    });

export async function sale_close_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {

    Signale.info(`[evm-events][sale_close] by: ${db_by.attributes.address} to: ${db_to.attributes.address} id: ${id} block: ${block}`);
    const {db_id}: { db_id: any; } = await this.ticket_check(id);
    const action = new this.action({
        by: db_by.id,
        to: db_to.id,
        on_ticket: db_id.id,
        action_type: 'sale_close',
        infos: infos,
        block: block
    });

    await action.save();

    const sale = await this.sale.where({ticket: db_id.id, status: 'open'}).fetch();
    sale.set({
        end_block: block,
        status: 'closed'
    });
    await sale.save();

    return ;

}
