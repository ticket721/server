const {series} = require('gulp');

const {env} = require('./env');
const {portalize_requirements} = require('./portalize_requirements');
const {setup_requirements} = require('./setup');

module.exports.requirements = env;
module.exports.portalize_requirements = portalize_requirements;
module.exports.setup_requirements = setup_requirements;
