'use strict';

namespace application {
  export class VisRouteConfig {

    public static $inject: string[] = ['$stateProvider'];

    constructor($stateProvider) {
      $stateProvider
        .state('home.overview', {
          url: '/overview',
          templateUrl: 'src/client/visualization/views/overview.client.view.html'
        })
        .state('home.record', {
          url: '/record',
          templateUrl: 'src/client/visualization/views/record.client.view.html',
          controller: 'RecordController'
        })
        .state('home.layer', {
          url: '/layer',
          templateUrl: 'src/client/visualization/views/layer.client.view.html'
        })
        .state('home.layer.stat', {
          url: '/stat',
          templateUrl: 'src/client/visualization/views/layer/stat.client.view.html',
          controller: 'StatController'
        })
        .state('home.layer.speed', {
          url: '/speed',
          templateUrl: 'src/client/visualization/views/layer/speed.client.view.html',
          controller: 'SpeedController'
        })
        .state('home.layer.seq', {
          url: '/seq',
          templateUrl: 'src/client/visualization/views/layer/seq.client.view.html',
          controller: 'SeqController'
        })
        .state('home.img', {
          url: '/img',
          templateUrl: 'src/client/visualization/views/img.client.view.html',
          controller: 'ImgController'
        })
        .state('home.kernel', {
          url: '/kernel',
          templateUrl: 'src/client/visualization/views/kernel.client.view.html',
          controller: 'KernelController'
        });
    }
  }

  angular
    .module('vis')
    .config(VisRouteConfig);
}
