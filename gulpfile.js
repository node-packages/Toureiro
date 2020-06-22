const browserify = require('browserify');
const gulp = require('gulp');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const cssmin = require('gulp-cssmin');
const less = require('gulp-less');
const livereload = require('gulp-livereload');
const notify = require('gulp-notify');
const shell = require('gulp-shell');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');
const watchify = require('watchify');

const runLess = () => gulp
  .src('./views/css/toureiro.less')
  .pipe(less())
  .pipe(gulp.dest('./public/dev/css'))
  .pipe(livereload());

const runLessMin = () => gulp
  .src('./views/css/toureiro.less')
  .pipe(less())
  .pipe(cssmin())
  .pipe(gulp.dest('./public/css'));

gulp.task('less', gulp.series(runLess));
gulp.task('lessMin', gulp.series(runLessMin));

gulp.task('buildDevBundle', gulp.series(() => {
  const bundler = browserify({
    entries: './views/jsx/index.jsx',
    debug: true,
    fullPaths:true,
    transform: babelify.configure({
      presets: ["@babel/preset-env", "@babel/preset-react"]
    }),
  });
  return bundler.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify().on('error', gutil.log))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./public/js/'));
}));

gulp.task('buildProdBundle', gulp.series(() => {
  const bundler = browserify({
    entries: './views/jsx/index.jsx',
    transform: babelify.configure({
      presets: ["@babel/preset-env", "@babel/preset-react"]
    }),
  });
  return bundler.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(uglify().on('error', gutil.log))
    .pipe(gulp.dest('./public/js/'));
}));

function watchBundle () {
  const watcher = watchify(browserify({
    entries: './views/jsx/index.jsx',
    debug: true,
    transform: babelify.configure({
      presets: ["@babel/preset-env", "@babel/preset-react"]
    }),
    cache: {},
    packageCache: {},
    fullPaths: true
  }));
  watcher.on('update', () => {
    bundle(watcher);
  });
  watcher.on('log', gutil.log);
  bundle(watcher);
}

function bundle (bundler) {
  const start = Date.now();
  console.log('Bundling...');
  bundler
    .bundle()
    .on('error', gutil.log)
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./public/dev/js/'))
    .pipe(livereload())
    .pipe(notify(() => {
      console.log('Bundled! Process took', (Date.now() - start) + 'ms');
    }));
}

gulp.task('watchBundle', gulp.series(watchBundle));
gulp.task('watchLess', gulp.series(() => {
  runLess();
  gulp.watch('./views/css/**/*.less', gulp.series('less'));
}));

gulp.task('watch', gulp.parallel('watchBundle', 'watchLess'));

gulp.task('livereload', gulp.series(() => {
  livereload.listen();
}));

gulp.task('server', gulp.series(shell.task([
  'nodemon -w ./lib ./server.js'
])));

gulp.task('dev', gulp.parallel(
  'livereload',
  'watch',
  'server'
));

gulp.task('build-prod', gulp.parallel('buildProdBundle', 'lessMin'));
gulp.task('build-dev', gulp.parallel('buildDevBundle', 'lessMin'));
