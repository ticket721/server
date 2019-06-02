module.exports.env = async function env() {

    if (!process.env.T721_SERVER) {
        throw new Error('env: T721_SERVER is not defined');
    }

    if (['development', 'ropsten', 'mainnet'].indexOf(process.env.T721_SERVER) === -1) {
        throw new Error(`env: Unknown T721_SERVER value: ${process.env.T721_SERVER}`);
    }

};
