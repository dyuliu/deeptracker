namespace application {
  'use strict';

  export interface IDataManagerService {
    /**
     * fetch info of db or layer structure from back-end
     * @param options the parameters to query server
     * @return Returns an ng.promise<array>.
     */
    fetchInfo(options: IHTTPOptionConfig): ng.IPromise<any[]>;
    fetchRecord(options: IHTTPOptionConfig): ng.IPromise<IRecordDataType>;
    fetchLayer(options: IHTTPOptionConfig, stream?: boolean): ng.IPromise<ILayerDataType>;
    fetchKernel(options: IHTTPOptionConfig, stream?: boolean): ng.IPromise<IKernelDataType>;
    fetchImg(options: IHTTPOptionConfig, stream?: boolean): ng.IPromise<IImgDataType>;
  };

  class DataManager implements IDataManagerService {
    public static $inject = ['$q', 'Global', 'HTTP'];

    constructor(
      public $q: ng.IQService,
      public Global: IGlobalService,
      public HTTP: IHTTP) {
      // do somethings here
    }

    public fetchInfo(options: IHTTPOptionConfig): ng.IPromise<any[]> {
      return this.$q( (resolve, reject) => {
        this.HTTP
          .request({api: 'info', config: options})
          .then(data => { resolve(data); });
      });
    }

    public fetchRecord(options: IHTTPOptionConfig): ng.IPromise<IRecordDataType> {
      return this.$q( (resolve, reject) => {
        this.HTTP
          .request({api: 'record', config: options})
          .then(data => { resolve(data); });
      });
    }

    public fetchLayer(options: IHTTPOptionConfig, stream = true): ng.IPromise<ILayerDataType> {
      let this_ = this;
      let deferred = this_.$q.defer();
      let opt: IHTTPOption = {api: 'layer', config: options};
      if (!stream) {
        this_.HTTP.request(opt).then(data => { deferred.resolve(data); });
      } else {
        this_.HTTP.streamRequest(opt).then((data) => { deferred.resolve(data); });
      }
      return deferred.promise;
    }

    public fetchKernel(options: IHTTPOptionConfig, stream = true): ng.IPromise<IKernelDataType> {
      let this_ = this;
      let deferred = this_.$q.defer();
      let opt: IHTTPOption = {api: 'kernel', config: options};
      if (!stream) {
        this_.HTTP.request(opt).then(data => { deferred.resolve(data); });
      } else {
        this_.HTTP.streamRequest(opt).then((data) => { deferred.resolve(data); });
      }
      return deferred.promise;
    };

    public fetchImg(options: IHTTPOptionConfig, stream = true): ng.IPromise<IImgDataType> {
      let this_ = this;
      let deferred = this_.$q.defer();
      let opt: IHTTPOption = {api: 'img', config: options};
      if (!stream) {
        this_.HTTP.request(opt).then(data => { deferred.resolve(data); });
      } else {
        this_.HTTP.streamRequest(opt).then((data) => { deferred.resolve(data); });
      }
      return deferred.promise;
    }

  }

  angular
    .module('utils')
    .service('DataManager', DataManager);
}


// public speedDataHandler(data: ILayerEle[]): StackedAreaChartDataType {
//   return this.DataProcessor.stackedAreaChart(data);
// }

// public procLayer(data: ILayerEle[], conf, type: string) {
//   let result: any = {key: conf.db + '_' + conf.attr + '_' + conf.wid};
//   data = _.sortBy(data, 'iter');
//   switch (type) {
//     case 'lineWithFocusChart':
//       result.values = _.map(data, (o: ILayerEle) => {
//         return {
//           x: o.iter,
//           y: o.value[conf.layer]
//         };
//       });
//       break;
//   }
//   console.log(result);
//   return result;
// }


// public procRecord(data: IRecordEle[], conf, type: string) {
//   let result: any = { key: conf.dbName + '_' + conf.recType };
//   data = _.sortBy(data, 'iter');
//   switch (type) {
//     case 'lineWithFocusChart':
//       result.values = _.map(data, (o: IRecordEle) => {
//         return {
//           x: o.iter,
//           y: o.value
//         };
//       });
//       break;
//     case 'scatterChart':
//       let shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'];
//       result.values = _.map(data, (o: IRecordEle) => {
//         return {
//           shape: shapes[conf.count % 6],
//           size: 0.5,
//           x: o.iter,
//           y: o.value
//         };
//       });
//       break;
//     case 'multiBarChart':
//       result.values = _.map(data, (o: IRecordEle) => {
//         return {
//           x: o.iter,
//           y: o.value
//         };
//       });
//       break;
//     case 'stackedAreaChart':
//       let colors = d3.scaleOrdinal(d3.schemeCategory10);
//       result.color = colors[conf.count % 10];
//       result.values = _.map(data, (o: IRecordEle) => {
//         return [o.iter, o.value];
//       });
//       break;
//   }
//   return result;
// }
