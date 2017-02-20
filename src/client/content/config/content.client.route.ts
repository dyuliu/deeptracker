'use strict';

namespace application {
  class Config {

    public static $inject: string[] = ['$stateProvider'];

    constructor($stateProvider) {
      $stateProvider
        .state('home.info', {
          url: '/info',
          templateUrl: 'src/client/content/views/info.client.view.html',
          controller: 'InfoController'
        })
        .state('home.gallery', {
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
