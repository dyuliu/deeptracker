'use strict';

namespace application {
  class Controller {
    public static $inject= ['$scope'];

    constructor($scope) {
      // do some if any
    }

  }

  angular
    .module('core')
    .controller('HeaderController', Controller);
}
