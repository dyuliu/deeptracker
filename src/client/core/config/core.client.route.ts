'use strict';

namespace application {
  class Config {
    public static $inject = [
      '$stateProvider',
      '$urlRouterProvider'
    ];

    constructor($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.rule(function ($injector, $location) {
        let path = $location.path();
        let hasTrailingSlash = path.length > 1 && path[path.length - 1] === '/';

        if (hasTrailingSlash) {
          // if last character is a slash, return the same url without the slash
          let newPath = path.substr(0, path.length - 1);
          $location.replace().path(newPath);
        }
      });

      // redirect to / when route not found
      $urlRouterProvider.otherwise('/');

      $stateProvider
        .state('index', {
          url: '/',
          views: {
            '': {
              templateUrl: 'src/client/core/views/index.client.view.html',
              controller: 'IndexController',
            },
            'header@index': {
              templateUrl: 'src/client/core/views/sub-views/header.client.view.html'
              // controller: 'HeaderController'
            },
            'dashboard@index': {
              templateUrl: 'src/client/core/views/sub-views/dashboard.client.view.html',
              controller: 'DashboardController'
            },
            'content@index': {
              templateUrl: 'src/client/core/views/sub-views/content.client.view.html'
              // controller: 'ContentController'
            },
            'footer@index': {
              templateUrl: 'src/client/core/views/sub-views/footer.client.view.html'
            }
          }
        });
    }
  }

  angular
    .module('core')
    .config(Config);
}
