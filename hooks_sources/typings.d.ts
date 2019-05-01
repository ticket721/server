declare type HookCallback = (e?: Error) => void;

declare type Web3 = any;

declare type Hook = {
    defaults: any;
    initialize: (cb: () => void) => void
};

declare interface StrapiServices {
    [key: string]: any;
}

declare type StrapiCtx = {
    services: StrapiServices;
    models: any;
    log: any;
    utils: any;
    api: any;
    hook: any;
    ethereum: any;
};
