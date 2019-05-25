import { Module } from '../ModuleRunner';
import mod        from './ChainSettingsImporter';

const requirements = (): void => {

    const env_requirements = [
        'DATABASE_HOST',
        'DATABASE_PORT',
        'DATABASE_USERNAME',
        'DATABASE_PASSWORD',
        'DATABASE_NAME',
        'ETH_NODE_PROTOCOL',
        'ETH_NODE_HOST',
        'ETH_NODE_PORT'
    ];

    const missing = [];

    for (const var_name of env_requirements) {
        if (process.env[var_name] === undefined) {
            missing.push(var_name);
        }
    }

    if (missing.length) {
        throw new Error(`Missing environment variables: ${missing}`);
    }

};

export default {
    name: 'ChainSettingsImporter',
    requirements,
    start: mod.start
} as Module;
