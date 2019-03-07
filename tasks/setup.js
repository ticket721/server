const signale = require('signale');
const {postgres_development} = require('./postgres/development');
const {eth_node_development} = require('./eth_node/development');
const {from_current} = require('./misc');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsConfig = require(from_current('./tsconfig.json'));

module.exports.tsc_hooks = async function tsc_hooks() {
    const save_dir  = process.cwd();
    process.chdir(from_current('.'));
    signale.info('Transpiling hooks');
    return new Promise((ok, ko) => {
        gulp.src([
            from_current('./hooks_sources') + '/**/*.ts',
            '!' + from_current('./hooks_sources') + '/**/*.test.ts'
        ])
            .pipe(ts(tsConfig.compilerOptions))
            .pipe(gulp.dest(from_current('./hooks')))
            .on('end', () => {process.chdir(save_dir); signale.success('Transpiled hooks'); ok()})
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
