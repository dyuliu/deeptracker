'use strict';

namespace application {

  interface IScope extends ng.IScope {
    selected: any;
    imgDataset: string[];
    models: {label: string, value: string}[];
    checkbox: any;
    selectedCheckbox: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService
    ) {
      let this_ = this;

      // to activate sidebar
      setTimeout( () => {
        $('#sidebar-collapse').trigger('click');
        if ($('#sidebar').hasClass('menu-min')) {
          $('#sidebar-collapse').trigger('click');
        };
      }, 100);

      $scope.imgDataset = Global.getImgDataset();
      $scope.models = [];
      $scope.selected = {
        imgDataset: null,
        model: null
      };
      $scope.$watch('selected.imgDataset', function(n: any, o) {
        if (n === o) { return; }
        $scope.models = Global.getModels()[n];
        console.log($scope.models);
      }, false);

      $scope.selectedCheckbox = {
        record: {
          lr: false,
          testError: true,
          testLoss: false,
          trainError: true,
          trainLoss: false,
          merge: false
        }
      };

      $scope.checkbox = {
        record: [
          {label: 'global lr', model: 'lr'},
          {label: 'test error', model: 'testError'},
          {label: 'train error', model: 'trainError'},
          {label: 'test loss', model: 'testLoss'},
          {label: 'train loss', model: 'trainLoss'}
        ]
      };

      // save selected to global
      // $scope.$watch('selected.model', function(n, o) {
      //   Global.selected = $scope.selected;
      // }, false)
    }
  }

  angular
    .module('core')
    .controller('DashboardController', Controller);
}
