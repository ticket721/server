// tslint:disable-next-line
const hook = require('./index');

describe('strapi-hook-test', (): void => {

    test('Dummy test', async (done: jest.DoneCallback): Promise<void> => {
        const resolved_hook = hook();
        resolved_hook.initialize(done);
    });

});
