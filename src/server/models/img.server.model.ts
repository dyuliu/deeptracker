'use strict';

import {Schema, Model, model, modelNames} from 'mongoose';
import {Response} from 'express';
import * as chalk from 'chalk';
import * as _ from 'lodash';
import * as utils from '../lib/utils.server';
import {bson} from '../lib/bson.server';

// begin of interface definition
interface IOption extends application.IHTTPOptionConfig {};

interface IModel extends Model<any> {
  respond?: (option: IOption, res: Response) => void;
  respondStream?: (option: IOption, res: Response) => void;
};
// end of interface definition

let schema = new Schema({
  iter: {type: Number, required: true},
  batch: {type: Number, required: true},
  cls: {type: [String], required: true},
  label: {type: [Number], required: true},
  file: {type: [String], required: true},
  answer: {type: [Number], required: false},   // only for test image
  prob: {type: [[Number]], required: false}    // only for test image
});

export function respondStream (options: IOption, res: Response) {
  // basic config
  let colName = options.db + '_' + utils.tables.img.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('stream fetching ' + colName));
  console.time('data get ready');

  let cond: any = {$and: [{iter: { $gte: options.range.start }}, {iter: { $lte: options.range.end }}]};
  let project: any = {_id: 0, prob: 0};
  let cursor = col.find(cond, project)
    .lean()
    .sort({ iter: 1 })
    .batchSize(50)
    .cursor();

  if (options.parser === 'json') {
    res.type('json');
    cursor
      .pipe(utils.ImgStreamTransformer(options))
      .pipe(utils.ArrayStreamTransformer({batchSize: 100}))
      .pipe(res);
  } else if (options.parser === 'bson') {
    res.type('arraybuffer');
    cursor
      .pipe(utils.ImgStreamTransformer(options))
      .pipe(res);
  }
};

export function respond (options: IOption, res: Response) {
  if (options.type === 'outlier') {
    // do some
    let colName = options.db + '_' + utils.tables.img.get(options.type);
    let col = getModel(colName);
    console.log(chalk.green('normal fetching ' + colName + ' outlier'));
    let cond: any = {};
    let project: any = {_id: 0};
    col.find(cond, project)
      .lean()
      .sort({ iter: 1 })
      .exec((err, data: any[]) => {
        if (err) { return console.log(chalk.bgRed(err)); }
        res.json(data);
      });
  } else if (options.type === 'event') {
    let colName = options.db + '_' + utils.tables.img.get('testinfo');
    let col = getModel(colName);
    console.log(chalk.green('normal fetching ' + colName + ' event'));
    let cond: any = {};
    let project: any = {_id: 0, iter: 1, event: 1};
    col.find(cond, project)
      .lean()
      .sort({ iter: 1 })
      .exec((err, data: any[]) => {
        if (err) { return console.log(chalk.bgRed(err)); }
        res.json(data);
      });
  } else if (options.type === 'testinfo') {
    let colName = options.db + '_' + utils.tables.img.get(options.type);
    let col = getModel(colName);
    console.log(chalk.green('normal fetching ' + colName));
    console.time('data get ready');
    let cond: any = {$and: [{iter: { $gte: options.range.start }}, {iter: { $lte: options.range.end }}]};
    let project: any = {_id: 0, prob: 0};
    // {_id: 0, iter: 1, cls: 1, file: 1, label: 1, answer: 1}
    col.find(cond, project)
      .lean()
      .sort({ iter: 1 })
      .exec((err, data: any[]) => {
        if (err) { return console.log(chalk.bgRed(err)); }
        data = postProcess(data, options.cls);
        console.timeEnd('data get ready');
        if (options.parser === 'json') {
          res.json(data);
        } else if (options.parser === 'bson') { // stream write
          res.type('arraybuffer');
          for (let d of data) {
            let b = bson.serialize(d);
            let buf = Buffer.alloc(4);
            buf.writeInt32LE(b.byteLength, 0);
            res.write(buf);
            res.write(b);
          }
          res.end(null);
        }
      });
  }
};

function postProcess(data: any[], cls: string[]): any[] {
  let m = new Map();
  let r = [];
  _.each(data, d => {
    let size = d.label.length;
    for (let i = 0; i < size; i += 1) {
      if (cls && cls.indexOf(d.cls[i]) < 0) { continue; }
      let correct = (d.label[i] === d.answer[i]) ? 1 : 0;
      if (m.has(d.file[i])) {
        r[m.get(d.file[i])].values.push(correct);
        r[m.get(d.file[i])].domain.push(d.iter);
      } else {
        r.push({key: d.file[i], cls: d.cls[i], domain: [d.iter], values: [correct]});
        m.set(d.file[i], r.length - 1);
      }
    }
  });
  r = _.sortBy(r, ['cls']);
  return r;
};

function getModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
      model(collectionName, schema, collectionName);
  }
  return model(collectionName);
};
