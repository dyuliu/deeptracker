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
    open: any;
    flip: any;
    click: any;
    showModal: any;
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'DataManager', 'Global', '$q',
      'Pip', '$timeout', '$modal', '$rootScope'
    ];

    constructor(
      public $scope: IScope,
      public DataManager: IDataManagerService,
      public Global: IGlobalService,
      public $q: ng.IQService,
      public Pip: IPipService,
      public $timeout: ng.ITimeoutService,
      public $modal,
      public $rootScope
    ) {
      let this_ = this;
      let first;

      let previous_conf = null;
      this_._init();
      let modal = $modal({
        scope: $scope,
        templateUrl: 'src/client/visualization/views/tpls/img-modal.client.tpls.html',
        show: false,
        controller: 'ImgModalController'
      });

      $scope.showModal = function (name) {
        modal.$scope.clsName = name;
        modal.$promise.then(modal.show);
      };

      $scope.click = function (type: string, clsName?: string) {
        if (type === 'open') {
          $scope.open = !$scope.open;
          if ($scope.open) {
            // $scope.selectedCls = Global.getData('info').cls;
            // fetch dataCls
          }
        } else if (type === 'flip') {
          $scope.flip[clsName] = !$scope.flip[clsName];
          if ($scope.flip[clsName]) {
            showDetail(clsName);
          }
        }
      };

      Pip.onTimeChanged($scope, (iter) => {
        console.log('select iter: ', iter);
      });
      Pip.onModelChanged($scope, (msg) => {
        first = true;
        // act();
      });
      Pip.onLabelConfigChanged($scope, (conf: any) => {
        if (conf.show === true) { act(conf); }
      });

      function showDetail(clsName: string) {
        DataManager.fetchImg({
          db: Global.getSelectedDB(),
          type: 'detail',
          cls: [clsName],
          parser: 'json'
        }, false).then((data: any) => {
          console.log(data);

          let pixelChart: any = _.map(data, (d: any) => {
            let correct = _.map(d.answer, o => o === d.label ? 1 : 0);
            return { iter: d.iter, value: correct, file: d.file };
          });

          for (let i = 0; i < pixelChart.length; i += 1) { pixelChart[i].index = i; }
          $scope.optionsDetail[clsName] = this_._setOptions('pixelChartWithLine', pixelChart.length + 5);
          $scope.dataDetail[clsName] = {
            pixelChart: pixelChart,
            lineChart: $scope.dataCls[clsName].heatmapData
          };
        });
      }

      function act(conf) {
        if (first) {
          console.log('first processing data');
          $scope.optionsHeatLine = this_._setOptions('heatline');
          let gd = Global.getData();

          $scope.dataModel = {
            heatmapData: Global.getData('record').testError,
            linechartData: gd.label.modelStat,
            max: d4.max(gd.label.modelStat, (d: any) => d.value)
          };

          $scope.optionsCls = {};
          $scope.dataCls = this_._processData('cls_heatline', gd.label.clsStat, $scope.dataModel.max);
          gd.label.clsStat = null;

          first = false;
        }

        console.log('mds calc');
        let selectedCls = [];
        _.each($scope.dataCls, (d: any, k) => {
          if (d.pmax >= conf.threshold) {
            $scope.optionsCls[k] = this_._setOptions('heatline');
            selectedCls.push({ name: k, pmax: d.pmax });
          }
        });
        if (conf.mds) {
          let tmp = [];
          _.each(selectedCls, d => {
            let v = _.map($scope.dataCls[d.name].heatmapData, (o: any) => o.value);
            tmp.push({ name: d.name, value: v });
          });
          $scope.selectedCls = mdsLayout(tmp);
        } else {
          $scope.selectedCls = _.reverse(_.sortBy(selectedCls, ['pmax']));
        }

      }

      function mdsLayout(data) {
        let result = [];
        let distMatrix = [];
        let length = data.length;
        let max = -1;
        for (let i = 0; i < length; i += 1) {
          distMatrix.push(Array(length).fill(0));
          distMatrix[i][i] = 0;
          for (let j = i - 1; j >= 0; j -= 1) { distMatrix[i][j] = distMatrix[j][i]; }
          for (let j = i + 1; j < length; j += 1) {
            distMatrix[i][j] = computeDist2(data[i].value, data[j].value);
            if (distMatrix[i][j] > max) { max = distMatrix[i][j]; }
          }
        }

        let fs = d4.scaleLinear().range([0, 1]).domain([0, max]).clamp(true);
        for (let i = 0; i < length; i += 1) {
          for (let j = 0; j < length; j += 1) {
            distMatrix[i][j] = fs(distMatrix[i][j]);
          }
        }
        let coordinate = _.map(LG.utils.Mds.mds(distMatrix, 1), (d, i) => {
          return [i, d[0]];
        });
        coordinate = _.sortBy(coordinate, d => d[1]);
        for (let i = 0; i < data.length; i += 1) {
          let idx = coordinate[i][0];
          result.push({ name: data[idx].name, pmax: data[idx.pmax] });
        }
        return result;

      }

      function computeDist(va, vb) {
        let size = va.length;
        let dist = 0;
        for (let i = 0; i < size; i += 1) {
          dist += va[i] !== vb[i] ? 1 : 0;
        }
        return dist;
      }

      // cos
      function computeDist2(va, vb) {
        let nva = numeric.norm2(va);
        let nvb = numeric.norm2(vb);
        if (nva !== 0 && nvb !== 0) {
          return 1 - numeric.dot(va, vb) / (numeric.norm2(va) * numeric.norm2(vb));
        }
        return 1;
      }

    }
    // end of constructor

    private _init() {

      let this_ = this;
      let cls = this_.Global.getData('info').cls;
      this_.$scope.open = false;
      this_.$scope.flip = {};
      this_.$scope.optionsDetail = {};
      _.each(cls, c => {
        this_.$scope.flip[c.name] = false;
      });
      this_.$scope.dataDetail = {};

      this_.$timeout(function () {
        $('#widget-container-labelinfo .scrollable').each(function () {
          let $this = $(this);
          $(this).ace_scroll({
            size: $this.attr('data-size') || 100,
          });
        });
      }, 100);

      $('#widget-container-labelinfo')
        .mouseenter(function () {
          $('#widget-container-labelinfo .widget-header:first-child').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-labelinfo .widget-header:first-child').addClass('invisible');
        });
    }
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
        case 'cls_pixelchart':
          break;
        default:
          break;
      }
    }

    private _setOptions(type, height?) {
      let options;
      switch (type) {
        case 'heatline':
          options = {
            width: 2000,
            height: height ? height : 18,
            cellWidth: 1,
            margin: {
              top: 0,
              right: 0,
              bottom: 2,
              left: 0
            },
            lineChart: false
          };
          break;
        case 'pixelChartWithLine':
          options = {
            width: 2000,
            height: height ? height : 18,
            cellWidth: 1,
            pixelChart: true,
            lineChart: true,
            margin: {
              top: 0,
              right: 0,
              bottom: 5,
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
