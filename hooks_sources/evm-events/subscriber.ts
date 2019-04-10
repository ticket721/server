import { EventBridge }                             from './EventBridge';
import { Portalize }                               from 'portalize';
import { EventFetcher }                                from './EventFetcher';
import { mint_fetch_call, mint_view_call }             from './events/mint';
import { transfer_fetch_call, transfer_view_call }         from './events/transfer';
import * as Signale                                        from 'signale';
import { event_fetch_call, event_view_call }                   from './events/event';
import { sale_fetch_call, sale_view_call }                     from './events/sale';
import { buy_fetch_call, buy_view_call }                       from './events/buy';
import { sale_close_fetch_call, sale_close_view_call }         from './events/sale_close';
import { new_admin_fetch_call, new_admin_view_call }           from './events/new_admin';
import { delete_admin_fetch_call, delete_admin_view_call }     from './events/delete_admin';

interface Heights {
    mint: any;
    sale: any;
    sale_close: any;
    buy: any;
    transfer: any;
    approval: any;
    approval_for_all: any;
}

const get_height = async (height: any): Promise<any> => {

    let ret = await height.where({}).fetch();

    if (ret === null) {
        ret = new height({height: 0});
        try {
            await ret.save();
        } catch (e) {
            throw new Error('Unable to save create height');
        }
    }

    return ret;
};

const close_outdated_sales = async (sale: any, block: number): Promise<void> => {

    const sales = await sale.where(function (): any {
        this.where('end_block', '<', block);
        this.where({status: 'open'});
    }).fetchAll();

    if (sales.length) {
        for (sale of sales.models) {
            sale.set({status: 'ended'});
            await sale.save();
        }
    }
};

export async function subscriber(network_infos: any, web3: Web3, eb: EventBridge, height: any, sale: any): Promise<void> {

    const AdministrationBoardArtifact = Portalize.get.get('AdministrationBoardV0.artifact.json', {module: 'contracts'});
    const T721Artifact = Portalize.get.get('T721V0.artifact.json', {module: 'contracts'});

    const AdministrationBoard = new web3.eth.Contract(AdministrationBoardArtifact.abi, AdministrationBoardArtifact.networks[network_infos.network_id].address);
    const T721 = new web3.eth.Contract(T721Artifact.abi, T721Artifact.networks[network_infos.network_id].address);

    const heights = await get_height(height);
    const fetchers: EventFetcher[] = [];

    fetchers.push(new EventFetcher('mint', mint_fetch_call.bind(null, T721), mint_view_call, eb.feed.bind(eb, 'mint')));
    fetchers.push(new EventFetcher('transfer', transfer_fetch_call.bind(null, T721), transfer_view_call, eb.feed.bind(eb, 'transfer')));
    fetchers.push(new EventFetcher('sale', sale_fetch_call.bind(null, T721), sale_view_call, eb.feed.bind(eb, 'sale')));
    fetchers.push(new EventFetcher('sale_close', sale_close_fetch_call.bind(null, T721), sale_close_view_call, eb.feed.bind(eb, 'sale_close')));
    fetchers.push(new EventFetcher('buy', buy_fetch_call.bind(null, T721), buy_view_call, eb.feed.bind(eb, 'buy')));
    fetchers.push(new EventFetcher('event', event_fetch_call.bind(null, T721), event_view_call, eb.feed.bind(eb, 'event')));
    fetchers.push(new EventFetcher('new_admin', new_admin_fetch_call.bind(null, AdministrationBoard), new_admin_view_call, eb.feed.bind(eb, 'new_admin')));
    fetchers.push(new EventFetcher('delete_admin', delete_admin_fetch_call.bind(null, AdministrationBoard), delete_admin_view_call, eb.feed.bind(eb, 'delete_admin')));

    eb.setHeight(heights);

    let log_idle: boolean = false;

    while (true) {
        const current_block = await web3.eth.getBlockNumber();
        const begin = heights.attributes.height;
        const end = begin + 100 > current_block ? current_block : begin + 100;

        await close_outdated_sales(sale, begin);

        if (begin === end) {
            if (!log_idle) {
                Signale.info('[evm-events] ...');
                log_idle = true;
            }
            await new Promise((ok: any, ko: any): any => setTimeout((): void => ok(), 10000));
            continue ;
        }

        if (log_idle) {
            log_idle = false;
        }

        eb.setEnd(end);

        await Promise.all(fetchers.map(async (fetcher: EventFetcher) => fetcher.fetch(begin + 1, end)));
    }
}
