'use strict';

namespace application {
  class Config {

    public static $inject: string[] = ['$stateProvider'];

    constructor($stateProvider) {
      $stateProvider
        .state('home.visualization', {
          url: '/visualization',
          templateUrl: 'src/client/visualization/views/visualization.client.view.html',
          controller: 'VisualizationController'
        });
    }
  }

  angular
    .module('vis')
    .config(Config);
}
