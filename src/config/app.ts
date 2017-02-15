'use strict';

import chalk = require('chalk');
import config = require('./config');
import * as mongooseLib from './lib/mongoose.lib';
import * as expressLib from './lib/express.lib';
import {Application} from 'express';

class Server {

  public app: Application;

  /**
   * Bootstrap the application.
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Constructor.
   */
  constructor() {
    let this_ = this;
    // initialize Mongoose Models
    mongooseLib.loadModels();
    // connect to mongoDB
    mongooseLib.connect( db => {
      // initialize express application
      this_.app = expressLib.init(db);

      this_.app.listen(this_.normalizePort(config.port), config.host, () => {
        let serverAddress = 'http://' + config.host + ':' + config.port;
        console.log('--');
        console.log(chalk.green('CnnVis Start'));
        console.log();
        console.log(chalk.green('Environment:     ' + process.env.NODE_ENV));
        console.log(chalk.green('Server:          ' + serverAddress));
      });
    });
  }

  private normalizePort(val) {
    let port = parseInt(val, 10);
    if (isNaN(port)) {
      // named pipe
      return val;
    }
    if (port >= 0) {
      // port number
      return port;
    }
    return false;
  }

}

export default Server;

