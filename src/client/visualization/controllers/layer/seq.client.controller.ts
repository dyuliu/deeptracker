'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
    layerList: IInfoLayerDataType;
    ratioList: {value: number, label: string}[];
    typeList: string[];
    selectedDB: IInfoDBEle;
    selectedLayer: IInfoLayerEle[];
    selectedRatio: {value: number, label: string}[];
    selectedType: {value: string};
    range: {start: number, end: number};
    data?: ISeqDataType;
    options: any;  // options for seq directive
    render(): void;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService
    ) {
      DataManager.fetchInfo({type: 'db'}).then( data => {
        $scope.dbList = data;
        $scope.selectedDB = data[0];
      });

      $scope.typeList = Global.getLayerTypeList().seq;
      $scope.ratioList = this._genRatios(6, 1);
      $scope.range = {start: 0, end: 80000};
      $scope.data = [];
      $scope.selectedType = {value: $scope.typeList[0]};

      $scope.options = {
        type: 'changeratio',
        height: 10000,
        width: 3000,
        cellWidth: 1,
        cellSpacing: 0,
        groupSpacing: 3,
        groupMaxHeight: 50,
        groupMinHeight: 50,
        margin: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        },
        layer: null,
        ratio: null
      };

      $scope.$watch('selectedDB', (n: IInfoDBEle, o) => {
        DataManager.fetchInfo({db: n.name, type: 'layer'}).then( data => {
          $scope.layerList = data;
          $scope.selectedLayer = [data[0]];
        });
      }, true);
      $scope.$watch('selectedLayer', (n, o) => { $scope.options.layer = n; }, false);
      $scope.$watch('selectedRatio', (n, o) => { $scope.options.ratio = n; }, false);

      $scope.render = function () {
        console.time('render');
        let transLayer = _.map($scope.selectedLayer, d => d.lid );
        let transRatio = _.map($scope.selectedRatio, d => d.value );
        let opt: IHTTPOptionConfig = {
          db: $scope.selectedDB.name,
          type: $scope.selectedType.value,
          range: $scope.range,
          layer: transLayer,
          seqidx: transRatio,
          parser: 'json'
        };
        DataManager
          .fetchLayer(opt, true)
          .then((data: any[]) => {
            // add layer basic info to data
            for (let i = 0; i < data.length; i += 1) {
              let idx = _.findIndex($scope.layerList, o => +o.lid === +data[i].key);
              data[idx].name = $scope.layerList[idx].name;
              data[idx].size = $scope.layerList[idx].channels * $scope.layerList[idx].kernelNum *
                $scope.layerList[idx].kernelHeight * $scope.layerList[idx].kernelWidth;
            }
            $scope.data = data;
          });
      };

    }

    private _genRatios(scales: number, step: number): any[] {
      let this_ = this;
      let s = 0.1;
      let r = [];
      let idx = 1;
      r.push({value: 1, label: '1'});
      for (let i = 0; i < scales; i += 1) {
        for (let j = 9; j > 0; j -= step) {
          r.push({value: idx, label: d4.format('.1r')(s * j)});
          idx++;
        }
        s /= 10;
      }
      this_.$scope.selectedRatio = [r[0], r[9], r[18], r[27]];
      return r;
    }
  }

  angular
    .module('vis')
    .filter('ratioFormat', function() {
      return (input) => {
        let output = [];
        _.each(input, (d) => { output.push(d.label); });
        return output;
      };
    });

  angular
    .module('vis')
    .controller('SeqController', Controller);
}
