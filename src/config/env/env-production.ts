'use strict';

export let assets: mean.IAssets = {
  client: {
    lib: {
      css: [
        'public/lib/bootstrap/dist/css/bootstrap.min.css',
        'public/lib/font-awesome/css/font-awesome.min.css',
        'public/assets/html-theme/css/fonts.googleapis.com.css',
        'public/assets/html-theme/css/theme.min.css',
        'public/assets/html-theme/css/theme-skins.min.css',
        'public/assets/html-theme/css/theme-rtl.min.css',
        'public/lib-my/icomoon/style.css',
        // bower:css
        'public/lib/nvd3/build/nv.d3.min.css',
        'public/lib/angular-motion/dist/angular-motion.min.css',
        // endbower
      ],
      js: [
        'public/lib-my/d3/d3.min.js',
        'public/lib-my/d3/d4.min.js',
        'public/lib-my/bson/bson.min.js',
        // bower:js
        'public/lib/jquery/dist/jquery.min.js',
        'public/lib/bootstrap/dist/js/bootstrap.min.js',
        'public/lib/d3/d3.min.js',
        'public/lib/lodash/lodash.js',
        'public/lib/nvd3/build/nv.d3.min.js',
        'public/lib/angular/angular.min.js',
        'public/lib/angular-animate/angular-animate.min.js',
        'public/lib/angular-resource/angular-resource.min.js',
        'public/lib/angular-ui-router/release/angular-ui-router.min.js',
        'public/lib/angular-strap/dist/angular-strap.min.js',
        'public/lib/angular-strap/dist/angular-strap.tpl.min.js',
        'public/lib/angular-sanitize/angular-sanitize.min.js',
        'public/lib/angular-nvd3/dist/angular-nvd3.min.js'，
        // endbower
        'public/assets/html-theme/js/theme-extra.min.js',
        'public/assets/html-theme/js/theme-elements.min.js',
        'public/assets/html-theme/js/theme.min.js'
      ]
    },
    css: ['public/dist/application.min.css'],
    js: ['public/dist/application.min.js']
  }
};

export let env: mean.IEnv = {
  app: {
    title: 'CNN Visualization'
  },
  port: process.env.PORT || 8443,
  livereload: false,
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: process.env.LOG_FORMAT || 'combined',
    options: {
      // Stream defaults to process.stdout
      // Uncomment/comment to toggle the logging to a log on the file system
      stream: {
        directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
        fileName: process.env.LOG_FILE || 'access.log',
        rotatingLogs: { // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
          active: process.env.LOG_ROTATING_ACTIVE === 'true' ? true : false, // activate to use rotating logs
          fileName: process.env.LOG_ROTATING_FILE || 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
          frequency: process.env.LOG_ROTATING_FREQUENCY || 'daily',
          verbose: process.env.LOG_ROTATING_VERBOSE === 'true' ? true : false
        }
      }
    }
  },
};
