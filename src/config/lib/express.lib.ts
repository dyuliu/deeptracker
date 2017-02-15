'use strict';

/**
 * Module dependencies.
 */

let favicon = require('serve-favicon'),
    compress = require('compression'),
    morgan = require('morgan'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    flash = require('connect-flash'),
    consolidate = require('consolidate');

import path = require('path');
import bodyParser = require('body-parser');
import express = require('express');
import config = require('../config');
import logger = require('./logger.lib');


/**
 * Initialize local variables
 */
function initLocalVariables (app) {
  // Setting application local variables
  app.locals.title = config.app.title;
  app.locals.description = config.app.description;
  app.locals.keywords = config.app.keywords;
  app.locals.autrhos = config.app.authors;
  app.locals.jsFiles = config.files.client.js;
  app.locals.cssFiles = config.files.client.css;
  app.locals.livereload = config.livereload;
  app.locals.favicon = config.favicon.replace('public/', '');

  // Passing the request url to environment locals
  app.use(function (req, res, next) {
    res.locals.host = req.protocol + '://' + req.hostname;
    res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
    next();
  });
};

/**
 * Initialize application middleware
 */
function initMiddleware (app) {

  // Showing stack errors
  app.set('showStackError', true);

  // Enable jsonp
  app.enable('jsonp callback');

  // Should be placed before express.static
  app.use(compress({
    filter: function (req, res) {
      return (/json|text|javascript|css|font|svg|octet/).test(res.getHeader('Content-Type'));
    },
    level: 1
  }));

  // Initialize favicon middleware
  app.use(favicon(config.favicon));

  // Environment dependent middleware
  if (process.env.NODE_ENV === 'development') {
    // Enable logger (morgan)
    app.use(morgan(logger.getLogFormat(), logger.getMorganOptions()));
    // Disable views cache
    app.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    app.locals.cache = 'memory';
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '16384mb'
  }));
  app.use(bodyParser.json({
    limit: '16384mb'
  }));
  app.use(methodOverride());

  // Add the cookie parser and flash middleware
  app.use(cookieParser());
  app.use(flash());
};

/**
 * Configure view engine
 */
function initViewEngine (app) {
  // Set swig as the template engine
  app.engine('server.view.html', consolidate[config.templateEngine]);

  // Set views path and view engine
  app.set('view engine', 'server.view.html');
  app.set('views', path.resolve('./'));
};

/**
 * Configure the modules static routes
 */
function initModulesClientRoutes (app) {
  // Setting the app router and static folder
  app.use('/', express.static(path.resolve('./public')));

  // Globbing static routing
  config.folders.client.forEach(function (staticPath) {
    app.use('/' + staticPath, express.static(path.resolve('./' + staticPath)));
  });
};

/**
 * Configure the modules server routes
 */
function initModulesServerRoutes (app) {
  // Globbing routing files
  config.files.server.routes.forEach(function (routePath) {
    require(path.resolve(routePath))(app);
  });
};

/**
 * Configure error handling
 */
function initErrorRoutes (app) {
  app.use(function (err, req, res, next) {
    // If the error object doesn't exists
    if (!err) {
      return next();
    }

    // Log it
    console.error(err.stack);

    // Redirect to error page
    res.redirect('/server-error');
  });
};

/**
 * Initialize the Express application
 */
export function init (db) {
  // Initialize express app
  let app = express();

  // Initialize local variables
  initLocalVariables(app);

  // Initialize Express middleware
  initMiddleware(app);

  // Initialize Express view engine
  initViewEngine(app);

  // Initialize modules static client routes, before session!
  initModulesClientRoutes(app);

  // Initialize modules server routes
  initModulesServerRoutes(app);

  // Initialize error routes
  initErrorRoutes(app);

  return app;
};
