// class ResPonseBsonInterceptor {
//   public static $inject = ['$log', '$q'];

//   constructor($log: ng.ILogService, $q: ng.IQService) {
//     $log.info('here is where I will define my interceptor');
//     let interceptor: any = {
//       response: function(res) {
//         let deferred = $q.defer();
//         setTimeout(() => {
//           if (res.config.url && res.config.url.indexOf('stream/layer') < 0) {
//             deferred.resolve(res);
//             return;
//           }
//           let data = new Uint8Array(res.data);
//           let offset = 0;
//           let bson = new BSON();
//           let rproto = bson.serialize({}).__proto__;
//           let result = [];
//           while (offset < data.length) {
//             let len = data[offset] + data[offset + 1] * Math.pow(16, 2) +
//               data[offset + 2] * Math.pow(16, 4) + data[offset + 3] * Math.pow(16, 6);
//             let rr: any = data.subarray(offset + 4, offset + 4 + len);
//             rr.__proto__ = rproto;
//             result.push(bson.deserialize(rr));
//             offset += 4 + len;
//           }
//           console.log(result);
//           deferred.resolve(res);
//         }, 100);
//         return deferred.promise;
//       }
//     };
//     return interceptor;
//   }
// }

// let module = angular.module('services');

// module.factory('bsonInterceptor', ResPonseBsonInterceptor);

// module.config(['$httpProvider', function($httpProvider: ng.IHttpProvider) {
//   $httpProvider.interceptors.push('bsonInterceptor');
// }]);