import { Portalize }            from 'portalize';
import * as path                from 'path';
import * as Signale             from 'signale';
import * as Knex                from 'knex';
import * as Bookshelf           from 'Bookshelf';
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

    const knex: Knex = Knex({
        client: 'pg',
        connection: {
            host: process.env.DATABASE_HOST,
            port: process.env.DATABASE_PORT,
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            timezone: 'utc',
            ssl: !!process.env.DATABASE_SSL,
            charset: 'utf8'
        }
    });

    const bs: Bookshelf = Bookshelf(knex);

    Signale.success(`[${name}] connection succesful`);

    let web3;

    switch (process.env.ETH_NODE_PROTOCOL) {
        case 'http':
        case 'https':
            // @ts-ignore
            web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ETH_NODE_PROTOCOL}://${process.env.ETH_NODE_HOST}:${process.env.ETH_NODE_PORT}`));
            break;
        default:
            throw new Error(`[${name}] Unknown Ethereum Node Communication protocol ${process.env.ETH_NODE_PROTOCOL}`);
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
    await load_networks(NetworkModel, web3);
};

export default {
    start
};