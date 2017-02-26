'use strict';

import { Schema, Model, model, modelNames } from 'mongoose';
import { Response } from 'express';
import * as chalk from 'chalk';
import * as _ from 'lodash';
import * as utils from '../lib/utils.server';
import { bson } from '../lib/bson.server';

// begin of interface definition
interface IOption extends application.IHTTPOptionConfig { };

interface IModel extends Model<any> {
  respond?: (option: IOption, res: Response) => void;
  respondStream?: (option: IOption, res: Response) => void;
};
// end of interface definition

let schema = new Schema({
  iter: { type: Number, required: true },
  lid: { type: Number, required: true },
  name: { type: String, required: true },
  value: { type: [Number], required: true }
});

export function respondStream(options: IOption, res: Response) {
  // basic config
  let colName = options.db + '_' + utils.tables.kernel.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('stream fetching ' + colName));
  console.time('data get ready');

  let cond = {};
  if (options.range) {
    cond['$and'] = [{ iter: { $gte: options.range.start } }, { iter: { $lte: options.range.end } }];
  }
  if (!_.isEmpty(options.layer)) {
    cond['lid'] = { $in: options.layer };
  }

  let project: any = { _id: 0 };

  let cursor = col.find(cond, project)
    .lean()
    .sort({ iter: 1 })
    .batchSize(50)
    .cursor();

  if (options.parser === 'json') {
    res.type('json');
    cursor
      .pipe(utils.KernelStreamTransformer(options))
      .pipe(utils.ArrayStreamTransformer({ batchSize: 1 }))
      .pipe(res);
  } else if (options.parser === 'bson') {
    res.type('arraybuffer');
    cursor
      .pipe(utils.KernelStreamTransformer(options))
      .pipe(res);
  }
};

export function respond(options: IOption, res: Response) {
  // basic config
  let colName = options.db + '_' + utils.tables.kernel.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('normal fetching ' + colName));
  console.time(colName);

  let [cond, project, sort] = getConfig(options);

  col.find(cond, project)
    .lean()
    .sort(sort)
    .exec((err, data: any[]) => {
      if (err) { return console.log(chalk.bgRed(err)); }
      data = postProcess(data, options);
      console.timeEnd(colName);
      if (options.parser === 'json') {
        res.json(data);
      } else if (options.parser === 'bson') {
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

function getConfig(options: IOption) {
  let cond, project, sort;

  if (_.startsWith(options.type, 'i_')) {
    cond = { iter: options.iter };
    // if (_.startsWith(options.db, 'imagenet')) { cond = { lid: { $nin: [1, 267] } }; }
    project = { _id: 0 };
    sort = { lid: 1 };
  } else {
    // default
    cond = {};
    sort = { iter: 1 };
    project = { _id: 0 };

    if (options.range) {
      cond['$and'] = [{ iter: { $gte: options.range.start } }, { iter: { $lte: options.range.end } }];
    }
    if (!_.isEmpty(options.layer)) {
      cond['lid'] = { $in: options.layer };
    }
  }

  return [cond, project, sort];
}

function postProcess(data: any[], options: IOption): any[] {
  if (_.startsWith(options.type, 'i_')) {
    let tmp = [];
    for (let layer of data) {
      _.each(layer.value, (v, k) => {
        tmp.push({ lid: layer.lid, idx: k, name: layer.name, value: v });
      });
    }
    tmp = _.sortBy(tmp, ['value']);
    if (options.type !== 'i_cosine') { tmp = _.reverse(tmp); }

    let m = new Map();
    let r = [];
    let idx = 0;
    for (let i = 0; i < 20; i += 1) {
      if (!m.has(tmp[i].name)) {
        m.set(tmp[i].name, idx++);
        r.push([tmp[i].name, 0, 0]);
      }
      r[m.get(tmp[i].name)][1] += 1;
      r[m.get(tmp[i].name)][2] += tmp[i].value;
    }
    tmp = _.sortBy(r, d => d[1]);
    return _.reverse(tmp);
  } else {
    let m = new Map();
    let r = [];
    _.each(data, d => {
      if (m.has(d.lid)) {
        r[m.get(d.lid)].values.push(d.value);
        r[m.get(d.lid)].domain.push(d.iter);
      } else {
        r.push({ key: +d.lid, name: d.name, domain: [d.iter], values: [d.value] });
        m.set(d.lid, r.length - 1);
      }
    });
    r = _.sortBy(r, ['key']);
    return r;
  }
  // switch (options.type) {
  //   case 'xx':
  //     return;
  //   default:
  //     break;
  // }
};

function getModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
    model(collectionName, schema, collectionName);
  }
  return model(collectionName);
};
