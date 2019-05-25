import * as Signale from 'signale';
import * as BIP39 from 'bip39';

export const event_fetch_call = async (T721: any, block_fetcher: any, begin: number, end: number): Promise<any> =>
    await Promise.all(
        (await T721.getPastEvents('Event', {fromBlock: begin, toBlock: end} as any))
            .map(async (event: any): Promise<any> =>
                ({
                    block: await block_fetcher(event.blockNumber),
                    raw: event.raw.topics,
                    tx_idx: event.transactionIndex
                }))
    );

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

    if (queuedevent.length !== 0) {
        const ev = queuedevent[0];
        data.name = ev.name;
        data.description = ev.description;

        if (ev.banners.length !== 0) {
            data.banners = ev.banners.map((banner: any): number => banner.id);
        }

        if (ev.image) {
            data.image = ev.image.id;
        }

        data.location = ev.location;
        data.start = ev.start;
        data.end = ev.end;

    }

    await this.strapi.services.event.add({
        address: db_to.id,
        name: data.name || BIP39.generateMnemonic().split(' ').slice(0, 3).map((name: string): string => `${name.charAt(0).toUpperCase()}${name.slice(1)}`).join(' '),
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

    if (queuedevent.length !== 0) {
        await this.queuedevents.where({address: db_to.attributes.address}).destroy();
    }

    db_to.set('event', true);

    await db_to.save();

    return ;
}
