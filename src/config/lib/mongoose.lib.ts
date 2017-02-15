'use strict';

import chalk = require('chalk');
import config = require('../config');
import path = require('path');
import mongoose = require('mongoose');

export function loadModels(callback?) {
  config.files.server.models.forEach(function (modelPath) {
    require(path.resolve(modelPath));
  });

  if (callback) { callback(); }
}

// Initialize Mongoose
export function connect(callback?) {
  // plug in our own promise library
  mongoose.Promise = global.Promise;

  let db = mongoose.connect(config.db.uri, config.db.options, function (err) {
    // Log Error
    if (err) {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    } else {

      // Enabling mongoose debug mode if required
      mongoose.set('debug', config.db.debug);

      // Call callback FN
      if (callback) {callback(db); }
    }
  });
};

export function disconnect(callback?) {
  mongoose.disconnect(function (err) {
    console.log(chalk.yellow('Disconnected from MongoDB.'));
    callback(err);
  });
};
