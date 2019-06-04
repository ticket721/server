import { Portalize }            from 'portalize';
import * as path                from 'path';
import * as Signale             from 'signale';
import * as Knex                from 'knex';
import * as Bookshelf           from 'bookshelf';
import Web3 = require('web3');
import { load_minters }         from './LoadMinters';
import { load_marketers }       from './LoadMarketers';
import { load_approvers }       from './LoadApprovers';
import { load_event_contracts } from './LoadEventContracts';
import { load_networks }        from './LoadNetworks';
import { eth }    from '../misc/eth';

export const from_current = (add_path: string): string => path.join(path.resolve(path.join(__dirname, '../..')), add_path);
export const name = 'ChainSettingsImporter';

interface Minter {
    id: number;
    name: string;
}

const start = async (): Promise<void> => {

    console.log();
    console.log(eth);

    Signale.info(`[${name}] connecting to portal`);

    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('server');

    Signale.info(`[${name}] connecting to database`);
    let knex: Knex = null;
    const knex_tries = process.env.PG_CONNECTION_RETRIES || 10;
    let try_idx = 0;

    while (knex === null && try_idx < knex_tries) {
        try {
            knex = Knex({
                client: 'pg',
                connection: {
                    host: process.env.DATABASE_HOST,
                    port: parseInt(process.env.DATABASE_PORT),
                    user: process.env.DATABASE_USERNAME,
                    password: process.env.DATABASE_PASSWORD,
                    database: process.env.DATABASE_NAME,
                    timezone: 'utc',
                    ssl: !!process.env.DATABASE_SSL,
                    charset: 'utf8'
                }
            });
            await knex.raw('select "height".* from height');
        } catch (e) {
            console.error(e);
            knex = null;
            Signale.warn(`[${name}] Cannot connect to postgres or postgres not ready, [${try_idx}/${knex_tries}]`);
            ++try_idx;
            if (try_idx >= knex_tries) {
                process.exit(1);
            }
            await new Promise((ok: any, ko: any): any => setTimeout(ok, 10000));
        }
    }

    const bs: Bookshelf = Bookshelf(knex);

    Signale.success(`[${name}] connection succesful`);

    let web3 = null;
    const web3_tries = process.env.PG_CONNECTION_RETRIES || 10;
    try_idx = 0;

    while (web3 === null && try_idx < web3_tries) {
        try {
            switch (process.env.ETH_NODE_PROTOCOL) {
                case 'http':
                case 'https':
                    // @ts-ignore
                    web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ETH_NODE_PROTOCOL}://${process.env.ETH_NODE_HOST}:${process.env.ETH_NODE_PORT}`));
                    break;
                default:
                    throw new Error(`[${name}] Unknown Ethereum Node Communication protocol ${process.env.ETH_NODE_PROTOCOL}`);
            }
            const test_request = await web3.eth.getBlockNumber();
        } catch (e) {
            console.error(e);
            web3 = null;
            Signale.warn(`[${name}] Cannot connect to eth node, [${try_idx}/${web3_tries}]`);
            ++try_idx;
            if (try_idx >= web3_tries) {
                process.exit(1);
            }
            await new Promise((ok: any, ko: any): any => setTimeout(ok, 10000));
        }
    }

    const event_infos = Portalize.get.get('event_infos.json', {module: 'contracts'});

    Signale.success(`[${name}] recovered events informations`);

    const MinterModel: Bookshelf.Model<any> = (bs.Model.extend({
        tableName: 'minters',
        hasTimestamps: true
    }) as any) as Bookshelf.Model<any>;

    const MarketerModel: Bookshelf.Model<any> = (bs.Model.extend({
        tableName: 'marketers',
        hasTimestamps: true
    }) as any) as Bookshelf.Model<any>;

    const ApproverModel: Bookshelf.Model<any> = (bs.Model.extend({
        tableName: 'approver',
        hasTimestamps: true
    }) as any) as Bookshelf.Model<any>;

    const ECModel: Bookshelf.Model<any> = (bs.Model.extend({
        tableName: 'eventcontract',
        hasTimestamps: true
    }) as any) as Bookshelf.Model<any>;

    const NetworkModel: Bookshelf.Model<any> = (bs.Model.extend({
        tableName: 'networks',
        hasTimestamps: true
    }) as any) as Bookshelf.Model<any>;

    await load_minters(MinterModel, event_infos.minters);
    await load_marketers(MarketerModel, event_infos.marketers);
    await load_approvers(ApproverModel, event_infos.approvers);
    await load_event_contracts(ECModel, MinterModel, MarketerModel, ApproverModel, event_infos.events);

    const T721V0Height = Portalize.get.get('T721V0.height.json', {module: 'contracts'});
    let current_height = await web3.eth.getBlockNumber();

    while (current_height < T721V0Height.height) {
        Signale.info(`[${name}] Current block is ${current_height}, expected height is ${T721V0Height.height}: waiting ...`);
        await new Promise((ok: any, ko: any): any => setTimeout(ok, 10000));
        current_height = await web3.eth.getBlockNumber();
    }
    Signale.success(`[${name}] Current block is ${current_height}, expected height is ${T721V0Height.height}: proceeding`);

    await load_networks(NetworkModel, web3);
};

export default {
    start
};
