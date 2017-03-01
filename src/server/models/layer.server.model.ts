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
  respond?: (option: IOption, res) => void;
  respondStream?: (option: IOption, res) => void;
};
// end of interface definition

let schema = new Schema({
  iter: { type: Number, required: true },
  value: { type: Schema.Types.Mixed, required: true }
});

export function respondStream(options: IOption, res: Response) {
  let colName = options.db + '_' + utils.tables.layer.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('stream fetching ' + colName));
  console.time('data get ready');

  let cond: any = {};
  if (!_.isUndefined(options.range)) {
    cond = { $and: [{ iter: { $gte: options.range.start } }, { iter: { $lte: options.range.end } }] };
  }
  let project: any = { _id: 0, 'iter': 1 };
  if (!_.isEmpty(options.layer)) {
    for (let o of options.layer) {
      let key = 'value.' + o;
      project[key] = 1;
    }
  } else {
    project.value = 1;
  }

  let cursor = col.find(cond, project)
    .lean()
    .sort({ iter: 1 })
    .batchSize(100)
    .cursor();

  if (options.parser === 'json') {
    res.type('json');
    cursor
      .pipe(utils.LayerStreamTransformer(options))
      .pipe(utils.ArrayStreamTransformer({ batchSize: 1 }))
      .pipe(res);
  } else if (options.parser === 'bson') {
    res.type('arraybuffer');
    cursor
      .pipe(utils.LayerStreamTransformer(options))
      .pipe(res);
  }
};

export function respond(options: IOption, res) {
  let colName = options.db + '_' + utils.tables.layer.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('normal fetching ' + colName));

  let cond: any = {};
  if (!_.isUndefined(options.range)) {
    cond = { $and: [{ iter: { $gte: options.range.start } }, { iter: { $lte: options.range.end } }] };
  }
  let project: any = { _id: 0, 'iter': 1 };
  if (!_.isEmpty(options.layer)) {
    for (let o of options.layer) {
      let key = 'value.' + o;
      project[key] = 1;
    }
  } else {
    project.value = 1;
  }

  let cached = false;
  if (options.type === 's_cratio' || options.type === 'hl_s_cratio') {
    let data = options.type === 's_cratio' ? utils.cacheSeqData[options.db] : utils.cacheHLSeqData[options.db];
    if (!_.isUndefined(data)) {
      cached = true;
      data = postProcess(data, options);
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
    }
  };
  if (!cached) {
    col.find(cond, project)
      .lean()
      .sort({ iter: 1 })
      .exec((err, data: any[]) => {
        if (err) { return console.log(chalk.bgRed(err)); }
        if (options.type === 's_cratio') {
          utils.cacheSeqData[options.db] = data;
        } else if (options.type === 'hl_s_cratio') {
          utils.cacheHLSeqData[options.db] = data;
        }
        data = postProcess(data, options);
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

function postProcess(data: any[], options: IOption): any[] {
  let m = new Map();
  let r = [];

  if (options.type === 's_cratio' || options.type === 'hl_s_cratio') {
    _.each(data, d => {
      _.each(d.value, (v, lid) => {
        let fv = [];
        for (let i of options.seqidx) { fv.push(v[i]); }
        if (m.has(lid)) {
          r[m.get(lid)].values.push(fv);
          r[m.get(lid)].domain.push(d.iter);
        } else {
          r.push({ key: lid, domain: [d.iter], values: [fv] });
          m.set(lid, r.length - 1);
        }
      });
    });
    r = _.sortBy(r, ['key']);
  } else {
    r = data;
  }
  return r;
}

function getModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
    model(collectionName, schema, collectionName);
  }
  return model(collectionName);
};

