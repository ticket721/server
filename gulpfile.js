const {series} =                            require('gulp');
const {requirements, portalize_requirements, setup_requirements} = require('./tasks/requirements');
const {setup, tsc_hooks} = require('./tasks/setup');
const {config} = require('./tasks/config');
const {clean, remove_hooks} = require('./tasks/clean');
const {start} = require('./tasks/start');

exports['server:setup'] = series(requirements, portalize_requirements, setup, config, tsc_hooks);
exports['server:clean'] = series(requirements, clean, remove_hooks);
exports['server:start'] = series(requirements, setup_requirements, start);

