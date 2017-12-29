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
    loadJson(url: string): ng.IPromise<any>;
  };

  class DataManager implements IDataManagerService {
    public static $inject = ['$q', '$http', 'Global', 'HTTP'];

    constructor(
      public $q: ng.IQService,
      public $http: ng.IHttpService,
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
      let self = this;
      let deferred = self.$q.defer();
      let opt: IHTTPOption = {api: 'layer', config: options};
      if (!stream) {
        self.HTTP.request(opt).then(data => { deferred.resolve(data); });
      } else {
        self.HTTP.streamRequest(opt).then((data) => { deferred.resolve(data); });
      }
      return deferred.promise;
    }

    public fetchKernel(options: IHTTPOptionConfig, stream = true): ng.IPromise<IKernelDataType> {
      let self = this;
      let deferred = self.$q.defer();
      let opt: IHTTPOption = {api: 'kernel', config: options};
      if (!stream) {
        self.HTTP.request(opt).then(data => { deferred.resolve(data); });
      } else {
        self.HTTP.streamRequest(opt).then((data) => { deferred.resolve(data); });
      }
      return deferred.promise;
    };

    public fetchImg(options: IHTTPOptionConfig, stream = true): ng.IPromise<IImgDataType> {
      let self = this;
      let deferred = self.$q.defer();
      let opt: IHTTPOption = {api: 'img', config: options};
      if (!stream) {
        self.HTTP.request(opt).then(data => { deferred.resolve(data); });
      } else {
        self.HTTP.streamRequest(opt).then((data) => { deferred.resolve(data); });
      }
      return deferred.promise;
    }

    public loadJson(url: string): ng.IPromise<any> {
      let self = this;
      let deferred = self.$q.defer();
      self.$http({url: url, method: 'GET'}).then(data => { deferred.resolve(data); });
      return deferred.promise;
    }

  }

  angular
    .module('utils')
    .service('DataManager', DataManager);
}
