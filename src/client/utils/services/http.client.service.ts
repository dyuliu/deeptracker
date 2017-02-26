namespace application {

  export interface IHTTPOptionConfig {
    db?: string;
    type?: string;
    range?: {start: number, end: number};
    iter?: number;
    layer?: number[];
    seqidx?: number[];
    parser?: string;
    cls?: any; // string or string[]
  }

  export interface IHTTPOption {
    api?: string;
    config?: IHTTPOptionConfig;
    // responseType?: string;    // text, json, arraybuffer
    url?: string;
    method?: string;
  }

  export interface IHTTP {
    request: (options?: IHTTPOption) => ng.IPromise<any>;
    streamRequest: (options?: IHTTPOption) => ng.IPromise<any>;
  }

  // factory: single object
  class HTTP implements IHTTP {
    public static factory() {
      let service = function ($q, $http): IHTTP {
         return new HTTP($q, $http);
      };
      service.$inject = ['$q', '$http'];
      return service;
    }

    constructor(
      public $q: ng.IQService,
      public $http: ng.IHttpService
    ) {
      // init your configure
    }

    public request(options?: IHTTPOption) {
      let this_ = this;
      let {api, url, method, config} = options;
      let parser = config.parser = config.parser ? config.parser : 'json';
      if (method === 'GET') { /* deal with url */ }
      let msg: ng.IRequestConfig = _.merge(options, {
        url: url ? url : '/api/' + api,
        method: method ? method : 'POST',
        responseType: parser === 'json' ? 'text' : 'arraybuffer',
        transformResponse: parser === 'json' ? this_._jsonParser : this_._bsonParser,
        data: method !== 'GET' ? config : null
      });
      return this_.$q( (resolve, reject) => {
        this_.$http(msg).then(
          res => { resolve(res.data); },
          err => { console.log(err); reject(err); }
        );
      });
    }

    public streamRequest(options?: IHTTPOption) {
      let this_ = this;
      let {api, url, method, config} = options;
      let parser = config.parser = config.parser ? config.parser : 'bson';
      let msg: ng.IRequestConfig = _.merge(options, {
        url: url ? url : '/api/stream/' + api,
        method: method ? method : 'POST',
        responseType: parser === 'json' ? 'text' : 'arraybuffer',
        transformResponse: parser === 'json' ? this_._jsonParser : this_._bsonParser,
        data: method !== 'GET' ? config : null
      });
      return this_.$q( (resolve, reject) => {
        this_.$http(msg).then(
          res => { resolve(res.data); },
          err => { console.log(err); reject(err); }
        );
      });
    }

    private _jsonParser(data) {
      // console.log('json parser');
      let strData = typeof data === 'string' ? data : abtostr(data);
      let result;
      let pos = strData.indexOf('\n');
      if (pos >= 0) {
        let offset = 0;
        result = [];
        while (pos >= 0) {
          let substr = strData.substring(offset, pos);
          result = result.concat(JSON.parse(substr));
          offset = pos + 1;
          pos = strData.indexOf('\n', offset);
        }
      } else {
        result = JSON.parse(strData);
      }
      return result;

      function strtoab(str) {
        if (/[\u0080-\uffff]/.test(str)) {
          throw new Error('this needs encoding, like UTF-8');
        }
        let arr = new Uint8Array(str.length);
        for (let i = str.length; i; i -= 1) { arr[i] = str.charCodeAt(i); }
        return arr.buffer;
      }

      function abtostr(buffer) {
        let arr = new Uint8Array(buffer);
        let str = '', chunkSize = 0xffff;
        let len = arr.length;
        for (let i = 0; i * chunkSize < len; i += 1) {
          str += String.fromCharCode.apply(null, arr.subarray(i * chunkSize,
            (i + 1) * chunkSize));
        }
        if (/[\u0080-\uffff]/.test(str)) {
            throw new Error('this string seems to contain (still encoded) multibytes');
        }
        return str;
      }
    }

    private _bsonParser(data) {
      // console.log('bson parser');
      if (!(data instanceof ArrayBuffer)) {
        console.error('bsonParser: not arraybuffer');
        return data;
      }
      let this_ = this;
      let bufView = new Uint8Array(data),
          offset = 0,
          bson = new BSON(),
          proto = bson.serialize({}).__proto__,
          result = [];

      let calcLen = (d, i) => d[i] + d[i + 1] * Math.pow(16, 2) +
        d[i + 2] * Math.pow(16, 4) + d[i + 3] * Math.pow(16, 6);

      let parse = (d) => {
        d.__proto__ = proto;
        return bson.deserialize(d);
      };

      let count = 0;
      while (offset < bufView.length) {
        let len = calcLen(bufView, offset);
        count += len;
        let obj = parse(bufView.subarray(offset + 4, offset + 4 + len));
        result.push(obj);
        offset += 4 + len;
      }
      // console.log(count);
      // console.log(result);
      return result;
    }

  }

  angular
    .module('utils')
    .factory('HTTP', HTTP.factory());
}
