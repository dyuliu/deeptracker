'use strict';

//******************************************************************************
//* IMPORT PACKAGES
//******************************************************************************
let _ = require('lodash'),
  fs = require('fs'),
  gulp = require('gulp'),
  plugins = require('gulp-load-plugins')({
    rename: {
      'gulp-angular-templatecache': 'templateCache'
    }
  }),
  tsc = require('gulp-typescript'),
  sourcemaps = require('gulp-sourcemaps'),
  runSequence = require('run-sequence'),
  path = require('path'),
  wiredep = require('wiredep').stream,
  endOfLine = require('os').EOL;

//******************************************************************************
//* NODE ENVIRONMENT SETTING
//******************************************************************************
gulp.task('env:test', () => {
  process.env.NODE_ENV = 'test';
});

gulp.task('env:dev', () => {
  process.env.NODE_ENV = 'development';
});

gulp.task('env:prod', () => {
  process.env.NODE_ENV = 'production';
});

//******************************************************************************
//* LINT TASKS
//******************************************************************************
gulp.task('csslint', ['less'], () =>
  gulp.src('src/client/**/*.css')
  .pipe(plugins.csslint('.csslintrc'))
  .pipe(plugins.csslint.formatter())
);

gulp.task('tslint', () =>
  gulp.src('src/**/*.ts')
  .pipe(plugins.tslint({
    formatter: 'verbose'
  }))
  .pipe(plugins.tslint.report())
);

gulp.task('lint', ['csslint', 'tslint']);

//******************************************************************************
//* PRODUCTION MODE TASKS
//******************************************************************************
// Js minifying
gulp.task('uglify', () => {
  let conf = require('./build/config/env/env-default').assets;
  let assets = _.concat(conf.client.js, conf.client.template);
  return gulp.src(assets)
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify({
      mangle: false
    }))
    .pipe(plugins.concat('application.min.js'))
    .pipe(gulp.dest('public/dist'));
});

// Css minifying
gulp.task('cssmin', () => {
  let conf = require('./build/config/env/env-default').assets;
  let assets = conf.client.css;
  gulp.src(assets)
    .pipe(plugins.cssmin())
    .pipe(plugins.concat('application.min.css'))
    .pipe(gulp.dest('public/dist'))
});

// Angular template cache task - turn all .html into one .js file
gulp.task('templatecache', () => {
  let conf = require('./build/config/env/env-default').assets;
  let assets = conf.client.views;
  let re = new RegExp('\\' + path.sep + 'client\\' + path.sep, 'g');
  return gulp.src(assets)
    .pipe(plugins.templateCache('templates.js', {
      root: 'modules/',
      module: 'core',
      templateHeader: '(function () {' + endOfLine + '	\'use strict\';' +
        endOfLine + endOfLine + '	angular' + endOfLine +
        '		.module(\'<%= module %>\'<%= standalone %>)' + endOfLine +
        '		.run(templates);' + endOfLine + endOfLine +
        '	templates.$inject = [\'$templateCache\'];' + endOfLine +
        endOfLine + '	function templates($templateCache) {' + endOfLine,
      templateBody: '		$templateCache.put(\'<%= url %>\', \'<%= contents %>\');',
      templateFooter: '	}' + endOfLine + '})();' + endOfLine,
      transformUrl: (url) => url
    }))
    .pipe(gulp.dest('public/dist'));
});

//******************************************************************************
//* BASIC UTILS
//******************************************************************************

// wiredep task to default
gulp.task('wiredep', () => {
  return gulp.src('./src/config/env/env-default.ts')
    .pipe(wiredep({
      ignorePath: '../../../',
      fileTypes: {
        ts: {
          block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
          detect: {
            js: /['"]([^'"]+\.js)['"],?/gi,
            css: /['"]([^'"]+\.js)['"],?/gi
          },
          replace: {
            js: "'{{filePath}}',",
            css: "'{{filePath}}',"
          }
        }
      }
    }))
    .pipe(gulp.dest('./src/config/env/'));
});

gulp.task('wiredep:prod', () => {
  return gulp.src('./src/config/env/env-production.ts')
    .pipe(wiredep({
      ignorePath: '../../../',
      fileTypes: {
        ts: {
          block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
          detect: {
            js: /['"]([^'"]+\.js)['"],?/gi,
            css: /['"]([^'"]+\.js)['"],?/gi
          },
          replace: {
            js: (filePath) => {
              let minFilePath = filePath.replace('.js', '.min.js');
              let fullPath = path.join(process.cwd(), minFilePath);
              if (!fs.existsSync(fullPath)) {
                return '\'' + filePath + '\',';
              } else {
                return '\'' + minFilePath + '\',';
              }
            },
            css: (filePath) => {
              let minFilePath = filePath.replace('.css', '.min.css');
              let fullPath = path.join(process.cwd(), minFilePath);
              if (!fs.existsSync(fullPath)) {
                return '\'' + filePath + '\',';
              } else {
                return '\'' + minFilePath + '\',';
              }
            }
          }
        }
      }
    }))
    .pipe(gulp.dest('./src/config/env/'));
});

// Clean built files and folders
gulp.task('clean', () =>
  gulp.src([
    'build/',
    'public/dist/'
  ], { read: false })
  .pipe(plugins.clean())
);

//  Copy static resource
// gulp.task('copyresource', () =>
//   gulp.src(['xxx.ext'])
//     .pipe(gulp.dest('./build/modules/'))
// );

// Compile Less to Css
gulp.task('less', () =>
  gulp.src('src/client/**/*.less')
  .pipe(plugins.less())
  .pipe(plugins.autoprefixer())
  .pipe(gulp.dest('./src/client/'))
);

// restart node when server files change
gulp.task('nodemon', () => {
  let conf = require('./build/config/env/env-default').assets;
  plugins.nodemon({
    script: 'server.js',
    ext: 'js,html',
    args: [],
    nodeArgs: ['--max_old_space_size=65536'],
    watch: _.concat(conf.server.views, conf.server.allJS)
  })
});

// Livereload
gulp.task('reload', () => {
  gulp.src('')
    .pipe(plugins.livereload());
});

// Watch Files For Changes
gulp.task('watch', () => {
  let conf = require('./build/config/env/env-default').assets;

  // Start livereload
  plugins.livereload.listen();

  // client views
  if (process.env.NODE_ENV === 'production') {
    gulp.watch(conf.client.views, ['templatecache'])
      .on('change', plugins.livereload.changed);
  } else {
    gulp.watch(conf.client.views).on('change', plugins.livereload.changed);
  }

  gulp.watch(conf.client.css, ['csslint']).on('change', plugins.livereload.changed);
  gulp.watch(conf.client.less, ['less', 'csslint']).on('change', plugins.livereload.changed);

  // all ts files
  gulp.watch('src/**/*.ts').on('change', (files) => {
    runSequence('tslint', 'build', 'reload');
  });


});

// Compiling ts files
let tsProject = tsc.createProject('tsconfig.json');
gulp.task('build', () =>
  gulp.src('src/**/*.ts')
  .pipe(sourcemaps.init())
  .pipe(tsProject())
  .js
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./build'))
);

//******************************************************************************
//* Running Commands
//******************************************************************************

// gulp
gulp.task('default', (done) => {
  runSequence(['env:dev', 'clean', 'wiredep'], 'lint', 'build',
    ['nodemon', 'watch'], done);
});

// gulp prod
gulp.task('prod', (done) => {
  runSequence(['env:prod', 'clean', 'wiredep:prod'], 'lint', 'build',
    ['templatecache', 'cssmin', 'uglify'], 'nodemon', done);
});