export {};
declare global {
    namespace NodeJS {
        interface Global {
            td: any;
        }
    }
}

// tslint:disable-next-line
const hook = require('./index');

const td = global.td;

describe('strapi-hook-test', (): void => {

    test('Dummy test', (): void => {
        const resolved_hook = hook();
        const func = td.func();
        resolved_hook.initialize(func);

        td.verify(func());
    });

});
