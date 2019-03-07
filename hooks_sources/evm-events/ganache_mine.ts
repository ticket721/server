const mine = async (web3: any): Promise<void> =>
    new Promise(
        (ok: any, ko: any): void => {
            web3.currentProvider.send(
                {
                    method: 'evm_mine',
                    params: [],
                    jsonrpc: '2.0',
                    id: new Date().getTime()
                },
                ((err: Error, val: any): void => {
                    if (err) {
                        return ko(err);
                    } else {
                        ok();
                    }
                }) as any
            );
        }
    );

export const ganache_mine = async (web3: any, count: number): Promise<void> => {

    for (let idx = 0; idx < count; ++idx) {
        await mine(web3);
        console.log(idx);
    }

};
