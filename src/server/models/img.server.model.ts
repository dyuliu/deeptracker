'use strict';

import { Schema, Model, model, modelNames } from 'mongoose';
import { Response } from 'express';
import * as chalk from 'chalk';
import * as _ from 'lodash';
import * as utils from '../lib/utils.server';
import { bson } from '../lib/bson.server';
import { mdsLayout } from '../lib/mds.server';
// begin of interface definition
interface IOption extends application.IHTTPOptionConfig { };

interface IModel extends Model<any> {
  respond?: (option: IOption, res: Response) => void;
  respondStream?: (option: IOption, res: Response) => void;
};
// end of interface definition

let schema = new Schema({
  iter: { type: Number, required: true },
  batch: { type: Number, required: true },
  cls: { type: [String], required: true },
  label: { type: [Number], required: true },
  file: { type: [String], required: true },
  answer: { type: [Number], required: false },   // only for test image
  prob: { type: [[Number]], required: false }    // only for test image
});

export function respondStream(options: IOption, res: Response) {
  // basic config
  let colName = options.db + '_' + utils.tables.img.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('stream fetching ' + colName));

  let [cond, project, sort] = getConfig(options);

  let cursor = col.find(cond, project)
    .lean()
    .sort(sort)
    .batchSize(50)
    .cursor();

  if (options.parser === 'json') {
    res.type('json');
    cursor
      .pipe(utils.ImgStreamTransformer(options))
      .pipe(utils.ArrayStreamTransformer({ batchSize: 50 }))
      .pipe(res);
  } else if (options.parser === 'bson') {
    res.type('arraybuffer');
    cursor
      .pipe(utils.ImgStreamTransformer(options))
      .pipe(res);
  }
};

export function respond(options: IOption, res: Response) {
  let colName = options.db + '_' + utils.tables.img.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('normal fetching ' + colName));
  console.time(colName);
  let [cond, project, sort] = getConfig(options);


  let cached = false;
  if (options.type === 'cls_stat') {
    if (!_.isUndefined(utils.cacheData[options.db])) {
      cached = true;
      let data = utils.cacheData[options.db];
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
    }
  }
  if (!cached) {
    col.find(cond, project)
      .lean()
      .sort(sort)
      .exec((err, data: any[]) => {
        if (err) { return console.log(chalk.bgRed(err)); }
        if (options.type === 'cls_stat') {
          utils.cacheData[options.db] = data;
        }
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
  }
}

function getConfig(options: IOption) {
  let cond, project, sort;
  if (options.type === 'detail') {
    cond = {};
    if (!_.isEmpty(options.cls)) { cond.cls = { $in: options.cls }; }
    project = { _id: 0 };
    sort = { cls: 1 };
  } else if (options.type === 'model_stat') {
    cond = {};
    project = { _id: 0, iter: 1, abLeft: 1 };
    if (_.isEmpty(options.seqidx)) { options.seqidx = [49]; }
    sort = { iter: 1 };
  } else if (options.type === 'cls_stat') {
    cond = {};
    if (!_.isEmpty(options.cls)) { cond.cls = { $in: options.cls }; }
    project = { _id: 0, iter: 1, abLeft: 1, testError: 1, cls: 1 };
    if (_.isEmpty(options.seqidx)) { options.seqidx = [49]; }
    sort = { iter: 1 };
  } else if (options.type === 'testinfo') {
    cond = { $and: [{ iter: { $gte: options.range.start } }, { iter: { $lte: options.range.end } }] };
    project = { _id: 0, prob: 0 };
    sort = { iter: 1 };
  }
  return [cond, project, sort];
}

function postProcess(data: any[], options: IOption): any[] {
  switch (options.type) {
    case 'detail':
      let tmp: any = _.map(data, (d: any) => {
        let correct = _.map(d.answer, o => o === d.label ? 1 : 0);
        return { iter: d.iter, value: correct, key: d.file, cls: d.cls };
      });
      mdsLayout(tmp);
      return tmp;
    case 'model_stat':
      // let first = true;
      // let kconst = 0;
      data = _.map(data, (d: any) => {
        // let tmp = d.iter - kconst;
        // if (tmp > 0 && first && tmp % 1600 !== 0) { console.log(tmp + kconst); first = false; }
        return {
          iter: d.iter,
          value: d.abLeft = d.abLeft[options.seqidx[0]]
        };
      });
      return data;
    case 'cls_stat':
      data = _.map(data, (d: any) => {
        return {
          cls: d.cls,
          iter: d.iter,
          testError: d.testError,
          value: d.abLeft[options.seqidx[0]]
        };
      });
      return data;
    case 'testinfo':
      let m = new Map();
      let r = [];
      _.each(data, d => {
        let size = d.label.length;
        for (let i = 0; i < size; i += 1) {
          if (options.cls && options.cls.indexOf(d.cls[i]) < 0) { continue; }
          let correct = (d.label[i] === d.answer[i]) ? 1 : 0;
          if (m.has(d.file[i])) {
            r[m.get(d.file[i])].values.push(correct);
            r[m.get(d.file[i])].domain.push(d.iter);
          } else {
            r.push({ key: d.file[i], cls: d.cls[i], domain: [d.iter], values: [correct] });
            m.set(d.file[i], r.length - 1);
          }
        }
      });
      r = _.sortBy(r, ['cls']);
      return r;
    default:
      return [];
  };
};

function getModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
    model(collectionName, new Schema({}), collectionName);
  }
  return model(collectionName);
};
