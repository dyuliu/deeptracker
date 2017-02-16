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

      $scope.selectedChartType = { value: 'lineChart' };
      $scope.options = this_._setOption($scope.selectedChartType);
      // $scope.config = {
      //   extended: false, // default: false
      //   disabled: false, // default: false
      //   refreshDataOnly: true
      // };

      $scope.dataError = [];
      $scope.dataLr = [];
      $scope.dataLoss = [];
      $scope.selectedType = { value: null };
      $scope.$watch('selectedType.value', function (n, o) {
        console.log(n);
      });

      $scope.render = function () {

        $scope.options.chart.height = 250;

        let opt: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'lr',
          parser: 'json'
        };
        DataManager.fetchRecord(opt)
          .then(data => {
            $scope.dataLr.push(this_._process(data));
          });

        let opt1: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'test_error',
          parser: 'json'
        };
        let opt2: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'train_error',
          parser: 'json'
        };
        $q.all([DataManager.fetchRecord(opt1), DataManager.fetchRecord(opt2)])
          .then(data => {
            $scope.dataError = [this_._process(data[0]), this_._process(data[1])];
          });

        let opt3: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'test_loss',
          parser: 'json'
        };
        let opt4: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'train_loss',
          parser: 'json'
        };
        $q.all([DataManager.fetchRecord(opt3), DataManager.fetchRecord(opt4)])
          .then(data => {
            $scope.dataLoss = [this_._process(data[0]), this_._process(data[1])];
          });
      };
    }

    private _process(data: IRecordDataType) {
      let this_ = this;
      let [dbName, type] = [this_.Global.getSelectedDB(), this_.$scope.selectedChartType];
      let dataLenth = data.length;
      let result: any = { key: dbName + '_' + type.value };
      data = _.sortBy(data, 'iter');
      switch (type.value) {
        case 'lineChart':
          result.values = _.map(data, (o: IRecordEle) => {
            return {
              x: o.iter,
              y: o.value
            };
          });
          break;
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
        case 'lineChart':
          options = {
            chart: {
              type: 'lineChart',
              color: d3.scale.category10().range(),
              width: 964,
              height: 20,
              margin: {
                top: 20,
                right: 40,
                bottom: 60,
                left: 170
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


// 'use strict';

// namespace application {

//   interface IScope extends ng.IScope {
//     dbList: IInfoDBDataType;
//     selectedDB: IInfoDBEle;
//     typeList: string[];
//     selectedType: { value: string };
//     chartTypeList: string[];
//     selectedChartType?: {value: string};
//     dataLr: IRecordDataType;  // nvd3 chart data
//     dataError: IRecordDataType;  // nvd3 chart data
//     dataLoss: IRecordDataType;  // nvd3 chart data
//     options: any;  // nvd3 chart config
//     config?: any;
//     api?: any;
//     ca?: any;
//     render(): void; // button for adding data to chart
//     clean(): void;
//   }

//   class Controller {
//     public static $inject: string[] = ['$scope', 'DataManager', 'Global'];

//     constructor(
//       public $scope: IScope,
//       DataManager: IDataManagerService,
//       public Global: IGlobalService
//     ) {
//       let this_ = this;

//       $scope.dataError = [];
//       $scope.dataLr = [];
//       $scope.dataLoss = [];

//       $scope.config = {
//         extended: false, // default: false
//         disabled: false, // default: false
//         refreshDataOnly: true
//       };

//       $scope.options = this_._setOption({value: 'lineWithFocusChart'});

//       $scope.render = function () {
//         let opt: IHTTPOptionConfig = {
//           db: Global.getSelectedDB(),
//           type: 'test_error',
//           parser: 'json'
//         };
//         DataManager
//           .fetchRecord(opt)
//           .then(data => {
//             console.log(data);
//             $scope.dataLr.push(this_._process(data));
//             console.log($scope.dataLr);
//             if ($scope.dataLr.length === 1) { $scope.api.refresh(); };
//           });

//         // opt.type = 'test_error';
//         // DataManager
//         //   .fetchRecord(opt)
//         //   .then(data => {
//         //     $scope.dataError.push(this_._process(data));
//         //     if ($scope.dataError.length === 1 || $scope.selectedChartType.value === 'stackedAreaChart') { $scope.api.refresh(); };
//         //   });

//         // opt.type = 'train_error';
//         // DataManager
//         //   .fetchRecord(opt)
//         //   .then(data => {
//         //     $scope.dataError.push(this_._process(data));
//         //     if ($scope.dataError.length === 1 || $scope.selectedChartType.value === 'stackedAreaChart') { $scope.api.refresh(); };
//         //   });

//         // opt.type = 'test_loss';
//         // DataManager
//         //   .fetchRecord(opt)
//         //   .then(data => {
//         //     $scope.dataLoss.push(this_._process(data));
//         //     if ($scope.dataLoss.length === 1 || $scope.selectedChartType.value === 'stackedAreaChart') { $scope.api.refresh(); };
//         //   });

//         // opt.type = 'train_loss';
//         // DataManager
//         //   .fetchRecord(opt)
//         //   .then(data => {
//         //     $scope.dataLoss.push(this_._process(data));
//         //     if ($scope.dataLoss.length === 1 || $scope.selectedChartType.value === 'stackedAreaChart') { $scope.api.refresh(); };
//         //   });

//       };

//     }

//     private _process(data: IRecordDataType) {
//       let this_ = this;
//       let [dbName, type] = [this_.Global.getSelectedDB(), {value: 'lineWithFocusChart'}];
//       let dataLenth = data.length;
//       let result: any = { key: dbName + '_' + type.value };
//       data = _.sortBy(data, 'iter');
//       switch (type.value) {
//         case 'lineWithFocusChart':
//           result.values = _.map(data, (o: IRecordEle) => {
//             return {
//               x: o.iter,
//               y: o.value
//             };
//           });
//           break;
//         case 'scatterChart':
//           let shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'];
//           result.values = _.map(data, (o: IRecordEle) => {
//             return {
//               shape: shapes[dataLenth % 6],
//               size: 0.5,
//               x: o.iter,
//               y: o.value
//             };
//           });
//           break;
//         case 'multiBarChart':
//           result.values = _.map(data, (o: IRecordEle) => {
//             return {
//               x: o.iter,
//               y: o.value
//             };
//           });
//           break;
//         case 'stackedAreaChart':
//           let colors = d4.scaleOrdinal(d3.schemeCategory10);
//           result.color = colors[dataLenth % 10];
//           result.values = _.map(data, (o: IRecordEle) => {
//             return [o.iter, o.value];
//           });
//           break;
//       }
//       return result;
//     }

//     private _setOption(type) {
//       let options;
//       switch (type.value) {
//         case 'lineWithFocusChart':
//           options = {
//             chart: {
//               type: 'lineWithFocusChart',
//               height: 450,
//               margin: {
//                 top: 20,
//                 right: 20,
//                 bottom: 60,
//                 left: 40
//               },
//               duration: 500,
//               useInteractiveGuideline: true
//             }
//           };
//           break;
//         case 'scatterChart':
//           options = {
//             chart: {
//               type: 'scatterChart',
//               height: 450,
//               color: d3.scale.category10().range(),
//               scatter: {
//                 onlyCircles: false
//               },
//               showDistX: false,
//               showDistY: true,
//               tooltipContent: function (key) {
//                 return '<h3>' + key + '</h3>';
//               },
//               duration: 350,
//               xAxis: {
//                 axisLabel: 'Iteration',
//                 tickFormat: function (d) {
//                   return d;
//                 }
//               },
//               yAxis: {
//                 axisLabel: 'Value',
//                 tickFormat: function (d) {
//                   return d3.format('.02f')(d);
//                 },
//                 axisLabelDistance: -5
//               },
//               zoom: {
//                 enabled: true,
//                 scale: 1,
//                 scaleExtent: [1, 5],
//                 useFixedDomain: false,
//                 useNiceScale: true,
//                 horizontalOff: false,
//                 verticalOff: false,
//                 unzoomEventType: 'dblclick.zoom'
//               }
//             }
//           };
//           break;
//         case 'multiBarChart':
//           options = {
//             chart: {
//               type: 'multiBarChart',
//               color: d3.scale.category10().range(),
//               height: 450,
//               margin: {
//                 top: 20,
//                 right: 20,
//                 bottom: 45,
//                 left: 45
//               },
//               clipEdge: true,
//               duration: 500,
//               stacked: false,
//               xAxis: {
//                 showMaxMin: false,
//                 axisLabel: 'Iteration',
//                 tickFormat: function (d) {
//                   return d;
//                 }
//               },
//               yAxis: {
//                 axisLabel: 'Value',
//                 tickFormat: function (d) {
//                   return d3.format('.02f')(d);
//                 },
//                 axisLabelDistance: -5
//               },
//               zoom: {
//                 enabled: true,
//                 scale: 1,
//                 scaleExtent: [1, 5],
//                 useFixedDomain: false,
//                 useNiceScale: true,
//                 horizontalOff: false,
//                 verticalOff: false,
//                 unzoomEventType: 'dblclick.zoom'
//               }
//             }
//           };
//           break;
//         case 'stackedAreaChart':
//           options = {
//             chart: {
//               type: 'stackedAreaChart',
//               color: d3.scale.category10().range(),
//               height: 500,
//               margin: {
//                 top: 20,
//                 right: 20,
//                 bottom: 100,
//                 left: 100
//               },
//               x: function (d) { return d[0]; },
//               y: function (d) { return d[1]; },
//               useVoronoi: true,
//               clipEdge: true,
//               duration: 100,
//               useInteractiveGuideline: true,
//               xAxis: {
//                 showMaxMin: false,
//                 axisLabel: 'Iteration',
//                 tickFormat: function (d) {
//                   return d;
//                 }
//               },
//               yAxis: {
//                 axisLabel: 'Value',
//                 showMaxMin: true,
//                 tickFormat: function (d) {
//                   return d3.format('.02f')(d);
//                 },
//                 axisLabelDistance: -5
//               },
//               zoom: {
//                 enabled: false,
//                 scale: 1,
//                 scaleExtent: [1, 5],
//                 useFixedDomain: false,
//                 useNiceScale: false,
//                 horizontalOff: false,
//                 verticalOff: false,
//                 unzoomEventType: 'dblclick.zoom'
//               }
//             }
//           };
//           break;
//         default:
//           alert('please choose one type of chart');
//       }
//       return options;
//     }
//   }

//   angular
//     .module('vis')
//     .controller('RecordController', Controller);
// }
