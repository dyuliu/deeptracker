'use strict';

namespace application {

  angular
    .module(applicationName, applicationVendorDependencies);

  class BootstrapConfig {
    public static $inject: string[] = ['$locationProvider', '$httpProvider'];

    constructor($locationProvider, $httpProvider) {
      $locationProvider.html5Mode(true).hashPrefix('!');
    }
  }

  angular
    .module(applicationName)
    .config(BootstrapConfig);

  angular
    .element(document)
    .ready(init);

  function init() {
    angular.bootstrap(document, [applicationName]);
  }
}
