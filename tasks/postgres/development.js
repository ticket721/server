const dockerode = require('dockerode');
const signale = require('signale');
const {Portalize} = require('portalize');
const {from_current} = require('../misc');

const Docker = new dockerode();

const DOCKER_IMAGE_NAME = 'postgres';
const PORT = '5432';
const HOST_PORT = '5432';
const DB_NAME = 't721';
const USER = 'admin';
const PASS = 'pass';
const CONTAINER_NAME = 't721-postgres';

async function pull_postgres() {
    signale.info(`Pulling ${DOCKER_IMAGE_NAME}`);
    await Docker.pull(DOCKER_IMAGE_NAME);
    signale.success(`Pulled ${DOCKER_IMAGE_NAME}`);
}

async function run_postgres() {
    signale.info(`docker: Creating container ${DOCKER_IMAGE_NAME} (${CONTAINER_NAME})`);
    const container = await Docker.createContainer({
            Image: DOCKER_IMAGE_NAME,
            ExposedPorts: {
                [PORT]: {}
            },
            Env: [
                `POSTGRES_USER=${USER}`,
                `POSTGRES_PASSWORD=${PASS}`,
                `POSTGRES_DB=${DB_NAME}`
            ],
            HostConfig: {
                AutoRemove: true,
                PortBindings: {
                    [PORT]: [
                        {
                            HostPort: HOST_PORT
                        }
                    ]
                },
            },
            name: CONTAINER_NAME
        }
    );
    await container.start();
    signale.success(`docker: Created container ${DOCKER_IMAGE_NAME} (${CONTAINER_NAME})`);
}

async function write_config() {

    signale.info(`docker: writing portalize infos`);
    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('server');

    const postgres_configuration = {
        host: '127.0.0.1',
        port: HOST_PORT,
        user: USER,
        pass: PASS,
        db: DB_NAME
    };

    Portalize.get.add('postgres.json', postgres_configuration, {
        desc: 'postgres ready'
    });

    signale.info(`docker: written portalize infos`);

}

module.exports.postgres_development = async function postgres_development() {
    await pull_postgres();
    await run_postgres();
    await write_config();
};

async function clean_postgres() {
    signale.info(`docker: removing container ${CONTAINER_NAME}`);
    const container = await Docker.getContainer(CONTAINER_NAME);
    await container.kill();
    signale.success(`docker: removed container ${CONTAINER_NAME}`);
}

async function clean_portalize() {
    signale.info(`docker: removing portalize infos`);
    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('server');
    Portalize.get.clean();
    signale.success(`docker: removed portalize infos`);
}

module.exports.postgres_development_clean = async function postgres_development_clean() {
    await clean_postgres();
    await clean_portalize();
};
