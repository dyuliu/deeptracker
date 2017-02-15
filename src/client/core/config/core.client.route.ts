'use strict';

namespace application {
  class CoreRouteConfig {
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

      // redirect to /home when route not found
      $urlRouterProvider.otherwise('/home');

      $stateProvider
        .state('home', {
          url: '/home',
          templateUrl: 'src/client/core/views/home.client.view.html',
          controller: 'HomeController'
        });
    }
  }

  angular
    .module('core')
    .config(CoreRouteConfig);
}
