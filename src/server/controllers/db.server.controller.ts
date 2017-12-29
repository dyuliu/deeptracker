'use strict';

import {model, modelNames} from 'mongoose';
import {isEmpty}  from 'lodash';
import * as chalk from 'chalk';
import * as layer from '../models/layer.server.model';
import * as img from '../models/img.server.model';
import * as kernel from '../models/kernel.server.model';
import * as info from '../models/info.server.model';
import * as record from '../models/record.server.model';


export function queryKernel(req, res, ...rest) {
  let options = isEmpty(req.body) ? req.query : req.body;
  if (rest[0] !== 'stream') {
    kernel.respond(options, res);
  } else {
    kernel.respondStream(options, res);
  };
}

export function queryLayer(req, res, ...rest) {
  let options = isEmpty(req.body) ? req.query : req.body;
  if (rest[0] !== 'stream') {
    layer.respond(options, res);
  } else {
    layer.respondStream(options, res);
  };
}

export function queryImg(req, res, ...rest) {
  let options = isEmpty(req.body) ? req.query : req.body;
  if (rest[0] !== 'stream') {
    img.respond(options, res);
  } else {
    img.respondStream(options, res);
  };
}

export function queryInfo(req, res) {
  let options = isEmpty(req.body) ? req.query : req.body;
  info.respond(options, res);
}

export function queryRecord(req, res) {
  let options = isEmpty(req.body) ? req.query : req.body;
  record.respond(options, res);
}

export function stream(req, res) {
  // console.log(req.protocol + '://' + req.get('host') + req.originalUrl);
  // console.log(req.params.db, req.params.attr);
  // console.log(req.query.db, req.query.attr);
  // console.log(req.body.db, req.body.attr);
  switch (req.params.api) {
    case 'kernel':
      queryKernel(req, res, 'stream');
      break;
    case 'layer':
      queryLayer(req, res, 'stream');
      break;
    case 'img':
      queryImg(req, res, 'stream');
      break;
    default:
      console.log(chalk.bgRed('stream api type error'));
  }
}
