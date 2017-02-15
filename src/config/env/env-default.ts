'use strict';

import path = require('path');

export let assets: mean.IAssets = {
  client: {
    lib: {
      css: [
        // bower:css
        'public/lib/nvd3/build/nv.d3.css',
        'public/lib/angular-motion/dist/angular-motion.css',
        // endbower
        'public/lib/bootstrap/dist/css/bootstrap.css',
        'public/lib/font-awesome/css/font-awesome.css',
        'public/assets/html-theme/css/fonts.googleapis.com.css',
        'public/assets/html-theme/css/theme.css',
        'public/assets/html-theme/css/theme-skins.css',
        'public/assets/html-theme/css/theme-rtl.css',
        'public/lib-my/icomoon/style.css'
      ],
      js: [
        // 'public/lib-my/d3/d3.js',
        'public/lib-my/d3/d4.js',
        'public/lib-my/bson/bson.js',
        // bower:js
        'public/lib/jquery/dist/jquery.js',
        'public/lib/bootstrap/dist/js/bootstrap.js',
        'public/lib/lodash/lodash.js',
        'public/lib/d3/d3.js',
        'public/lib/nvd3/build/nv.d3.js',
        'public/lib/angular/angular.js',
        'public/lib/angular-animate/angular-animate.js',
        'public/lib/angular-resource/angular-resource.js',
        'public/lib/angular-ui-router/release/angular-ui-router.js',
        'public/lib/angular-strap/dist/angular-strap.js',
        'public/lib/angular-strap/dist/angular-strap.tpl.js',
        'public/lib/angular-sanitize/angular-sanitize.js',
        'public/lib/angular-nvd3/dist/angular-nvd3.js',
        // endbower
        'public/assets/html-theme/js/theme-extra.js',
        'public/assets/html-theme/js/theme-elements.js',
        'public/assets/html-theme/js/theme.js'
      ]
    },
    css: ['src/client/*/**/*.css'],
    less: ['src/client/*/**/*.less'],
    sass: ['src/client/*/**/*.scss'],
    views: ['src/client/*/**/*.html'],
    resource: ['src/client/**/resource/**/*'],
    template: 'public/dist/templates.js',
    js: [
      'build/client/core/app/config.js',
      'build/client/core/app/init.js',
      'build/client/*/*.js',
      'build/client/*/*/**/*.js'
    ],
  },
  server: {
    gulpConfig: 'gulpfile.js',
    allJS: ['server.js', 'build/config/**/*.js', 'build/server/**/*.js'],
    routes: ['build/server/routes/**/!(core)*.js', 'build/server/routes/core*.js'],
    models: ['build/server/models/**/*.js'],
    views: ['src/server/views/*.html']
  }
};

export let env: mean.IEnv = {
  app: {
    title: 'CNN Visualization - Dev',
    description: 'Convolutional Neural Network Visualization - Typescript MEAN Project',
    keywords: 'typescript, mean, convolutional neural network, visualization',
    authors: ['Dongyu Liu']
  },
  livereload: true,
  db: {
    uri: 'mongodb://msraiv:5000/cifar-resnet164',
    // uri: 'mongodb://msraiv:5000/imagenet',
    // uri: 'mongodb://localhost:27017/final',
    // uri: 'mongodb://localhost:27017/valid',
    options: {
      user: '',
      pass: ''
    },
    debug: process.env.MONGODB_DEBUG || false
  },
  projectDir: process.cwd(),
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  templateEngine: 'swig',
  favicon: 'public/assets/images/favicon.ico',
  meanjs: path.resolve('./package.json'),
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'dev',
    fileLogger: {
      directoryPath: process.cwd(),
      fileName: 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    },
    options: {}
  },
};
