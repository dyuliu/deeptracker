'use strict';

namespace application {

  interface IScope extends ng.IScope {
    optionsHeatLine: any;
    optionsDetail: any;
    optionsCls: {};
    dataModel: any;
    dataCls: any;
    dataDetail: any;
    selectedCls: any[];
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'DataManager', 'Global', '$q', 'Pip'
    ];

    constructor(
      public $scope: IScope,
      public DataManager: IDataManagerService,
      public Global: IGlobalService,
      public $q: ng.IQService,
      public Pip: IPipService
    ) {
      let this_ = this;

      Pip.onTimeChanged($scope, (iter) => {
        console.log('select iter: ', iter);
      });
      Pip.onModelChanged($scope, (msg) => {
        console.log('act label fetch cls_stat');
        act();
      });

      function act() {
        $scope.optionsHeatLine = this_._setOptions('heatline');
        $scope.optionsDetail = this_._setOptions('pixelChartWithLine');

        let bd = Global.getData();

        let optClsStat: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'cls_stat',
          seqidx: [49],
          cls: [],
          parser: 'json'
        };

        $scope.dataModel = {
          heatmapData: bd.record.testError,
          linechartData: bd.label.modelStat,
          max: d4.max(bd.label.modelStat, (d: any) => d.value)
        };
        DataManager.fetchImg(optClsStat, false).then(data => {
          $scope.optionsCls = {};
          $scope.dataCls = this_._processData('cls_heatline', data, $scope.dataModel.max);
          let kk = [];
          _.each($scope.dataCls, (d: any, k) => {
            $scope.optionsCls[k] = this_._setOptions('heatline');
            $scope.optionsCls[k].height = d.pmax / d.max * 1000;
            kk.push({ key: k, value: d.pmax / d.max });
          });
          kk = _.sortBy(kk, ['value']);
          kk = _.slice(kk, kk.length - 100, kk.length);
          kk = _.map(kk, d => { return { name: d.key }; });
          kk = _.reverse(kk);
          $scope.selectedCls = kk;

          // $scope.dataClsDetail = this_._processData('cls_pchartwithline');
          // $scope.dataCls = {
          //   testError: _.map(data[2], (d: any) => {
          //     return {iter: d.iter, value: d.testError};
          //   }),
          //   abnormal: _.map(data[2], (d: any) => {
          //     return {iter: d.iter, value: d.value};
          //   }),
          //   max: $scope.dataModel.max
          // };

          // let pixelChart: any = _.map(data[3], (d: any) => {
          //   let correct = _.map(d.answer, o => o === d.label ? 1 : 0);
          //   return {iter: d.iter, value: correct, file: d.file};
          // });
          // let distMatrix = [];
          // let pLength = pixelChart.length;
          // let max = -1;
          // for (let i = 0; i < pLength; i += 1) {
          //   distMatrix.push(Array(pLength).fill(0));
          //   distMatrix[i][i] = 0;
          //   for (let j = i - 1; j >= 0; j -= 1) { distMatrix[i][j] = distMatrix[j][i]; }
          //   for (let j = i + 1; j < pLength; j += 1) {
          //     distMatrix[i][j] = computeDist(pixelChart[i].value, pixelChart[j].value);
          //     if (distMatrix[i][j] > max) { max = distMatrix[i][j]; }
          //   }
          // }
          // let fs = d4.scaleLinear().range([0, 1]).domain([0, max]).clamp(true);
          // for (let i = 0; i < pLength; i += 1) {
          //   for (let j = 0; j < pLength; j += 1) {
          //     distMatrix[i][j] = fs(distMatrix[i][j]);
          //   }
          // }
          // let coordinate = _.map(LG.utils.Mds.mds(distMatrix, 1), (d, i) => {
          //   return [i, d[0]];
          // });
          // coordinate = _.sortBy(coordinate, d => d[1]);
          // for (let i = 0; i < pixelChart.length; i += 1) { pixelChart[i].index = coordinate[i][0]; }
          // $scope.dataDetail = {
          //   pixelChart: pixelChart,
          //   lineChart: $scope.dataCls.testError
          // };
        });
      }



      // function computeDist(veca, vecb) {
      //   let size = veca.length;
      //   let dist = 0;
      //   for (let i = 0; i < size; i += 1) {
      //     dist += veca[i] !== vecb[i] ? 1 : 0;
      //   }
      //   return dist;
      // }

      // function computeDist2(veca, vecb) {
      //   let da = numeric.norm2(veca);
      //   let db = numeric.norm2(vecb);
      //   if (da !== 0 && db !== 0) { return 1 - numeric.dot(veca, vecb) / (norm2(veca) * norm2(vecb)); }
      //   return 1;
      // }

      $('#widget-container-labelinfo')
        .mouseenter(function () {
          $('#widget-container-labelinfo .widget-header:first-child').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-labelinfo .widget-header:first-child').addClass('invisible');
        });
    }
    // end of constructor

    private _processData(type, ...rest: any[]) {
      let this_ = this;
      let result = {};
      let data, max;
      switch (type) {
        case 'cls_heatline':
          [data, max] = [rest[0], rest[1]];
          for (let d of data) {
            if (!result[d.cls]) {
              result[d.cls] = { heatmapData: [], linechartData: [], max, pmax: -1 };
            }
            result[d.cls].heatmapData.push({ iter: d.iter, value: d.testError });
            result[d.cls].linechartData.push({ iter: d.iter, value: d.value });
            result[d.cls].pmax = result[d.cls].pmax < d.value ? d.value : result[d.cls].pmax;
          }
          _.each(result, (d: any) => {
            d.heatmapData = _.sortBy(d.heatmapData, ['iter']);
            d.linechartData = _.sortBy(d.linechartData, ['iter']);
          });
          return result;
        default:
          break;
      }
    }

    private _setOptions(type) {
      let options;
      switch (type) {
        case 'heatline':
          options = {
            width: 2800,
            height: 1000,
            cellWidth: 1,
            margin: {
              top: 2,
              right: 0,
              bottom: 2,
              left: 0
            }
          };
          break;
        case 'pixelChartWithLine':
          options = {
            width: 900,
            height: 1000,
            cellWidth: 1,
            pixelChart: true,
            linechart: true,
            margin: {
              top: 2,
              right: 0,
              bottom: 2,
              left: 0
            }
          };
      }
      return options;
    }


  }
  angular
    .module('vis')
    .controller('LabelController', Controller);
}


// let optDetail: IHTTPOptionConfig = {
//   db: Global.getSelectedDB(),
//   type: 'detail',
//   cls: ['n01498041'],
//   parser: 'json'
// };

// DataManager.fetchImg(optDetail, false)
