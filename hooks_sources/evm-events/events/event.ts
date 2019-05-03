import * as Signale from 'signale';

export const event_fetch_call = async (T721: any, begin: number, end: number): Promise<any> =>
    (await T721.getPastEvents('Event', {fromBlock: begin, toBlock: end} as any))
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

    const queuedevent = await this.strapi.services.queuedevent.fetchAll({
        address: db_to.attributes.address
    });

    const data: any = {};

    if (queuedevent.models.length !== 0) {
        const ev = queuedevent.models[0];
        data.name = ev.attributes.name;
        data.description = ev.attributes.description;

        if (ev.relations.banners.models.length !== 0) {
            data.banners = ev.relations.banners.models.map((banner: any): number => banner.attributes.upload_file_id);
        }

        if (ev.relations.image) {
            data.image = ev.relations.image.attributes.upload_file_id;
        }

        data.location = ev.attributes.location;
        data.start = ev.attributes.start;
        data.end = ev.attributes.end;

    }

    await this.strapi.services.event.add({
        address: db_to.id,
        name: data.name || 'Event',
        description: data.description,
        banners: data.banners,
        image: data.image,
        owner: db_by.id,
        eventcontract: eventcontract !== null ? eventcontract.id : null,
        location: data.location,
        start: data.start,
        end: data.end,
        creation: new Date(Date.now())
    });

    if (queuedevent.models.length !== 0) {
        await this.queuedevents.where({address: db_to.attributes.address}).destroy();
    }

    db_to.set('event', true);

    await db_to.save();

    return ;
}
