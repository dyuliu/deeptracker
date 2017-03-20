'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dataMatrix: any;
    optionsMatrix: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'Pip', 'Global', '$q', 'DataManager'];

    constructor(
      public $scope: IScope,
      public Pip: IPipService,
      public Global: IGlobalService,
      public $q: ng.IQService,
      public DataManager: IDataManagerService
    ) {
      let this_ = this;
      Pip.onCorrelationReady($scope, msg => {
        $scope.dataMatrix = msg.data;
        $scope.optionsMatrix = msg.options;
      });

      // Pip.onCorrelationConfigChanged($scope, msg => {
      //   $
      // });
    }

  }

  angular
    .module('vis')
    .controller('CorrelationController', Controller);
}


