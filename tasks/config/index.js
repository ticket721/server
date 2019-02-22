const {series} = require('gulp');
const {environments_development_database} = require('./environments/development/database');

module.exports.config = series(environments_development_database);


