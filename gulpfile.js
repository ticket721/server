const {series} =                            require('gulp');
const {requirements, portalize_requirements, setup_requirements} = require('./tasks/requirements');
const {postgres, tsc_hooks} = require('./tasks/setup');
const {config} = require('./tasks/config');
const {postgres_clean, remove_hooks} = require('./tasks/clean');
const {start} = require('./tasks/start');

exports['server:setup'] = series(requirements, portalize_requirements, postgres, config, tsc_hooks);
exports['server:clean'] = series(requirements, postgres_clean, remove_hooks);
exports['server:start'] = series(requirements, setup_requirements, start);

