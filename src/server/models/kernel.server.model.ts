'use strict';

import { Schema, Model, model, modelNames } from 'mongoose';
import { Response } from 'express';
import * as chalk from 'chalk';
import * as _ from 'lodash';
import * as utils from '../lib/utils.server';
import { bson } from '../lib/bson.server';
import * as numeric from 'numeric';
import * as d3 from 'd3';
import { LG } from '../lib/mds.server';



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
  console.log(cond, project, sort);

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
    cond = {};
    sort = { iter: 1 };
    if (options.iter) { cond.iter = options.iter; sort = { lid: 1 }; }
    if (!_.isEmpty(options.layer)) { cond.lid = options.layer[0]; }
    project = { _id: 0 };
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
  if (_.startsWith(options.type, 'i_') && options.iter) {
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
  } else if (_.startsWith(options.type, 'i_') && options.layer) {  // one layer
    let r = [];
    let size = data[0].value.length;
    for (let i = 0; i < size; i += 1) {
      let tmp = { key: i, iter: [], value: [] };
      for (let d of data) {
        tmp.iter.push(d.iter);
        tmp.value.push(d.value[i]);
      }
      r.push(tmp);
    }
    // mdsLayout(r);
    // console.log('mds calc done!!!!');
    return r;
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
};

function getModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
    model(collectionName, schema, collectionName);
  }
  return model(collectionName);
};

function mdsLayout(data) {
  let distMatrix = [];
  let length = data.length;
  let max = -1;
  for (let i = 0; i < length; i += 1) {
    distMatrix.push(Array(length).fill(0));
    distMatrix[i][i] = 0;
    for (let j = i - 1; j >= 0; j -= 1) { distMatrix[i][j] = distMatrix[j][i]; }
    for (let j = i + 1; j < length; j += 1) {
      distMatrix[i][j] = computeDist2(data[i].value, data[j].value);
      if (distMatrix[i][j] > max) { max = distMatrix[i][j]; }
    }
  }

  let fs = d3.scaleLinear().range([0, 1]).domain([0, max]).clamp(true);
  for (let i = 0; i < length; i += 1) {
    for (let j = 0; j < length; j += 1) {
      distMatrix[i][j] = fs(distMatrix[i][j]);
    }
  }
  console.log('mds calc ing ~~~~');
  let coordinate = _.map(LG.utils.Mds.mds(distMatrix, 1), (d, i) => {
    return [i, d[0]];
  });
  coordinate = _.sortBy(coordinate, d => d[1]);
  for (let i = 0; i < data.length; i += 1) {
    let idx = coordinate[i][0];
    data[idx].index = i;
  }
}

function computeDist(va, vb) {
  let size = va.length;
  let dist = 0;
  for (let i = 0; i < size; i += 1) {
    dist += va[i] !== vb[i] ? 1 : 0;
  }
  return dist;
}

// cos
function computeDist2(va, vb) {
  let nva = numeric.norm2(va);
  let nvb = numeric.norm2(vb);
  if (nva !== 0 && nvb !== 0) {
    return 1 - numeric.dot(va, vb) / (numeric.norm2(va) * numeric.norm2(vb));
  }
  return 1;
}
