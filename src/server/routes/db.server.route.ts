'use strict';
import {Application} from 'express';
import * as db from '../controllers/db.server.controller';

export = function (app: Application) {
  // basic info for layer structure or db
  app.route('/api/info')
    .get(db.queryInfo)
    .post(db.queryInfo);

  // model record information route
  app.route('/api/record')
    .get(db.queryRecord)
    .post(db.queryRecord);

  // kernel related seq
  app.route('/api/kernel')
    .get(db.queryKernel)
    .post(db.queryKernel);

  // layer related stat & seq
  app.route('/api/layer')
    .post(db.queryLayer)
    .get(db.queryLayer);

  // test & train img
  app.route('/api/img')
    .get(db.queryImg)
    .post(db.queryImg);

  // return data by stream form
  app.route('/api/stream/:api')
    .get(db.stream)
    .post(db.stream);
};


