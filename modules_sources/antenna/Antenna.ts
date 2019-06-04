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

    init(knex);

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

    const T721V0Height = Portalize.get.get('T721V0.height.json', {module: 'contracts'});
    const ABV0Height = Portalize.get.get('AdministrationBoardV0.height.json', {module: 'contracts'});

    let current_height = await web3.eth.getBlockNumber();

    while (current_height < T721V0Height.height) {
        Signale.info(`[${name}] Current block is ${current_height}, expected height is ${T721V0Height.height}: waiting ...`);
        await new Promise((ok: any, ko: any): any => setTimeout(ok, 10000));
        current_height = await web3.eth.getBlockNumber();
    }
    Signale.success(`[${name}] Current block is ${current_height}, expected height is ${T721V0Height.height}: proceeding`);

    const eb = new EventBridge(web3);

    const net_id = await web3.eth.net.getId();

    await subscriber(net_id, web3, eb, ABV0Height.height);

};

export default {
    start
};
