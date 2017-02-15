'use strict';

import {Schema, Model, model, modelNames} from 'mongoose';
import {Response} from 'express';
import * as chalk from 'chalk';
import * as _ from 'lodash';
import * as utils from '../lib/utils.server';
let BSON = require('bson');
let bson = new BSON();

// begin of interface definition
interface IOption extends application.IHTTPOptionConfig {};

interface IModel extends Model<any> {
  respond?: (option: IOption, res: Response) => void;
  respondStream?: (option: IOption, res: Response) => void;
};
// end of interface definition

let schema = new Schema({
  iter: {type: Number, required: true},
  value: {type: Number, required: true}
});

export function respond(options, res) {
  let colName = options.db + '_' + utils.tables.record.get(options.type);
  let col = getModel(colName);
  console.log(chalk.green('normal fetching ' + colName));
  console.time('data get ready');

  let cond: any = {};
  let project: any = {_id: 0};
  col.find(cond, project)
    .lean()
    .sort({iter: 1})
    .exec((err, data: any[]) => {
      if (err) { return console.log(chalk.bgRed(err)); }
      data = postProcess(data, options);
      console.timeEnd('data get ready');
      res.json(data);
    });
}

function postProcess(data: any[], options: IOption): any[] {
  let m = new Map();
  let r = [];
  // to do
  r = _.sortBy(r, ['key']);
  return data;
}

function getModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
    model(collectionName, schema, collectionName);
  }
  return model(collectionName);
};
