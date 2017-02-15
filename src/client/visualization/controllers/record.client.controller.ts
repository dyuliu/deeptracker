'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
    selectedDB: IInfoDBEle;
    typeList: string[];
    selectedType: { value: string };
    chartTypeList: string[];
    selectedChartType?: {value: string};
    data: IRecordDataType;  // nvd3 chart data
    options: any;  // nvd3 chart config
    config?: any;
    api?: any;
    ca?: any;
    render(): void; // button for adding data to chart
    clean(): void;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService
    ) {
      let this_ = this;

      DataManager.fetchInfo({ type: 'db' }).then(data => {
        $scope.dbList = data;
        $scope.selectedDB = data[0];
      });
      $scope.typeList = Global.getRecordTypeList();
      $scope.chartTypeList = [
        'lineWithFocusChart', 'scatterChart',
        'multiBarChart', 'stackedAreaChart'
      ];
      $scope.data = [];
      $scope.selectedChartType = {value: null};
      $scope.ca = (ctype) => {  $scope.selectedChartType.value = ctype; };
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

      $scope.render = function () {
        let opt: IHTTPOptionConfig = {
          db: $scope.selectedDB.name,
          type: $scope.selectedType.value,
          parser: 'json'
        };
        DataManager
          .fetchRecord(opt)
          .then(data => {
            // process data before using them
            $scope.data.push(this_._process(data));
            if ($scope.data.length === 1 || $scope.selectedChartType.value === 'stackedAreaChart') { $scope.api.refresh(); };
          });

      };

      $scope.clean = function () {
        $scope.data = [];
      };
    }

    private _process(data: IRecordDataType) {
      let this_ = this;
      let [dbName, type] = [this_.$scope.selectedDB.name, this_.$scope.selectedChartType];
      let dataLenth = this_.$scope.data.length;
      let result: any = { key: dbName + '_' + type.value };
      data = _.sortBy(data, 'iter');
      switch (type.value) {
        case 'lineWithFocusChart':
          result.values = _.map(data, (o: IRecordEle) => {
            return {
              x: o.iter,
              y: o.value
            };
          });
          break;
        case 'scatterChart':
          let shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'];
          result.values = _.map(data, (o: IRecordEle) => {
            return {
              shape: shapes[dataLenth % 6],
              size: 0.5,
              x: o.iter,
              y: o.value
            };
          });
          break;
        case 'multiBarChart':
          result.values = _.map(data, (o: IRecordEle) => {
            return {
              x: o.iter,
              y: o.value
            };
          });
          break;
        case 'stackedAreaChart':
          let colors = d4.scaleOrdinal(d3.schemeCategory10);
          result.color = colors[dataLenth % 10];
          result.values = _.map(data, (o: IRecordEle) => {
            return [o.iter, o.value];
          });
          break;
      }
      return result;
    }

    private _setOption(type) {
      let options;
      switch (type.value) {
        case 'lineWithFocusChart':
          options = {
            chart: {
              type: 'lineWithFocusChart',
              height: 450,
              margin: {
                top: 20,
                right: 20,
                bottom: 60,
                left: 40
              },
              duration: 500,
              useInteractiveGuideline: true
            }
          };
          break;
        case 'scatterChart':
          options = {
            chart: {
              type: 'scatterChart',
              height: 450,
              color: d3.scale.category10().range(),
              scatter: {
                onlyCircles: false
              },
              showDistX: false,
              showDistY: true,
              tooltipContent: function (key) {
                return '<h3>' + key + '</h3>';
              },
              duration: 350,
              xAxis: {
                axisLabel: 'Iteration',
                tickFormat: function (d) {
                  return d;
                }
              },
              yAxis: {
                axisLabel: 'Value',
                tickFormat: function (d) {
                  return d3.format('.02f')(d);
                },
                axisLabelDistance: -5
              },
              zoom: {
                enabled: true,
                scale: 1,
                scaleExtent: [1, 5],
                useFixedDomain: false,
                useNiceScale: true,
                horizontalOff: false,
                verticalOff: false,
                unzoomEventType: 'dblclick.zoom'
              }
            }
          };
          break;
        case 'multiBarChart':
          options = {
            chart: {
              type: 'multiBarChart',
              color: d3.scale.category10().range(),
              height: 450,
              margin: {
                top: 20,
                right: 20,
                bottom: 45,
                left: 45
              },
              clipEdge: true,
              duration: 500,
              stacked: false,
              xAxis: {
                showMaxMin: false,
                axisLabel: 'Iteration',
                tickFormat: function (d) {
                  return d;
                }
              },
              yAxis: {
                axisLabel: 'Value',
                tickFormat: function (d) {
                  return d3.format('.02f')(d);
                },
                axisLabelDistance: -5
              },
              zoom: {
                enabled: true,
                scale: 1,
                scaleExtent: [1, 5],
                useFixedDomain: false,
                useNiceScale: true,
                horizontalOff: false,
                verticalOff: false,
                unzoomEventType: 'dblclick.zoom'
              }
            }
          };
          break;
        case 'stackedAreaChart':
          options = {
            chart: {
              type: 'stackedAreaChart',
              color: d3.scale.category10().range(),
              height: 500,
              margin: {
                top: 20,
                right: 20,
                bottom: 100,
                left: 100
              },
              x: function (d) { return d[0]; },
              y: function (d) { return d[1]; },
              useVoronoi: true,
              clipEdge: true,
              duration: 100,
              useInteractiveGuideline: true,
              xAxis: {
                showMaxMin: false,
                axisLabel: 'Iteration',
                tickFormat: function (d) {
                  return d;
                }
              },
              yAxis: {
                axisLabel: 'Value',
                showMaxMin: true,
                tickFormat: function (d) {
                  return d3.format('.02f')(d);
                },
                axisLabelDistance: -5
              },
              zoom: {
                enabled: false,
                scale: 1,
                scaleExtent: [1, 5],
                useFixedDomain: false,
                useNiceScale: false,
                horizontalOff: false,
                verticalOff: false,
                unzoomEventType: 'dblclick.zoom'
              }
            }
          };
          break;
        default:
          alert('please choose one type of chart');
      }
      return options;
    }
  }

  angular
    .module('vis')
    .controller('RecordController', Controller);
}
