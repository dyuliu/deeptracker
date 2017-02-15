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
  lid: {type: Number, required: true},
  name: {type: String, required: true},
  value: {type: [Number], required: true}
});

export function respondStream (options: IOption, res: Response) {
  // basic config
  let colName = options.db + '_' + utils.tables.kernel.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('stream fetching ' + colName));
  console.time('data get ready');

  let cond: any = {$and: [{iter: { $gte: options.range.start }}, {iter: { $lte: options.range.end }}]};
  if (!_.isEmpty(options.layer)) { cond.lid = {$in: options.layer}; }
  let project: any = {_id: 0};

  let cursor = col.find(cond, project)
    .lean()
    .sort({ iter: 1 })
    .batchSize(50)
    .cursor();

  if (options.parser === 'json') {
    res.type('json');
    cursor
      .pipe(utils.KernelStreamTransformer(options))
      .pipe(utils.ArrayStreamTransformer({batchSize: 1}))
      .pipe(res);
  } else if (options.parser === 'bson') {
    res.type('arraybuffer');
    cursor
      .pipe(utils.KernelStreamTransformer(options))
      .pipe(res);
  }
};

export function respond (options: IOption, res: Response) {
  // basic config
  let colName = options.db + '_' + utils.tables.kernel.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('normal fetching ' + colName));
  console.time('data get ready');

  let cond: any = {$and: [{iter: { $gte: options.range.start }}, {iter: { $lte: options.range.end }}]};
  if (!_.isEmpty(options.layer)) { cond.lid = {$in: options.layer}; }
  let project: any = {_id: 0};
  col.find(cond, project)
    .lean()
    .sort({ iter: 1 })
    .exec((err, data: any[]) => {
      if (err) { return console.log(chalk.bgRed(err)); }
      data = postProcess(data);
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
};

function postProcess(data: any[]): any[] {
  let m = new Map();
  let r = [];
  _.each(data, d => {
    if (m.has(d.lid)) {
      r[m.get(d.lid)].values.push(d.value);
      r[m.get(d.lid)].domain.push(d.iter);
    } else {
      r.push({key: +d.lid, name: d.name, domain: [d.iter], values: [d.value]});
      m.set(d.lid, r.length - 1);
    }
  });
  r = _.sortBy(r, ['key']);
  return r;
};

function getModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
      model(collectionName, schema, collectionName);
  }
  return model(collectionName);
};
