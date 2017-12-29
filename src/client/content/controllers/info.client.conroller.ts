'use strict';

namespace application {

  interface IScope extends ng.IScope {
    showModal: any;
    models: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', '$modal', '$sce'];

    constructor(
      public $scope: IScope,
      $modal,
      $sce
    ) {
      let self = this;

      $scope.models = {
        googleNet: $sce.trustAsResourceUrl('http://ethereon.github.io/netscope/#/preset/googlenet'),
        resnet50: $sce.trustAsResourceUrl('http://ethereon.github.io/netscope/#/gist/db945b393d40bfa26006')
      };

      let modal = $modal({
        scope: $scope,
        templateUrl: 'src/client/content/views/tpls/modal.client.tpls.html',
        show: false
      });
      $scope.showModal = function() {
        modal.$promise.then(modal.show);
      };
    }
    // end of constructor

  }
  angular
    .module('content')
    .controller('InfoController', Controller);
}
