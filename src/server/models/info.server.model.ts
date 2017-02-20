'use strict';

import {Schema, Model, model, modelNames} from 'mongoose';
import {Response} from 'express';
import * as chalk from 'chalk';
import * as _ from 'lodash';

// begin of interface definition
interface IOption extends application.IHTTPOptionConfig {};

interface IModel extends Model<any> {
  respond?: (option: IOption, res: Response) => void;
  respondStream?: (option: IOption, res: Response) => void;
};
// end of interface definition

let layerInfoSchema = new Schema({
  name: {type: String, required: true},
  type: {type: String, required: true},
  lid: {type: Number, required: true},
  channels: {type: Number, required: true},
  KernelNum: {type: Number, required: true},
  KernelWidth: {type: Number, required: true},
  KernelHeight: {type: Number, required: true}
});

let dbInfoSchema = new Schema({
  name: {type: String, required: true},
  number: {type: Number, required: true}
});

export function respond(options: IOption, res) {
  let col;
  switch (options.type) {
    case 'layer':
      getLayerInfo(options, res);
      break;
    case 'db':
      getDBInfo(options, res);
      break;
    default:
      console.log(chalk.bgRed('wrong type'));
  }
}

function getLayerInfo(options: IOption, res: Response) {
  console.log(chalk.green('normal fetching ' + options.db + '_LayerInfo'));
  let col: IModel = getLayerModel(options.db + '_LayerInfo');
  let cond: any = {type: {$in: ['conv', 'inner_product']}};
  let proj: any = {_id: 0};
  col.find(cond, proj)
    .lean()
    .sort({lid : 1})
    .exec((err, data) => {
      if (err) { return console.log(chalk.bgRed(err)); }
      res.json(data);
    });
}

function getDBInfo(options: IOption, res: Response) {
  console.log(chalk.green('normal fetching info of db'));
  let col: IModel = model('DBInfo');
  let cond: any = {};
  let proj: any = {_id: 0};
  col.find(cond, proj)
    .lean()
    .exec((err, data) => {
      if (err) { return console.log(chalk.bgRed(err)); }
      res.json(data);
    });
}

function getLayerModel(collectionName: string): IModel {
  if (modelNames().indexOf(collectionName) === -1) {
    model(collectionName, layerInfoSchema, collectionName);
  }
  return model(collectionName);
};

model('DBInfo', dbInfoSchema, 'DBInfo');
