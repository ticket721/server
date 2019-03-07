import * as knex       from 'knex';
import Bookshelf =  require('bookshelf');
import { EventBridge }   from './EventBridge';

const addresses = [
    '0x931D387731bBbC988B312206c74F77D004D6B84b',
    '0x518C28DC09bc7eccD07b187e39BF5F7C26D3F38F'
];
const types = [
    'mint',
    'transfer',
    'event',
    'sale',
    'buy',
    'sale_close',
    'new_admin',
    'delete_admin',
    'new_manager',
    'delete_manager'
];

describe('Testing EventBridge', (): void => {

    beforeAll((): void => {
        this.db = knex({
            client: 'postgres'
        });

    });

    afterAll((): void => {
        this.db.destroy();
    });

    beforeEach((): void => {
        this.mock_knex = require('mock-knex');

        this.mock_knex.mock(this.db);

        this.bookshelf = Bookshelf(this.db);

        this.Address = this.bookshelf.Model;
        this.Action = this.bookshelf.Model;
        this.Ticket = this.bookshelf.Model;
        this.Event = this.bookshelf.Model;
        this.Sale = this.bookshelf.Model;
        this.EventContract = this.bookshelf.Model;
        this.Height = {
            set: (): void => {},
            save: (): void => {}
        };

    });

    afterEach((): void => {
        this.mock_knex.unmock(this.db);
    });

    test('testing db fail case: creating by', async (done: jest.DoneCallback): Promise<void> => {
        const eb = new EventBridge(this.Address, this.Action, this.Ticket, this.Event, this.Sale, this.EventContract, {});
        eb.setHeight(this.Height);

        const tracker = this.mock_knex.getTracker();

        tracker.install();

        tracker.on('query', (query: any): void => {
            switch (query.step) {
                case 1:
                    // When checking for by
                    return query.response();
                case 2:
                    // When creating by
                    return query.response();
            }

        });

        try {
            await eb.feed('test', [{type: 'test', by: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', to: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', id: 10, infos: {}, block: 10, tx_idx: 10}]);
            for (const type of types) {
                await eb.feed(type, []);
            }
        } catch (e) {
            tracker.uninstall();
            return done();
        }

        done(new Error('Should have thrown'));
    });

    test('testing db fail case: creating to', async (done: jest.DoneCallback): Promise<void> => {
        const eb = new EventBridge(this.Address, this.Action, this.Ticket, this.Event, this.Sale, this.EventContract, {});
        eb.setHeight(this.Height);

        const tracker = this.mock_knex.getTracker();

        tracker.install();

        tracker.on('query', (query: any): void => {
            switch (query.step) {
                case 1:
                    // When checking for by
                    return query.response([]);
                case 2:
                    // When creating by
                    return query.response([1]);

                case 3:
                    // When checking for to
                    return query.response([]);
                case 4:
                    // When creating to
                    return query.response();
            }

        });

        try {
            await eb.feed('test', [{type: 'test', by: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', to: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', id: 10, infos: {}, block: 10, tx_idx: 10}]);
            for (const type of types) {
                await eb.feed(type, []);
            }
        } catch (e) {
            tracker.uninstall();
            return done();
        }

        done(new Error('Should have thrown'));

    });

    test('adding mint event, by, to and id are known', async (done: jest.DoneCallback): Promise<void> => {
        const eb = new EventBridge(this.Address, this.Action, this.Ticket, this.Event, this.Sale, this.EventContract, {});
        eb.setHeight(this.Height);

        const tracker = this.mock_knex.getTracker();

        tracker.install();

        tracker.on('query', (query: any): void => {
            switch (query.step) {
                case 1:
                    // When checking for by
                    return query.response([{id: 1}]);
                case 2:
                    // When checking for to
                    return query.response([{id: 2}]);
                case 3:
                    // When checking for id
                    return query.response([{id: 3}]);

            }

        });

        await eb.feed('test', [{type: 'test', by: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', to: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', id: 10, infos: {}, block: 10, tx_idx: 10}]);
        for (const type of types) {
            await eb.feed(type, []);
        }

        tracker.uninstall();
        done();
    });

    test('adding mint event on empty db', async (done: jest.DoneCallback): Promise<void> => {
        const eb = new EventBridge(this.Address, this.Action, this.Ticket, this.Event, this.Sale, this.EventContract, {});
        eb.setHeight(this.Height);

        const tracker = this.mock_knex.getTracker();

        tracker.install();

        tracker.on('query', (query: any): void => {
            switch (query.step) {
                case 1:
                    // When checking for by
                    return query.response([]);
                case 2:
                    // When creating by
                    return query.response([1]);

                case 3:
                    // When checking for to
                    return query.response([]);
                case 4:
                    // When creating to
                    return query.response([2]);

                case 5:
                    // Shen checking for id
                    return query.response([]);
                case 6:
                    // When creating id
                    return query.response([3]);
            }

        });

        await eb.feed('test', [{type: 'test', by: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', to: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', id: 10, infos: {}, block: 10, tx_idx: 10}]);
        for (const type of types) {
            await eb.feed(type, []);
        }

        tracker.uninstall();
        done();
    });

});
