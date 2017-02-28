'use strict';

namespace application {

  interface IScope extends ng.IScope {
    data: any;
    options: any;
    show: any;
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'Global', 'Pip', '$timeout'
    ];

    constructor(
      public $scope: IScope,
      public Global: IGlobalService,
      public Pip: IPipService,
      public $timeout
    ) {
      let this_ = this;
      this_._init();

      Pip.onModelChanged($scope, (msg) => {
        let data = Global.getData('record');
        let conf = Global.getConfig('record');
        act(data, conf);
      });

      Pip.onRecordConfigChanged($scope, (conf: any) => {
        if (conf.show === true) {
          let data = Global.getData('record');
          act(data, conf);
        }
      });

      function act(data, conf) {
        $scope.show = {
          lr: conf.lr,
          error: conf.testError || conf.trainError,
          loss: conf.testLoss || conf.trainLoss
        };
        $scope.data = {};
        $scope.options = {};

        let color = d3.scale.category10().range();

        if ($scope.show.lr) {
          $scope.data.lr = this_._process('sparklinePlus', data.lr);
          $scope.options.lr = this_._setOption('sparklinePlus', data.lr.length, color);
        }
        if ($scope.show.error) {
          if (conf.testError && conf.trainError) {
            $scope.data.error = this_._process('lineChart', data.testError, data.trainError);
            $scope.options.error = this_._setOption('lineChart', data.testError.length, color);
          } else {
            if (conf.trainError) { color = color.slice(1); }
            let d = conf.testError ? data.testError : data.trainError;
            $scope.data.error = this_._process('sparklinePlus', d);
            $scope.options.error = this_._setOption('sparklinePlus', d.length, color);
          }
        }
        if ($scope.show.loss) {
          if (conf.testLoss && conf.trainLoss) {
            $scope.data.loss = this_._process('lineChart', data.testLoss, data.trainLoss);
            $scope.options.loss = this_._setOption('lineChart', data.testLoss.length, color);
          } else {
            if (conf.trainLoss) { color = color.slice(1); }
            let d = conf.testLoss ? data.testLoss : data.trainLoss;
            $scope.data.loss = this_._process('sparklinePlus', d);
            $scope.options.loss = this_._setOption('sparklinePlus', d.length, color);
          }
        }
      };

    }

    private _init() {
      let this_ = this;
      this_.$timeout(function () {
        $('#widget-container-recordinfo .scrollable').each(function () {
          let $this = $(this);
          $(this).ace_scroll({
            size: $this.attr('data-size') || 100,
          });
        });
      }, 100);

      $('#widget-container-recordinfo')
        .mouseenter(function () {
          $('#widget-container-recordinfo .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-recordinfo .widget-header').addClass('invisible');
        });
    }

    private _process(type, ...rest: any[]) {
      let this_ = this;
      let result, data;
      switch (type) {
        case 'lineChart':
          data = { test: rest[0], train: rest[1] };
          result = [
            {
              key: 'validation',
              values: _.map(rest[0], (d: IRecordEle) => {
                return { x: d.iter, y: d.value };
              })
            },
            {
              key: 'train',
              values: _.map(rest[1], (d: IRecordEle) => {
                return { x: d.iter, y: d.value };
              })
            }
          ];
          break;
        case 'sparklinePlus':
          data = rest[0];
          data = _.sortBy(data, 'iter');
          result = _.map(data, (d: IRecordEle) => {
            return {
              x: d.iter,
              y: d.value
            };
          });
          break;
        default:
          break;
      }

      return result;
    }

    private _setOption(type, width?, color?) {
      let options;
      switch (type) {
        case 'sparklinePlus':
          options = {
            chart: {
              type: 'sparklinePlus',
              height: 100,
              width: width ? width : 750,
              margin: {
                left: 0,
                right: 0,
                top: 1,
                bottom: 1
              },
              color: color,
              showMinMaxPoints: false,
              showLastValue: false,
              showCurrentPoint: false,
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
              color: color,
              width: width ? width : 750,
              height: 100,
              margin: {
                top: 1,
                right: 0,
                bottom: 1,
                left: 0
              },
              noData: ' ',
              x: function (d) { return d.x; },
              y: function (d) { return d.y; },
              useInteractiveGuideline: true,
              showXAxis: false,
              showYAxis: false,
              showLegend: false
            }
          };
          break;
        case 'scatterChart':
          options = {
            chart: {
              type: 'scatterChart',
              width: width ? width : 750,
              height: 100,
              margin: {
                top: 1,
                right: 0,
                bottom: 1,
                left: 0
              },
              x: function (d) { return d.x; },
              y: function (d) { return d.y; },
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
                enabled: false,
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
