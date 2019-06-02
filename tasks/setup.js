const signale = require('signale');
const {postgres_development} = require('./postgres/development');
const {eth_node_development} = require('./eth_node/development');
const {from_current} = require('./misc');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsConfig = require('../tsconfig.json');
const tsc_config_modules = require('../modules_sources/tsconfig.json');

module.exports.tsc_hooks = async function tsc_hooks() {
    signale.info('Transpiling hooks');
    return new Promise((ok, ko) => {
        gulp.src([
            from_current('./hooks_sources') + '/**/*.ts',
            '!' + from_current('./hooks_sources') + '/**/*.test.ts'
        ])
            .pipe(ts(tsConfig.compilerOptions))
            .pipe(gulp.dest(from_current('./hooks')))
            .on('end', () => {signale.success('Transpiled hooks'); ok()})
    });
};

module.exports.tsc_modules = async function tsc_modules() {
    signale.info('Transpiling modules');
    return new Promise((ok, ko) => {
        gulp.src([
            from_current('./modules_sources') + '/**/*.ts',
            '!' + from_current('./modules_sources') + '/**/*.test.ts',
            '!' + from_current('./modules_sources/node_modules/**')
        ])
            .pipe(ts(tsc_config_modules.compilerOptions))
            .pipe(gulp.dest(from_current('./modules_sources')))
            .on('end', () => {signale.success('Transpiled modules'); ok()})
    });
};


module.exports.setup = async function setup() {
    switch (process.env.T721_SERVER) {
        case 'development':
            await postgres_development();
            await eth_node_development();
            return ;
    }
};
