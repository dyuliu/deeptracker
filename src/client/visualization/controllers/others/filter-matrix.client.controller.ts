'use strict';

namespace application {

  export interface IFilterMatrixDataEle {
    iter: number;
    cid: number;
    points: any;
  }

  interface IFilterMatrixCtrlScope extends ng.IScope {
    selectedDB: IDBListEle;
    selectedLayer: number;
    selectedIter: number;
    dbList: IDBListEle[];
    layerList: ILayerListEle[];
    data: IFilterMatrixDataEle[];
    options: any;
    add(): void; // button for adding data to chart
    clean(): void; // clean current data in chart
  }

  export class FilterMatrixController {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor($scope: IFilterMatrixCtrlScope, DataManager: IDataManagerService, Global: IGlobalService, $q: ng.IQService) {

      DataManager.fetchDBInfo().then((data) => { $scope.dbList = data; });
      DataManager.fetchLayerInfo().then((data) => { $scope.layerList = data; });

      $scope.data = [];
      $scope.options = {
        height: 1500,
        columnNum: 12,
        matrixSize: 50,
        groupSpacing: 10,
        matrixSpacing: 3,
        margin: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      };

      $scope.clean = function () {
        $scope.data = [];
      };

      $scope.add = function () {
        let query = {
          db: $scope.selectedDB.name,
          iter: $scope.selectedIter,
          wid: 0,
          lid: $scope.selectedLayer
        };
        DataManager.fetchKernel(query).then((values: any[]) => {
          $scope.data = values;
        });
      };

    }
  }

  angular
    .module('vis')
    .controller('FilterMatrixController', FilterMatrixController);
}
