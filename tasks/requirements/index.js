const {series} = require('gulp');

const {env} = require('./env');
const {portalize_requirements} = require('./portalize_requirements');

module.exports.requirements = env;
module.exports.portalize_requirements = portalize_requirements;
