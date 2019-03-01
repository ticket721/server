import { Args } from './EventBridge';

export type FetchInfos = {
    raw: string[];
    block: number;
};

export type ViewOutput = {
    by: string;
    to: string;
    id: number;
    infos: any;
};

export type FetchCall = (from: number, to: number) => Promise<FetchInfos[]>;
export type FetchView = (raw: string[], block: number) => ViewOutput;
export type Forward = (args: Args[]) => Promise<void>;

/**
 * This class is an adapter between the web3 calls to fetch the events and the EventBridge
 */
export class EventFetcher {

    private readonly name: string;
    private readonly fetch_call: FetchCall;
    private readonly view_call: FetchView;
    private readonly forward: Forward;

    constructor(name: string, fetch_call: FetchCall, view_call: FetchView, forward: Forward) {
        this.name = name;
        this.fetch_call = fetch_call;
        this.view_call = view_call;
        this.forward = forward;
    }

    /**
     * Call this method to fetch the preconfigured events with the fetch_call method
     * @param begin Start Block
     * @param end End Block
     */
    public readonly fetch = async (begin: number, end: number): Promise<void> => {
        const res = (await this.fetch_call(begin, end))
            .map((event: any) => ({
                ...this.view_call(event.raw, event.block),
                block: event.block,
                tx_idx: event.tx_idx,
                type: this.name
            }));

        await this.forward(res);

    }

}
