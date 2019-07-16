import { keccak_256 }             from 'js-sha3';
import { EVMEventModel }          from '../models';

export const available = async (hash: string): Promise<boolean> => {
    const res = await EVMEventModel.where({
        hash: hash.toLowerCase()
    }).fetchAll();

    return res.length === 0;
};

export const register = async (hash: string): Promise<void> => {
    const signature = new EVMEventModel({
        hash: hash.toLowerCase()
    });

    await signature.save();
};

export const register_tx = async (hash: string, t: any): Promise<void> => {
    const signature = new EVMEventModel({
        hash: hash.toLowerCase()
    });

    await signature.save(null, {transacting: t});
};

export const signature = (raw: string[], event: string, tx_hash: string, log_idx: number): string =>
    keccak_256(`${event}:${raw.join()}:${tx_hash}:${log_idx}`);
