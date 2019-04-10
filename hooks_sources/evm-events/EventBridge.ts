export interface Args {
    type: string;
    by: string;
    to: string;
    id: number;
    infos: any;
    block: number;
    tx_idx: number;
}

interface Payloads {
    [key: string]: Args[];
}

import { utils } from 'ethers';

import { mint_bridge_action }         from './events/mint';
import { transfer_bridge_action }     from './events/transfer';
import { event_bridge_action }        from './events/event';
import { sale_bridge_action }         from './events/sale';
import { buy_bridge_action }          from './events/buy';
import { sale_close_bridge_action }   from './events/sale_close';
import { new_admin_bridge_action }    from './events/new_admin';
import { delete_admin_bridge_action } from './events/delete_admin';

/**
 * Bridges the bookshelf models with the ethereum events. Creates, manages, edits and deletes accordingly
 */
export class EventBridge {

    private readonly address: any;
    private readonly action: any;
    private readonly ticket: any;
    private readonly event: any;
    private readonly sale: any;
    private readonly eventcontracts: any;
    private readonly web3: any;
    private payloads: Payloads;
    private end: number = 0;
    private height: any;

    constructor(address: any, action: any, ticket: any, event: any, sale: any, eventcontracts: any, web3: any) {
        this.address = address;
        this.action = action;
        this.ticket = ticket;
        this.event = event;
        this.sale = sale;
        this.eventcontracts = eventcontracts;
        this.web3 = web3;
        this.reset_payloads();
    }

    /**
     * Set the height model
     * @param height Height Model
     */
    public readonly setHeight = (height: any): void => {
        this.height = height;
    }

    /**
     * Set the current end for the payload. It will be saved as height is everything goes well
     * @param end
     */
    public setEnd(end: number): void {
        this.end = end;
    }

    /**
     * Accepts input from event type. Bufferizes everything and sorts when everything is received.
     * @param type
     * @param args
     */
    public async feed(type: string, args: Args[]): Promise<void> {
        this.payloads[type] = args;

        for (const payload of Object.keys(this.payloads)) {
            if (this.payloads[payload] === null) return;
        }

        let round_payloads: Args[] = [];

        for (const payload of Object.keys(this.payloads)) {
            round_payloads = round_payloads.concat(this.payloads[payload]);
        }

        this.reset_payloads();

        round_payloads
            .sort((a: Args, b: Args): number => {
                if (a.block !== b.block) {
                    return a.block - b.block;
                } else {
                    return a.tx_idx - b.tx_idx;
                }
            });

        for (const arg of round_payloads) {
            await this._feed(arg.type, arg.by, arg.to, arg.id, arg.infos, arg.block);
        }

        this.height.set({height: this.end});
        await this.height.save();

    }

    /**
     * Resets the current payloads
     */
    private readonly reset_payloads = (): void => {
        this.payloads = {
            'mint': null,
            'transfer': null,
            'event': null,
            'sale': null,
            'buy': null,
            'sale_close': null,
            'new_admin': null,
            'delete_admin': null
        };
    }

    /**
     * Checks if given id has a model, creates it if not
     * @param id
     */
    private async ticket_check(id: number): Promise<{ db_id: any; }> {

        let db_id = await this.ticket.where({ticket_id: id}).fetch();

        if (db_id === null) {
            db_id = new this.ticket({ticket_id: id, owner: null});
            try {
                await db_id.save();
            } catch (e) {
                throw new Error(`Unable to insert new ticket into store: ${id}`);
            }
        }

        return {db_id};
    }

    /**
     * Checks if given addresses have models, creates them if not
     * @param by address
     * @param to address
     */
    private async address_check(by: string, to: string): Promise<{ db_by: any; db_to: any; }> {

        let db_by = await this.address.where({address: by}).fetch();

        // Check by address
        if (db_by === null) {
            db_by = new this.address({address: by, admin: false, event: false});
            try {
                await db_by.save();
            } catch (e) {
                throw new Error(`Unable to insert new address into store: ${by}`);
            }
        }

        let db_to = await this.address.where({address: to}).fetch();

        // Check to address
        if (db_to === null) {
            db_to = new this.address({address: to, admin: false, event: false});
            try {
                await db_to.save();
            } catch (e) {
                throw new Error(`Unable to insert new address into store: ${to}`);
            }
        }

        return ({db_by, db_to});
    }

    private async _feed(action: string, by: string, to: string, id: number, infos: any, block: number): Promise<void> {
        by = utils.getAddress(by);
        to = utils.getAddress(to);

        const {db_by, db_to}: { db_by: any; db_to: any; } = await this.address_check(by, to);

        switch /* istanbul ignore next */ (action) {

            case /* istanbul ignore next */
            'mint':
                /* istanbul ignore next */
                return await (mint_bridge_action.bind(this)(db_by, db_to, id, block, infos));
            case /* istanbul ignore next */
            'transfer':
                /* istanbul ignore next */
                return await (transfer_bridge_action.bind(this)(db_by, db_to, id, block, infos));
            case /* istanbul ignore next */
            'event':
                /* istanbul ignore next */
                return await (event_bridge_action.bind(this)(db_by, db_to, id, block, infos));
            case /* istanbul ignore next */
            'sale':
                /* istanbul ignore next */
                return await (sale_bridge_action.bind(this)(db_by, db_to, id, block, infos));
            case /* istanbul ignore next */
            'buy':
                /* istanbul ignore next */
                return await (buy_bridge_action.bind(this)(db_by, db_to, id, block, infos));
            case /* istanbul ignore next */
            'sale_close':
                /* istanbul ignore next */
                return await (sale_close_bridge_action.bind(this)(db_by, db_to, id, block, infos));
            case /* istanbul ignore next */
            'new_admin':
                /* istanbul ignore next */
                return await (new_admin_bridge_action.bind(this)(db_by, db_to, id, block, infos));
            case /* istanbul ignore next */
            'delete_admin':
                /* istanbul ignore next */
                return await (delete_admin_bridge_action.bind(this)(db_by, db_to, id, block, infos));

            case 'test': {
                const {db_id}: { db_id: any; } = await this.ticket_check(id);
            }

        }
    }

}
