'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
    selectedDB: IInfoDBEle;
    typeList: string[];
    selectedType: { value: string };
    chartTypeList: string[];
    selectedChartType?: { value: string };
    dataLr: IRecordDataType;  // nvd3 chart data
    dataError: IRecordDataType;  // nvd3 chart data
    dataLoss: IRecordDataType;  // nvd3 chart data
    options: any;  // nvd3 chart config
    config?: any;
    api?: any;
    render(): void; // button for adding data to chart
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      public Global: IGlobalService,
      $q: ng.IQService
    ) {
      let this_ = this;

      $scope.options = this_._setOption('sparklinePlus');

      let db = Global.getSelectedDB(), parser = 'json';
      $q.all([
        DataManager.fetchRecord({db, type: 'lr', parser}),
        DataManager.fetchRecord({db, type: 'test_error', parser}),
        DataManager.fetchRecord({db, type: 'train_error', parser}),
        DataManager.fetchRecord({db, type: 'test_loss', parser}),
        DataManager.fetchRecord({db, type: 'train_loss', parser})
      ]).then((data: any) => {
        // do some
        $scope.dataLr = this_._process(data[0]);
        $scope.dataError = this_._process(data[1]);
        $scope.dataLoss = this_._process(data[3]);
      });

      $('#widget-container-recordinfo')
        .mouseenter(function () {
          $('#widget-container-recordinfo .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-recordinfo .widget-header').addClass('invisible');
        });
    }

    private _process(data: IRecordDataType) {
      let this_ = this;
      let result;
      data = _.sortBy(data, 'iter');
      result = _.map(data, (d: IRecordEle) => {
        return {
          x: d.iter,
          y: d.value
        };
      });
      return result;
    }

    private _setOption(type) {
      let options;
      switch (type) {
        case 'sparklinePlus':
          options = {
            chart: {
              type: 'sparklinePlus',
              height: 60,
              width: 757,
              margin: {
                left: 0,
                right: 0,
                top: 5,
                bottom: 5
              },
              color: function (d, i) { return '#4682b4'; },
              // yDomain: [0, 50],
              x: function (d, i) { return d.x; },
              y: function (d, i) { return d.y; },
              xTickFormat: function (d) {
                return d;
              },
              duration: 250
            }
          };
          break;
        case 'lineChart':
          options = {
            chart: {
              type: 'lineChart',
              color: d3.scale.category10().range(),
              width: 757,
              height: 100,
              margin: {
                top: 5,
                right: 0,
                bottom: 5,
                left: 0
              },
              noData: ' ',
              x: function (d) { return d.x; },
              y: function (d) { return d.y; },
              useInteractiveGuideline: true,
              xAxis: {
                axisLabel: 'Time (Iter)'
              },
              yAxis: {
                axisLabel: 'Outlier',
                tickFormat: function (d) {
                  return d3.format(',')(d);
                },
                axisLabelDistance: -10
              }
            }
          };
          break;
        case 'lineWithFocusChart':
          options = {
            chart: {
              type: 'lineWithFocusChart',
              color: d3.scale.category10().range(),
              height: 300,
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
