namespace application {
  'use strict';

  export interface ILayerEle {
    iter: number;
    wid: number;
    value: {};
  }

  export interface IRecordEle {
    iter: number;
    value: number;
  }

  export interface IInfoDBEle {
    name: string;            // db name
    number: number;          // number of nodes
  }

  export interface IInfoLayerEle {
    lid: number;            // layer id
    name: string;
    type: string;
    label: string;
    channels: number;
    kernelNum: number;
    kernelWidth: number;
    kernelHeight: number;
  }

  export interface ILayerDataType extends Array<ILayerEle> { };
  export interface IRecordDataType extends Array<IRecordEle> { }
  export interface IInfoDBDataType extends Array<IInfoDBEle> { };
  export interface IInfoLayerDataType extends Array<IInfoLayerEle> { };


  interface IRecordTypeList extends Array<string> { }
  interface ILayerTypeList {
    weight: string[];
    gradient: string[];
    seq: string[];
  }
  interface IKernelTypeList {
    weight: string[];
    gradient: string[];
    seq: string[];
  }
  interface IImgTypeList {
    cls: string[];
    type: string[];
  }

  export interface IGlobalService {
    setRecordTypeList(d: IRecordTypeList, type?: string): void;
    setLayerTypeList(d: ILayerTypeList, type?: string): void;
    setKernelTypeList(d: IKernelTypeList, type?: string): void;
    setImgTypeList(d: IImgTypeList, type?: string): void;
    setSelectedDB(d: string, type?: string): void;
    setData(d: any, type?: string): void;
    setConfig(d: any, type?: string): void;
    getRecordTypeList(type?: string): IRecordTypeList;
    getLayerTypeList(type?: string): ILayerTypeList;
    getKernelTypeList(type?: string): IKernelTypeList;
    getImgTypeList(type?: string): IImgTypeList;
    getImgDBList(type?: string): string[];
    getModelList(type?: string): any;
    getSelectedDB(type?: string): string;
    getData(type?: string): any;
    getConfig(type?: string): any;
  }

  export class Global {

    public exports: any;
    public all: any;

    public static factory() {
      let service = () => {
        let tmp = new Global().exports;
        return tmp;
      };
      service.$inject = [];
      return service;
    }

    constructor() {
      // init variables
      this._init();

      // add public API
      this._addAPI('recordTypeList');
      this._addAPI('layerTypeList');
      this._addAPI('kernelTypeList');
      this._addAPI('imgTypeList');
      this._addAPI('imgDBList');
      this._addAPI('modelList');
      this._addAPI('selectedDB');
      this._addAPI('data');
      this._addAPI('config');
    }

    private _addAPI(name: string) {
      let this_ = this;
      let setName = 'set' + name[0].toUpperCase() + name.slice(1);
      let getName = 'get' + name[0].toUpperCase() + name.slice(1);
      this_.exports[setName] = (d, t?) => {
        if (!t) {
          this_.all[name] = d;
        } else {
          this_.all[name][t] = d;
        }
      };
      this_.exports[getName] = (t?) => {
        return !t ? this_.all[name] : this_.all[name][t];
      };
    }

    private _init() {
      // initialize
      this.exports = {};
      this.all = {};
      this.all.recordTypeList = [
        { label: 'learning rate', value: 'lr' },
        { label: 'validation error', value: 'testError' },
        { label: 'validation loss', value: 'testLoss' },
        { label: 'train error', value: 'trainError' },
        { label: 'train loss', value: 'trainLoss' }
      ];


      this.all.layerTypeList = [
        { label: 'mean magnitude (norm1)', value: 'norm1' },
        { label: 'mean magnitude (norm2)', value: 'norm2' },
        { label: 'sum', value: 'sum' },
        { label: 'mean', value: 'mean' },
        { label: 'std', value: 'std' },
        { label: 'var', value: 'var' }
        { label: 'max', value: 'max' },
        { label: 'mid', value: 'mid' },
        { label: 'min', value: 'min' },
        { label: 'quarter1', value: 'quarter1' },
        { label: 'quarter3', value: 'quarter3' },
        // { label: 'change ratio', value: 's_cratio' }
      ];

      // global static var
      this.all.imgDBList = ['imagenet', 'cifar'];

      this.all.modelList = {
        'imagenet': [
          { label: 'resnet50-sgd-1P4G-1x', value: 'imagenet-1x-1' },
          { label: 'resnet50-sgd-1P4G-1x-lr0.5', value: 'imagenet-1x-lr0.5' },
          { label: 'resnet50-sgd-1P4G-1x-lr2', value: 'imagenet-1x-lr2' },
          { label: 'resnet50-sgd-1P4G-1x-m0', value: 'imagenet-1x-m0' },
          { label: 'resnet50-sgd-1P4G-2x', value: 'imagenet-2x-1' },
          { label: 'resnet50-sgd-1P4G-2x-lr2', value: 'imagenet-2x-lr2' },
          { label: 'resnet50-sgd-1P4G-8x', value: 'imagenet-8x-1' }
        ],
        'cifar': [
          { label: 'resnet164-sgd-1P4G-1x-1', value: 'cifar-1x-1' },
          { label: 'resnet164-sgd-1P4G-1x-2', value: 'cifar-1x-2' },
          { label: 'resnet164-sgd-1P4G-1x-lr0.5', value: 'cifar-1x-lr0.5' },
          { label: 'resnet164-sgd-1P4G-1x-lr2', value: 'cifar-1x-lr2' },
          { label: 'resnet164-sgd-1P4G-1x-m0', value: 'cifar-1x-m0' },
          { label: 'resnet164-sgd-1P4G-2x-1', value: 'cifar-2x-1' },
          { label: 'resnet164-sgd-1P4G-2x-lr0.5', value: 'cifar-2x-lr0.5' },
          { label: 'resnet164-sgd-1P4G-2x-lr2', value: 'cifar-2x-lr2' },
          { label: 'resnet164-sgd-1P4G-4x', value: 'cifar-4x-1' },
          { label: 'resnet164-sgd-1P4G-8x', value: 'cifar-8x-1' }
        ]
      };

      // global dynamic var
      this.all.selectedDB = null;

      this.all.data = {
        iter: {
          num: 0,
          set: null,
          array: null,
          picked: null
        },
        tree: null,
        info: {
          db: null,
          layer: null,
          cls: null
        },
        record: {
          lr: null,
          testError: null,
          trainError: null,
          testLoss: null,
          trainLoss: null
        },
        label: {
          modelStat: null,
          clsStat: null
        }
      };

      this.all.config = {
        timebox: {
          show: true
        },
        record: {
          lr: true,
          testError: true,
          testLoss: true,
          trainError: true,
          trainLoss: true,
          show: false
        },
        label: {
          mds: false,
          show: false,
          threshold: 5,
          abnormal: 20
        },
        layer: {
          gw: 'g',
          type: 'norm1',
          show: false,
          sameScale: false,
          level: 0
        }
      };
    }

  }

  angular
    .module('utils')
    .factory('Global', Global.factory());
}
