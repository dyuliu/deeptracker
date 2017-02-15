'use strict';

namespace application {
  export interface ITimePathDataEle {
    iter: number;
    values: {
      x: number;
      y: number;
    };
  }

  interface ITimePathCtrlScope extends ng.IScope {
    selectedDB: IDBListEle;
    selectedWid: number;
    selectedLayer: number;
    xAttr: string;
    yAttr: string;
    dbList: IDBListEle[];
    layerList: ILayerListEle[];
    attrList: string[];
    widList: number[];
    data: ITimePathDataEle[];  // time-path directive data
    options: any;  // time-path directive options
    add(): void; // button for adding data to chart
    clean(): void; // clean current data in chart
  }

  export class TimePathController {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor($scope: ITimePathCtrlScope, DataManager: IDataManagerService, Global: IGlobalService, $q: ng.IQService) {

      DataManager.fetchDBInfo().then((data) => { $scope.dbList = data; });
      DataManager.fetchLayerInfo().then((data) => { $scope.layerList = data; });
      $scope.attrList = Global.getAttrList();
      $scope.$watch('selectedDB', function (newValue, oldValue) {
        if (newValue === oldValue) { return; }
        $scope.widList = _.range($scope.selectedDB.wnumber);
      });

      $scope.data = [];
      $scope.options = {
        height: 450,
        margin: {
          top: 20,
          right: 20,
          bottom: 100,
          left: 100
        }
      };

      $scope.clean = function () {
        $scope.data = [];
      };

      $scope.add = function () {
        let ps = [];
        let attrs = [$scope.xAttr, $scope.yAttr];
        for (let attr of attrs) {
          let opt = {
            db: $scope.selectedDB.name,
            type: attr,
            attr: attr,
            layer: $scope.selectedLayer
          };
          ps.push(DataManager.fetchLayer(opt, true));
        };
        $q.all(ps).then((values: any[]) => {
          let result = [];
          let len = values[0].length;
          for (let i = 0; i < len; i += 1) {
            result.push({
              iter: values[0][i].iter,
              values: {
                x: values[0][i].value[$scope.selectedLayer],
                y: values[1][i].value[$scope.selectedLayer]
              }
            });
          }
          return result;
        }).then((data: ITimePathDataEle[]) => {
          data.splice(0, 5);
          data = _.chain(data)
            .sampleSize(100)
            .sortBy('iter')
            .value();
          // let [min, max] = [
          //   d3.min(data, o => o.values.whisker_low),
          //   d3.max(data, o => o.values.whisker_high)
          // ];
          // console.log(min, max);
          $scope.data = data;
        });
      };

    }
  }

  angular
    .module('vis')
    .controller('TimePathController', TimePathController);
}
