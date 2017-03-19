'use strict';

namespace application {

  interface IScope extends ng.IScope {
    data: any;
    options: any;
    show: any;
    btnShow: any;
    click: any;
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

      function updateContainerHeight() {
        setTimeout(function () {
          $('#widget-container-recordinfo').height($('.record-chart').height());
          updateContainerHeight();
        }, 3000);
      }
      updateContainerHeight();

      $scope.click = function (type, ctype) {
        if (type === 'zoomin') {
          let tmp = $scope.options[ctype].chart.height + 100;
          if (tmp <= 800) { $scope.options[ctype].chart.height = tmp; }
        } else if (type === 'zoomout') {
          let tmp = $scope.options[ctype].chart.height - 100;
          if (tmp >= 20) { $scope.options[ctype].chart.height = tmp; }
        }
      };

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
          // $scope.options.lr = this_._setOption('sparklinePlus', data.lr.length, color);
          // $scope.options.lr.chart.height = 15;
          // $scope.options.lr.chart.showMinMaxPoints = false;

          $('#lr-svg').empty();
          let svg = d4.select('#lr-svg');
          svg.attr('width', data.lr.length)
            .attr('height', 15);
          let aniRect = svg.append('rect')
            .attr('class', 'overlay')
            .attr('width', data.lr.length)
            .attr('height', 15);
          svg
            .on('mouseover', mouseOverHandler)
            .on('mouseout', mouseOutHandler)
            .on('mousemove', mouseMoveHandler);
          svg = svg.append('g');

          let st = 0, cur = 0;
          let rect = [];
          while (cur + 1 < data.lr.length) {
            if (data.lr[cur + 1].value !== data.lr[st].value) {
              rect.push([st, cur]);
              st = cur + 1;
            }
            cur += 1;
          }
          rect.push([st, cur]);
          let rColor = buildColorMap(rect.length);
          let i = 0;
          for (let r of rect) {
            svg.append('rect')
              .attr('x', r[0])
              .attr('y', 0)
              .attr('width', r[1] - r[0] + 1)
              .attr('height', 15)
              .attr('fill', rColor[i])
              .attr('opacity', 0.9);
            i += 1;
          }
        }
        if ($scope.show.error) {
          if (conf.testError && conf.trainError) {
            $scope.data.error = this_._process('lineChart', data.testError, data.trainError);
            $scope.options.error = this_._setOption('lineChart', data.testError.length, color);
          } else {
            let myColor = color;
            if (conf.trainError) { myColor = color.slice(1); }
            let d = conf.testError ? data.testError : data.trainError;
            $scope.data.error = this_._process('sparklinePlus', d);
            $scope.options.error = this_._setOption('sparklinePlus', d.length, myColor);
          }
        }
        if ($scope.show.loss) {
          if (conf.testLoss && conf.trainLoss) {
            $scope.data.loss = this_._process('lineChart', data.testLoss, data.trainLoss);
            $scope.options.loss = this_._setOption('lineChart', data.testLoss.length, color);
          } else {
            let myColor = color;
            if (conf.trainLoss) { myColor = color.slice(1); }
            let d = conf.testLoss ? data.testLoss : data.trainLoss;
            $scope.data.loss = this_._process('sparklinePlus', d);
            $scope.options.loss = this_._setOption('sparklinePlus', d.length, myColor);
          }
        }
      };

      function mouseOverHandler() {
        let point = d4.mouse(this);
        Pip.emitTimeMouseOver({ point, x: 0, y: 0, k: 1 });
      }

      function mouseOutHandler() {
        let point = d4.mouse(this);
        Pip.emitTimeMouseOut({ point, x: 0, y: 0, k: 1 });
      }

      function mouseMoveHandler() {
        let point = d4.mouse(this);
        Pip.emitTimeMouseMove({ point, x: 0, y: 0, k: 1 });
      }

      function buildColorMap(index: number) {
        let colorMappingTable = {
          '2': ['#fc6621', '#a7ed6d'],
          '3': ['#fc8d59', '#ffffbf', '#91cf60'],
          '4': ['#d7191c', '#fdae61', '#a6d96a', '#1a9641'],
          '5': ['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641'],
          '6': ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'],
          '7': ['#d73027', '#fc8d59', '#fee08b', '#ffffbf', '#d9ef8b', '#91cf60', '#1a9850'],
          '8': ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'],
          '9': ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'],
          '10': ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
          '11': ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837']
        };
        return colorMappingTable[index];
      }

    }

    private _init() {
      let this_ = this;
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
      let this_ = this;
      let options;
      switch (type) {
        case 'sparklinePlus':
          options = {
            chart: {
              type: 'sparklinePlus',
              height: 50,
              width: width ? width : this_.Global.getData('iter').num,
              margin: {
                left: 0,
                right: 0,
                top: 1,
                bottom: 1
              },
              color: color,
              showMinMaxPoints: true,
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
              width: width ? width : this_.Global.getData('iter').num,
              height: 50,
              margin: {
                top: 1,
                right: 0,
                bottom: 1,
                left: 0
              },
              interactiveLayer: {
                dispatch: {
                  elementMousemove: function (msg) {
                    this_.Pip.emitTimeMouseMove({ point: [msg.mouseX, msg.mouseY], x: 0, y: 0, k: 1 });
                  }
                }
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
              width: width ? width : this_.Global.getData('iter').num,
              height: 50,
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
