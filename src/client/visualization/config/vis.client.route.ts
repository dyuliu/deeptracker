'use strict';

namespace application {
  class Config {

    public static $inject: string[] = ['$stateProvider'];

    constructor($stateProvider) {
      $stateProvider
        .state('index.visualization', {
          url: '/visualization',
          templateUrl: 'src/client/visualization/views/visualization.client.view.html',
          controller: 'VisualizationController'
        });

      // $stateProvider
      //   .state('index.overview', {
      //     url: '/overview',
      //     templateUrl: 'src/client/visualization/views/overview.client.view.html'
      //   })
      //   .state('index.record', {
      //     url: '/record',
      //     templateUrl: 'src/client/visualization/views/record.client.view.html',
      //     controller: 'RecordController'
      //   })
      //   .state('index.layer', {
      //     url: '/layer',
      //     templateUrl: 'src/client/visualization/views/layer.client.view.html'
      //   })
      //   .state('index.layer.stat', {
      //     url: '/stat',
      //     templateUrl: 'src/client/visualization/views/layer/stat.client.view.html',
      //     controller: 'StatController'
      //   })
      //   .state('index.layer.speed', {
      //     url: '/speed',
      //     templateUrl: 'src/client/visualization/views/layer/speed.client.view.html',
      //     controller: 'SpeedController'
      //   })
      //   .state('index.layer.seq', {
      //     url: '/seq',
      //     templateUrl: 'src/client/visualization/views/layer/seq.client.view.html',
      //     controller: 'SeqController'
      //   })
      //   .state('index.img', {
      //     url: '/img',
      //     templateUrl: 'src/client/visualization/views/img.client.view.html',
      //     controller: 'ImgController'
      //   })
      //   .state('index.kernel', {
      //     url: '/kernel',
      //     templateUrl: 'src/client/visualization/views/kernel.client.view.html',
      //     controller: 'KernelController'
      //   });
    }
  }

  angular
    .module('vis')
    .config(Config);
}
