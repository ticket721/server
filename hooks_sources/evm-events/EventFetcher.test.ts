import { EventFetcher, FetchCall, FetchInfos, FetchView, Forward, ViewOutput } from './EventFetcher';
import { Args }                                                                from './EventBridge';

describe('[EventFetcher]', () => {

    test('Create EventFetcher with custom view, forward and fetch', async (): Promise<void> => {

        const from: number = 10;
        const to: number = 20;
        const type: string = 'testing';

        const fetch_call: FetchCall = async (_from: number, _to: number): Promise<FetchInfos[]> => {
            expect(_from).toEqual(from);
            expect(_to).toEqual(to);

            return [...Array(_to - _from).keys()]
                .map((elem: number): FetchInfos => ({
                    raw: [
                        'this', 'is', 'a', 'test'
                    ],
                    block: elem
                }));
        };

        const view_call: FetchView = (raw: string[], block: number): ViewOutput => {
            return {
                by: 'me',
                to: 'you',
                id: 1234,
                infos: {
                    informat: 'ions'
                }
            };
        };

        const forward: Forward = async (args: Args[]): Promise<void> => {
            expect(args).toHaveLength(to - from);
            expect(args[0].type).toEqual(type);
        };

        const event_fetcher: EventFetcher = new EventFetcher(type, fetch_call, view_call, forward);

        await event_fetcher.fetch(from, to);

    });

});
