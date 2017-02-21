'use strict';

namespace application {

  interface IScope extends ng.IScope {
    optionsHeatLine: any;
    optionsDetail: any;
    dataModel: any;
    dataCls: any;
    dataDetail: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService,
      public $q: ng.IQService
    ) {
      let this_ = this;

      $('#widget-container-labelinfo')
        .mouseenter(function () {
          $('#widget-container-labelinfo .widget-header:first-child').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-labelinfo .widget-header:first-child').addClass('invisible');
        });

      let optTestError: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'test_error',
        parser: 'json'
      };
      let optStat: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'model_stat',
        parser: 'json'
      };
      let optClsStat: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'cls_stat',
        cls: 'n01498041',
        parser: 'json'
      };
      let optDetail: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'detail',
        cls: 'n01498041',
        parser: 'json'
      };
      $q.all([
        DataManager.fetchRecord(optTestError),
        DataManager.fetchImg(optStat, false),
        DataManager.fetchImg(optClsStat, false),
        DataManager.fetchImg(optDetail, false)
      ]).then(data => {
        $scope.dataModel = {
          testError: data[0],
          abnormal: _.map(data[1], (d: any) => {
            return {iter: d.iter, value: d.abLeft};
          }),
          max: d4.max(data[1], (d: any) => d.abLeft)
        };
        $scope.dataCls = {
          testError: _.map(data[2], (d: any) => {
            return {iter: d.iter, value: d.testError};
          }),
          abnormal: _.map(data[2], (d: any) => {
            return {iter: d.iter, value: d.abLeft};
          }),
          max: $scope.dataModel.max
        };

        let pixelChart: any = _.map(data[3], (d: any) => {
          let correct = _.map(d.answer, o => o === d.label ? 1 : 0);
          return {iter: d.iter, value: correct, file: d.file};
        });
        let distMatrix = [];
        let pLength = pixelChart.length;
        let max = -1;
        for (let i = 0; i < pLength; i += 1) {
          distMatrix.push(Array(pLength).fill(0));
          distMatrix[i][i] = 0;
          for (let j = i - 1; j >= 0; j -= 1) { distMatrix[i][j] = distMatrix[j][i]; }
          for (let j = i + 1; j < pLength; j += 1) {
            distMatrix[i][j] = computeDist(pixelChart[i].value, pixelChart[j].value);
            if (distMatrix[i][j] > max) { max = distMatrix[i][j]; }
          }
        }
        let fs = d4.scaleLinear().range([0, 1]).domain([0, max]).clamp(true);
        for (let i = 0; i < pLength; i += 1) {
          for (let j = 0; j < pLength; j += 1) {
            distMatrix[i][j] = fs(distMatrix[i][j]);
          }
        }
        let coordinate = _.map(LG.utils.Mds.mds(distMatrix, 1), (d, i) => {
          return [i, d[0]];
        });
        coordinate = _.sortBy(coordinate, d => d[1]);
        for (let i = 0; i < pixelChart.length; i += 1) { pixelChart[i].index = coordinate[i][0]; }
        $scope.dataDetail = {
          pixelChart: pixelChart,
          lineChart: $scope.dataCls.testError
        };
      });

      function computeDist (veca, vecb) {
        let size = veca.length;
        let dist = 0;
        for (let i = 0; i < size; i += 1) {
          dist += veca[i] !== vecb[i] ? 1 : 0;
        }
        return dist;
      }

      function computeDist2 (veca, vecb) {
        let da = numeric.norm2(veca);
        let db = numeric.norm2(vecb);
        if (da !== 0 && db !== 0) { return  1 - numeric.dot(veca, vecb) / ( norm2(veca) * norm2(vecb) ); }
        return 1;
      }

      $scope.optionsHeatLine = {
        width: 900,
        height: 70,
        cellWidth: 1,
        margin: {
          top: 10,
          right: 0,
          bottom: 10,
          left: 0
        }
      };
      $scope.optionsDetail = {
        width: 900,
        height: 70,
        cellWidth: 1,
        margin: {
          top: 10,
          right: 0,
          bottom: 10,
          left: 0
        }
      };
    }
    // end of constructor

  }
  angular
    .module('vis')
    .controller('LabelController', Controller);
}
