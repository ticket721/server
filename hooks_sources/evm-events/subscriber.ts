import { EventBridge }                             from './EventBridge';
import { Portalize }                               from 'portalize';
import { EventFetcher }                                from './EventFetcher';
import { mint_fetch_call, mint_view_call }             from './events/mint';
import { transfer_fetch_call, transfer_view_call }         from './events/transfer';
import * as Signale                                        from 'signale';
import { event_fetch_call, event_view_call }               from './events/event';
import { sale_fetch_call, sale_view_call }                 from './events/sale';
import { buy_fetch_call, buy_view_call }                   from './events/buy';
import { sale_close_fetch_call, sale_close_view_call }     from './events/sale_close';
import { new_admin_fetch_call, new_admin_view_call }       from './events/new_admin';
import { delete_admin_fetch_call, delete_admin_view_call } from './events/delete_admin';
import { update }                                          from './prices';

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

const close_outdated_sales = async (sale: any, end: Date): Promise<void> => {

    const sales = await sale.where(function (): any {
        this.where('end', '<', end);
        this.where({status: 'open'});
    }).fetchAll({
        withRelated: ['ticket']
    });

    if (sales.length) {
        for (sale of sales.models) {
            sale.set({status: 'ended', live: null});
            sale.relations.ticket.set('current_sale', null);
            await sale.relations.ticket.save();
            await sale.save();
        }
    }
};

const update_open_sales_prices = async (sale: any, eventcontract: any, prices: any, web3: Web3, block: number): Promise<void> => {
    const sales = await sale.where({
        status: 'open'
    }).fetchAll({
        withRelated: ['event', 'event.address', 'prices', 'ticket']
    });

    if (sales.length) {
        for (const unique_sale of sales.models) {
            if (unique_sale.attributes.update_height < block) {
                await update(unique_sale, eventcontract, prices, web3, block);
            }
        }
    }

};

export async function subscriber(network_infos: any, web3: Web3, eb: EventBridge, height: any, sale: any, eventcontract: any, prices: any): Promise<void> {

    const AdministrationBoardArtifact = Portalize.get.get('AdministrationBoardV0.artifact.json', {module: 'contracts'});
    const T721Artifact = Portalize.get.get('T721V0.artifact.json', {module: 'contracts'});

    const AdministrationBoard = new web3.eth.Contract(AdministrationBoardArtifact.abi, AdministrationBoardArtifact.networks[network_infos.network_id].address);
    const T721 = new web3.eth.Contract(T721Artifact.abi, T721Artifact.networks[network_infos.network_id].address);

    const heights = await get_height(height);
    const fetchers: EventFetcher[] = [];

    const block_store = {};

    const block_fetcher = async (blockNumber: number): Promise<any> => {
        if (block_store[blockNumber]) return block_store[blockNumber];
        return await web3.eth.getBlock(blockNumber);
    };

    fetchers.push(new EventFetcher('mint', mint_fetch_call.bind(null, T721, block_fetcher), mint_view_call, eb.feed.bind(eb, 'mint')));
    fetchers.push(new EventFetcher('transfer', transfer_fetch_call.bind(null, T721, block_fetcher), transfer_view_call, eb.feed.bind(eb, 'transfer')));
    fetchers.push(new EventFetcher('sale', sale_fetch_call.bind(null, T721, block_fetcher), sale_view_call, eb.feed.bind(eb, 'sale')));
    fetchers.push(new EventFetcher('sale_close', sale_close_fetch_call.bind(null, T721, block_fetcher), sale_close_view_call, eb.feed.bind(eb, 'sale_close')));
    fetchers.push(new EventFetcher('buy', buy_fetch_call.bind(null, T721, block_fetcher), buy_view_call, eb.feed.bind(eb, 'buy')));
    fetchers.push(new EventFetcher('event', event_fetch_call.bind(null, T721, block_fetcher), event_view_call, eb.feed.bind(eb, 'event')));
    fetchers.push(new EventFetcher('new_admin', new_admin_fetch_call.bind(null, AdministrationBoard, block_fetcher), new_admin_view_call, eb.feed.bind(eb, 'new_admin')));
    fetchers.push(new EventFetcher('delete_admin', delete_admin_fetch_call.bind(null, AdministrationBoard, block_fetcher), delete_admin_view_call, eb.feed.bind(eb, 'delete_admin')));

    eb.setHeight(heights);

    let log_idle: boolean = false;

    let closing_process = false;

    setInterval(async (): Promise<void> => {
        if (!closing_process) {
            closing_process = true;
            await close_outdated_sales(sale, new Date(Date.now()));
            closing_process = false;
        }
    }, 20000);

    while (true) {
        const current_block = await web3.eth.getBlockNumber();
        const begin = heights.attributes.height;
        const end = begin + 100 > current_block ? current_block : begin + 100;

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

        for (const block_num of Object.keys(block_store)) {
            delete block_store[block_num];
        }

        await update_open_sales_prices(sale, eventcontract, prices, web3, begin);
    }
}
