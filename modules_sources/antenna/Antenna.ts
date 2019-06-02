import { eth } from '../misc/eth';

import * as Signale    from 'signale';
import * as Knex       from 'knex';
import Web3 = require('web3');
import { Portalize }   from 'portalize';
import * as path       from 'path';
import { EventBridge } from './EventBridge';
import { subscriber }  from './subscriber';
import { init }        from './models';

export const from_current = (add_path: string): string => path.join(path.resolve(path.join(__dirname, '../..')), add_path);
export const name = 'Antenna';

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
            port: parseInt(process.env.DATABASE_PORT),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            timezone: 'utc',
            ssl: !!process.env.DATABASE_SSL,
            charset: 'utf8'
        }
    });

    init(knex);

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

    Signale.info(`[${name}] loading models`);

    Signale.success(`[${name}] loaded models`);

    const eb = new EventBridge(web3);

    const net_id = await web3.eth.net.getId();

    await subscriber(net_id, web3, eb);

};

export default {
    start
};
