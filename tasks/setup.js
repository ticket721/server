const signale = require('signale');
const {postgres_development} = require('./postgres/development');
const {from_current} = require('./misc');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsConfig = require(from_current('./tsconfig.json'));

module.exports.tsc_hooks = async function tsc_hooks() {
    const save_dir  = process.cwd();
    process.chdir(from_current('.'));
    signale.info('Transpiling hooks');
    return gulp.src([
        from_current('./hooks_sources') + '/**/*.ts',
        '!' + from_current('./hooks_sources') + '/**/*.test.ts'])
        .pipe(ts(tsConfig.compilerOptions))
        .pipe(gulp.dest(from_current('./hooks')))
        .on('end', () => {process.chdir(save_dir)})
};

module.exports.postgres = async function postgres() {
    switch (process.env.T721_SERVER) {
        case 'development':
            return postgres_development();
    }
};
