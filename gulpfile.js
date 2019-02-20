const {series} =                            require('gulp');
const {requirements, portalize_requirements} = require('./tasks/requirements');
const {postgres} = require('./tasks/setup');
const {postgres_clean} = require('./tasks/clean');

exports['server:setup'] = series(requirements, portalize_requirements, postgres);
exports['server:clean'] = series(requirements, postgres_clean);

