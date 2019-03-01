import * as Signale from 'signale';

export const event_fetch_call = async (EventRegistry: any, begin: number, end: number): Promise<any> =>
    (await EventRegistry.getPastEvents('Event', {fromBlock: begin, toBlock: end} as any))
        .map((event: any) =>
            ({
                block: event.blockNumber,
                raw: event.raw.topics,
                tx_idx: event.transactionIndex
            }));

export const event_view_call = (raw: string[]): {by: string; to: string; id: number; infos: any } =>
    ({
        by: '0x' + raw[1].slice(26),
        to: '0x' + raw[2].slice(26),
        id: 0,
        infos: {}
    });

export async function event_bridge_action(db_by: any, db_to: any, id: number, block: number, infos: any): Promise<void> {
    Signale.info(`[evm-events][event] created by: ${db_by.attributes.address} at address: ${db_to.attributes.address} block: ${block}`);
    // TODO check if corresponds to known contract type and set in event
    const action = new this.action({
        by: db_by.id,
        to: db_to.id,
        action_type: 'event',
        infos: infos,
        block: block
    });
    await action.save();

    const code = await this.web3.eth.getCode(db_to.attributes.address);
    const eventcontract = await this.eventcontracts.where({runtime_binary: code.toLowerCase()}).fetch();

    const event = new this.event({
        address: db_to.id,
        name: 'idk for the moment',
        owner: db_by.id,
        eventcontract: eventcontract !== null ? eventcontract.id : null
    });

    db_to.set('event', true);

    await event.save();
    await db_to.save();

    return ;
}
