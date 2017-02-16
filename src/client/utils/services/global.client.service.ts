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

  export interface ILayerDataType extends Array<ILayerEle> {};
  export interface IRecordDataType extends Array<IRecordEle> {}
  export interface IInfoDBDataType extends Array<IInfoDBEle> {};
  export interface IInfoLayerDataType extends Array<IInfoLayerEle> {};


  interface IRecordTypeList extends Array<string> {}
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
    setRecordTypeList(d: IRecordTypeList): void;
    getRecordTypeList(): IRecordTypeList;
    setLayerTypeList(d: ILayerTypeList): void;
    getLayerTypeList(): ILayerTypeList;
    setKernelTypeList(d: IKernelTypeList): void;
    getKernelTypeList(): IKernelTypeList;
    setImgTypeList(d: IImgTypeList): void;
    getImgTypeList(): IImgTypeList;
    getImgDataset(): string[];
    getModels(): any;
  }

  export class Global implements IGlobalService {

    public setRecordTypeList: (d: IRecordTypeList) => void;
    public getRecordTypeList: () => IRecordTypeList;
    public setLayerTypeList: (d: ILayerTypeList) => void;
    public getLayerTypeList: () => ILayerTypeList;
    public setKernelTypeList: (d: IKernelTypeList) => void;
    public getKernelTypeList: () => IKernelTypeList;
    public setImgTypeList: (d: IImgTypeList) => void;
    public getImgTypeList: () => IImgTypeList;
    public getImgDataset: () => string[];
    public getModels: () => any;

    public static factory() {
      let service = () => {
        return new Global();
      };
      service.$inject = [];
      return service;
    }

    constructor() {
      let record = [
        'lr',
        'test_error',
        'test_loss',
        'train_error',
        'train_loss'
      ];

      let layer = {
        weight: [
          'w_max',
          'w_mean',
          'w_mid',
          'w_min',
          'w_norm0',
          'w_norm1',
          'w_norm2',
          'w_quarter1',
          'w_quarter3',
          'w_std',
          'w_sum',
          'w_var'
        ],
        gradient: [
          'g_max',
          'g_mean',
          'g_mid',
          'g_min',
          'g_norm0',
          'g_norm1',
          'g_norm2',
          'g_quarter1',
          'g_quarter3',
          'g_std',
          'g_sum',
          'g_var'
        ],
        seq: [
          's_cratio',
          's_histogram',
          's_histogram'
        ],
      };

      let kernel = {
        weight: [],
        gradient: [],
        seq: [
          'w_norm1',
          'w_norm2'
        ]
      };

      // to improve, it should be fetched from backend
      let img = {
        type: [
          'test',
          'train'
        ],
        cls: [
          'cls0',
          'cls1',
          'cls2',
          'cls3',
          'cls4',
          'cls5',
          'cls6',
          'cls7',
          'cls8',
          'cls9'
        ]
      };

      let imgDataset = [
        'imagenet',
        'cifar'
      ];

      let models = {
        'imagenet': [
          {label: 'resnet50-sgd-1P4G-1x-lr0.5', value: 'imagenet-1x-lr0.5'},
          {label: 'resnet50-sgd-1P4G-1x-lr2', value: 'imagenet-1x-lr2'},
          {label: 'resnet50-sgd-1P4G-2x-lr2', value: 'imagenet-2x-lr2'},
          {label: 'resnet50-sgd-1P4G-8x-1', value: 'imagenet-8x-1'}
        ],
        'cifar': [
          {label: 'resnet164-sgd-1P4G-1x', value: 'cifar-1x-1'},
        ]
      };

      this.setRecordTypeList = (d) => { record = d; };
      this.getRecordTypeList = () => record;
      this.setLayerTypeList = (d) => { layer = d; };
      this.getLayerTypeList = () => layer;
      this.setKernelTypeList = (d) => { kernel = d; };
      this.getKernelTypeList = () => kernel;
      this.setImgTypeList = (d) => { img = d; };
      this.getImgTypeList = () => img;

      this.getImgDataset = () => imgDataset;
      this.getModels = () => models;
    }
  }

  angular
    .module('utils')
    .factory('Global', Global.factory());
}
