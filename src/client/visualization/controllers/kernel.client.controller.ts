'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
    layerList: IInfoLayerDataType;
    ratioList: any[];
    typeList: string[];
    selectedDB: IInfoDBEle;
    selectedLayer: IInfoLayerEle[];
    selectedRatio: number;
    selectedType: { value: string };
    range: { start: number, end: number };
    data?: IKernelDataType;
    options: any; // options for kernel directive
    render(): void;
  }

  class Controller {
    public static $inject = ['$scope', 'DataManager', 'Global'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService
    ) {
      DataManager.fetchInfo({ type: 'db' }).then(data => {
        $scope.dbList = data;
        $scope.selectedDB = data[0];
      });
      DataManager.fetchInfo({ type: 'layer' }).then(data => {
        $scope.layerList = data;
        $scope.selectedLayer = [data[0]];
      });
      $scope.typeList = Global.getKernelTypeList().seq;
      $scope.ratioList = this._genRatios(6, 1);
      $scope.range = { start: 0, end: 80000 };
      $scope.data = [];
      $scope.selectedType = { value: $scope.typeList[0] };

      $scope.options = {
        height: 10000,
        width: 3000,
        kernelSize: 1,
        groupSpace: 1,
        margin: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        },
        ratio: 0.001,
        layer: null
      };

      $scope.$watch('selectedLayer', (n, o) => { $scope.options.layer = n; }, false);

      $scope.render = function () {
        console.time('render');
        let transLayer = _.map($scope.selectedLayer, d => d.lid);
        let opt: IHTTPOptionConfig = {
          db: $scope.selectedDB.name,
          type: $scope.selectedType.value,
          range: $scope.range,
          layer: transLayer,
          parser: 'json'
        };
        DataManager
          .fetchKernel(opt, true)
          .then(data => { $scope.data = data; });
      };

    }

    private _genRatios(scales: number, step: number): number[] {
      let this_ = this;
      let s = 0.1;
      let r = [];
      r.push({ value: 1, label: '1' });
      for (let i = 0; i < scales; i += 1) {
        for (let j = 9; j > 0; j -= step) {
          r.push({ value: s * j, label: d4.format('.1r')(s * j) });
        }
        s /= 10;
      }
      return r;
    }
  }

  angular
    .module('vis')
    .controller('KernelController', Controller);
}
