import * as Signale from 'signale';
import * as Fs from 'fs';

export interface Module {
    name: string;
    requirements: () => void;
    start: () => void;
}

const module_path = process.argv[2];

if (!module_path) {
    Signale.fatal(`Missing module argument`);
    process.exit(1);
}

const main = async (): Promise<void> => {
    const mod: Module = (await import(`./${module_path}`)).default;

    Signale.info(`[${mod.name}] starting`);
    mod.requirements();
    Signale.info(`[${mod.name}] requirements ok`);
    await mod.start();
};

main()
    .catch((e: Error): void => {
        Signale.fatal(`Module ${module_path} crashed`);
        Signale.fatal(e.message);
        console.error(e);
        process.exit(1);
    })
    .then((): void => {
        Signale.info(`Module ${module_path} finished executing`);
        process.exit(0);
    });
