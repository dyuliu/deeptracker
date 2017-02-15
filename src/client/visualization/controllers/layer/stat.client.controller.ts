'use strict';

namespace application {

  interface Iscope extends ng.IScope {
    dbList: IInfoDBDataType;
    layerList: IInfoLayerDataType;
    typeList: string[];
    selectedDB: IInfoDBEle;
    selectedLayer: number;
    selectedType: { value: string };
    chartTypeList: string[];
    selectedChartType?: { value: string };
    data: any[];  // nvd3 chart data
    options: any;  // nvd3 chart config
    config?: any;
    api?: any;
    ca?: any;
    render(): void; // button for adding data to chart
    clean(): void; // clean current data in chart
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor(
      public $scope: Iscope,
      DataManager: IDataManagerService,
      Global: IGlobalService,
      $q: ng.IQService
    ) {
      let this_ = this;

      DataManager.fetchInfo({ type: 'db' }).then(data => {
        $scope.dbList = data;
        $scope.selectedDB = data[0];
      });
      DataManager.fetchInfo({ type: 'layer' }).then(data => {
        $scope.layerList = data;
        // $scope.selectedLayer = [data[0]];
      });
      $scope.typeList = Global.getLayerTypeList().weight
        .concat(Global.getLayerTypeList().gradient);
      $scope.chartTypeList = [
        'lineWithFocusChart', 'boxPlotChart',
      ];
      $scope.data = [];
      $scope.selectedChartType = { value: null };
      $scope.ca = (ctype) => { $scope.selectedChartType.value = ctype; };
      $scope.$watch('selectedChartType', (n, o) => {
        if (n === o) { return; }
        $scope.clean();
        $scope.options = this_._setOption(n);
      }, true);


      $scope.config = {
        extended: false, // default: false
        disabled: false, // default: false
        refreshDataOnly: true
      };

      $scope.clean = function () {
        $scope.data = [];
      };

      $scope.render = function () {
        if ($scope.selectedChartType.value === 'lineWithFocusChart') {
          let opt: IHTTPOptionConfig = {
            db: $scope.selectedDB.name,
            type: $scope.selectedType.value,
            layer: [$scope.selectedLayer],
            parser: 'json'
          };
          DataManager.fetchLayer(opt, false)
            .then((data: ILayerEle[]) => {
              $scope.data.push(this_._process(data));
              if ($scope.data.length === 1) { $scope.api.refresh(); };
            });
        } else if ($scope.selectedChartType.value === 'boxPlotChart') {
          let ps = [];
          let types = ['g_min', 'g_quarter1', 'g_mean', 'g_quarter3', 'g_max'];
          for (let type of types) {
            let opt: IHTTPOptionConfig = {
              db: $scope.selectedDB.name,
              type: type,
              layer: [$scope.selectedLayer],
              parser: 'json'
            };
            ps.push(DataManager.fetchLayer(opt, false));
          };
          $q.all(ps).then((values: any[]) => {
            let result = [];
            let len = values[0].length;
            for (let i = 0; i < len; i += 1) {
              result.push({
                label: values[0][i].iter,
                values: {
                  whisker_low: values[0][i].value[$scope.selectedLayer],
                  Q1: values[1][i].value[$scope.selectedLayer],
                  Q2: values[2][i].value[$scope.selectedLayer],
                  Q3: values[3][i].value[$scope.selectedLayer],
                  whisker_high: values[4][i].value[$scope.selectedLayer]
                }
              });
            }
            return result;
          }).then((data) => {
            data.splice(0, 10);
            data = _.chain(data)
              .sampleSize(100)
              .sortBy('label')
              .value();
            let [min, max] = [
              d3.min(data, o => o.values.whisker_low),
              d3.max(data, o => o.values.whisker_high)
            ];
            $scope.options.chart.yDomain = [min, max];
            $scope.data = data;
            console.log($scope.data);
            $scope.api.refresh();
          });
        };
      };
    }

    private _process(data: ILayerDataType) {
      let this_ = this;
      let [dbName, type, layer, dataLen] = [
        this_.$scope.selectedDB.name,
        this_.$scope.selectedChartType.value,
        this_.$scope.selectedLayer,
        this_.$scope.data.length
      ];
      data.splice(0, 10);
      let result: any = { key: dbName + '_' + type};
      data = _.sortBy(data, 'iter');
      result.values = _.map(data, (o: ILayerEle) => {
        return {
          x: o.iter,
          y: o.value[layer]
        };
      });
      let t = this_.$scope.selectedType.value;
      if (t === 'w_norm1' || t === 'w_norm2' ||
        t === 'g_norm1' || t === 'g_norm2') {
          let d = _.find(this_.$scope.layerList, o => o.lid === layer);
          let size = d.channels * d.kernelNum * d.kernelHeight * d.kernelWidth;
          let len = result.values.length;
          for (let i = 0; i < len; i += 1) {
            result.values[i].y /= size;
          }
      }
      // console.log(result);
      return result;
    }

    private _setOption(type) {
      let options;
      switch (type.value) {
        case 'lineWithFocusChart':
          options = {
            chart: {
              type: 'lineWithFocusChart',
              color: d3.scale.category10().range(),
              height: 450,
              margin: {
                top: 20,
                right: 20,
                bottom: 100,
                left: 100
              },
              duration: 50,
              tooltipContent: function (key) {
                return '<h3>' + key + '</h3>';
              },
              xAxis: {
                axisLabel: 'Iteration',
                tickFormat: function (d) {
                  return d;
                }
              },
              x2Axis: {
                tickFormat: function (d) {
                  return d;
                }
              },
              yAxis: {
                axisLabel: 'Value',
                tickFormat: function (d) {
                  return d3.format('.8f')(d);
                },
                rotateYLabel: false
              },
              y2Axis: {
                tickFormat: function (d) {
                  return d3.format('.8f')(d);
                }
              }
            }
          };
          break;
        case 'boxPlotChart':
          options = {
            chart: {
              type: 'boxPlotChart',
              height: 450,
              margin: {
                top: 20,
                right: 20,
                bottom: 100,
                left: 100
              },
              color: ['green'],
              x: function (d) { return d.label; },
              xAxis: {
                showMaxMin: true,
                fontSize: 0
              },
              yAxis: {
                tickFormat: function (d) {
                  return d3.format(',.3f')(d);
                }
              },
              maxBoxWidth: 75,
              yDomain: [0, 500]
            }
          };
          break;
      }
      return options;
    }
  }

  angular
    .module('vis')
    .controller('StatController', Controller);
}
