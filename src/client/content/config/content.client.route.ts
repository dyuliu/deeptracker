'use strict';

namespace application {
  class Config {

    public static $inject: string[] = ['$stateProvider'];

    constructor($stateProvider) {
      $stateProvider
        .state('index.info', {
          url: '/info',
          templateUrl: 'src/client/content/views/info.client.view.html',
          controller: 'InfoController'
        })
        .state('index.gallery', {
          url: '/gallery',
          templateUrl: 'src/client/content/views/gallery.client.view.html',
          controller: 'GalleryController'
        });
    }
  }

  angular
    .module('content')
    .config(Config);
}
