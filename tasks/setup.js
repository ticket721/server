const signale = require('signale');
const {postgres_development} = require('./postgres/development');
const {from_current} = require('./misc');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsConfig = require(from_current('./tsconfig.json'));

module.exports.tsc_hooks = async function tsc_hooks() {
    signale.info('Transpiling hooks');
    return gulp.src([
        from_current('./hooks_sources') + '/**/*.ts',
        '!' + from_current('./hooks_sources') + '/**/*.test.ts'])
        .pipe(ts(tsConfig.compilerOptions))
        .pipe(gulp.dest(from_current('./hooks')));
};

module.exports.postgres = async function postgres() {
    switch (process.env.T721_SERVER) {
        case 'development':
            return postgres_development();
    }
};
