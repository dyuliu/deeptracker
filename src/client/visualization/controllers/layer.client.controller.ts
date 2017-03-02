'use strict';

namespace application {

  interface IScope extends ng.IScope {
    data: {};
    dataDetail: {};
    options: {};
    optionsDetail: {};
    showTypes: {};
    kData: {};
    dataTree: any[];
    opened: {};
    open: any;    // func to open hl layer
    conf: any;
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'DataManager', 'Global', '$q', 'Pip', '$timeout'
    ];

    constructor(
      public $scope: IScope,
      public DataManager: IDataManagerService,
      public Global: IGlobalService,
      public $q: ng.IQService,
      public Pip: IPipService,
      public $timeout: ng.ITimeoutService
    ) {

      let this_ = this;
      let layers, hlLayers = [], allLayers;

      this_._init();

      Pip.onTimeChanged($scope, (iter) => {
        console.log('select iter: ', iter);
        // print kernel with maximum change
        // let typeArray = ['euclidean', 'manhattan', 'cosine', 'norm1', 'nomr2'];
        let typeArray = ['cosine', 'norm1', 'nomr2'];
        let allQuery = {}, parser = 'json';
        for (let type of typeArray) {
          allQuery[type] = DataManager.fetchKernel({
            db: Global.getSelectedDB(), type: 'i_' + type, iter, parser
          }, false);
        }
        $q.all(allQuery).then(data => {
          console.log('kernel data', data);
          $scope.kData = data;
        });
      });
      Pip.onLayerConfigChanged($scope, (conf: any) => {
        if (conf.show === true) { act(conf); }
      });
      Pip.onModelChanged($scope, (msg) => {
        let conf = Global.getConfig('layer');
        if (conf.show === true) { act(conf); }
      });

      function openPixelChart(d) {
        // open it
        let layerArray = Global.getData('info').layer;
        let lid = _.find(layerArray, (o: any) => o.name === d.name).lid;
        let [db, parser] = [Global.getSelectedDB(), 'json'];
        let type = 'i_cosine';
        DataManager.fetchKernel({ db, type, layer: [lid], parser }, false)
          // DataManager.fetchKernel({ db, type: 'i_norm1', layer: [lid], parser }, false)
          .then(data => {
            $scope.optionsDetail[d.name] = this_._setOptions('pixelChartWithLine');
            $scope.optionsDetail[d.name].height = data.length + 4;

            // global scale
            // let f = d4.scaleLinear();
            // if (type === 'i_cosine') { f.range([1, 0]); }
            //   else { f.range([0, 1]); }
            // let [min, max] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];

            // _.each(data, (dd, i) => {
            //   let [mmin, mmax] = d4.extent(dd.value);
            //   if (min > mmin) { min = mmin; }
            //   if (max < mmax) { max = mmax; }
            // });
            // f.domain([min, max]);
            // _.each(data, (dd, i) => {
            //   dd.value = _.map(dd.value, (o: any) => {
            //     let t = f(o);
            //     return t;
            //   });
            //   dd.index = +i;
            // });

            // horizon scale
            // _.each(data, (dd, i) => {
            //   let [mmin, mmax] = d4.extent(dd.value);
            //   let nf = d4.scaleLinear().domain([mmin, mmax]).range([1, 0]).clamp(true);
            //   console.log(mmin, mmax, nf(1));
            //   dd.value = _.map(dd.value, (o: any) => {
            //     let t = nf(o);
            //     return 0;
            //   });
            //   dd.index = +i;
            // });

            // vertical scale
            for (let i = 0; i < data[0].iter.length; i += 1) {
              let [min, max] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
              _.each(data, (dd, j) => {
                if (min > dd.value[i]) { min = dd.value[i]; }
                if (max < dd.value[i]) { max = dd.value[i]; }
                if (!dd.index) { dd.index = +j; }
              });
              let nf = d4.scaleLinear().domain([min, max]).range([0.01, 0.95]).clamp(true);
              _.each(data, dd => {
                dd.value[i] = nf(dd.value[i]);
              });
            }
            console.log(data);
            $scope.dataDetail[d.name] = {
              pixelChart: data,
              lineChart: null
            };
          });
      }

      function act(conf) {

        let globalData = Global.getData();
        let layerArray = globalData.info.layer,
          tree = globalData.tree,
          iterSet = globalData.iter.set;
        allLayers = _.map(layerArray, (d: any) => d.lid);
        layers = _.keyBy(layerArray, (o: any) => o.name); // turn array to object with key layername
        $scope.opened = {};
        $scope.options = {};
        $scope.optionsDetail = {};
        $scope.dataDetail = {};
        $scope.showTypes = {};
        $scope.conf = conf;
        $scope.dataTree = tree;

        let globalShowType;
        if (conf.type === 's_cratio') {
          globalShowType = 'crChart';
        } else if (conf.type === 'box') {
          globalShowType = 'boxPlotChart';
        } else {
          globalShowType = 'sparklinePlus';
        }

        if (globalShowType === 'sparklinePlus') {

          for (let d of tree) {
            $scope.opened[d.name] = false;
            $scope.options[d.name] = this_._setOptions('sparklinePlus');
            $scope.showTypes[d.name] = 'nvd3';
            if (d.nodes) {
              hlLayers.push(d.name);
              for (let dn of d.nodes) {
                dn.parent = d.name;
                $scope.opened[dn.name] = false;
                $scope.options[dn.name] = this_._setOptions('sparklinePlus');
                $scope.showTypes[dn.name] = 'nvd3';
                if (dn.nodes) {
                  hlLayers.push(dn.name);
                  for (let dnn of dn.nodes) {
                    dnn.parent = dn.name;
                    $scope.opened[dnn.name] = false;
                    $scope.options[dnn.name] = this_._setOptions('sparklinePlus');
                    $scope.showTypes[dnn.name] = 'nvd3';
                  };
                }
              }
            }
          }
          let db = Global.getSelectedDB(), parser = 'json';

          $q.all([
            DataManager.fetchLayer({ db, type: conf.gw + '_' + conf.type, parser }, false),
            DataManager.fetchLayer({ db, type: 'hl_' + conf.gw + '_' + conf.type, parser }, false)
          ]).then(data => {
            $scope.data = {};
            data[0] = _.filter(data[0], (d: any) => iterSet.has(d.iter));
            data[1] = _.filter(data[1], (d: any) => iterSet.has(d.iter));
            let tmpStat = this_._processData('stat', layers, data[0]),
              tmpHlStat = this_._processData('hl_stat', hlLayers, data[1]);
            let [min, max] = [Math.min(tmpStat[1], tmpHlStat[1]), Math.max(tmpStat[2], tmpHlStat[2])];
            _.each($scope.options, (d: any) => {
              d.chart.width = iterSet.size;
              if (conf.sameScale) { d.chart.yDomain = [min, max]; }
            });
            _.merge($scope.data, tmpStat[0], tmpHlStat[0]);
          });

        } else if (globalShowType === 'boxPlotChart') {

          for (let d of tree) {
            $scope.opened[d.name] = false;
            $scope.options[d.name] = this_._setOptions('boxPlotChart');
            $scope.showTypes[d.name] = 'nvd3';
            if (d.nodes) {
              hlLayers.push(d.name);
              for (let dn of d.nodes) {
                dn.parent = d.name;
                $scope.opened[dn.name] = false;
                $scope.options[dn.name] = this_._setOptions('boxPlotChart');
                $scope.showTypes[dn.name] = 'nvd3';
                if (dn.nodes) {
                  hlLayers.push(dn.name);
                  for (let dnn of dn.nodes) {
                    dnn.parent = dn.name;
                    $scope.opened[dnn.name] = false;
                    $scope.options[dnn.name] = this_._setOptions('boxPlotChart');
                    $scope.showTypes[dnn.name] = 'nvd3';
                  };
                }
              }
            }
          }
          let db = Global.getSelectedDB(), parser = 'json';
          let types = [conf.gw + '_min', conf.gw + '_quarter1', conf.gw + '_mean',
          conf.gw + '_quarter3', conf.gw + '_max'];
          let queryQueue = [];
          for (let type of types) {
            queryQueue.push(DataManager.fetchLayer({ db, type, parser }, false));
          }
          for (let type of types) {
            queryQueue.push(DataManager.fetchLayer({ db, type: 'hl_' + type, parser }, false));
          }
          $q.all(queryQueue).then(data => {
            $scope.data = {};
            let ss = _.range(0, iterSet.size, 2);
            for (let i = 0; i < data.length; i += 1) {
              data[i] = _.filter(data[i], (d: any) => iterSet.has(d.iter));
              let tmp = [];
              for (let j of ss) { tmp.push(data[i][j]); }
              data[i] = tmp;
            }
            let tmpStat = this_._processData('boxPlot', layers, data.slice(0, 5)),
              tmpHlStat = this_._processData('hl_boxPlot', hlLayers, data.slice(5, 10));
            let [min, max] = [Math.min(tmpStat[1], tmpHlStat[1]), Math.max(tmpStat[2], tmpHlStat[2])];
            _.each($scope.options, (d: any) => {
              d.chart.width = iterSet.size;
              if (conf.sameScale) { d.chart.yDomain = [min, max]; }
            });
            _.merge($scope.data, tmpStat[0], tmpHlStat[0]);
            console.log($scope.data);
          });

        } else if (globalShowType === 'crChart') {

          for (let d of tree) {
            $scope.opened[d.name] = false;
            $scope.options[d.name] = this_._setOptions('crChart');
            $scope.showTypes[d.name] = 'cr';
            if (d.nodes) {
              hlLayers.push(d.name);
              for (let dn of d.nodes) {
                dn.parent = d.name;
                $scope.opened[dn.name] = false;
                $scope.options[dn.name] = this_._setOptions('crChart');
                $scope.showTypes[dn.name] = 'cr';
                if (dn.nodes) {
                  hlLayers.push(dn.name);
                  for (let dnn of dn.nodes) {
                    dnn.parent = dn.name;
                    $scope.opened[dnn.name] = false;
                    $scope.options[dnn.name] = this_._setOptions('crChart');
                    $scope.showTypes[dnn.name] = 'cr';
                  };
                }
              }
            }
          }

          let db = Global.getSelectedDB(), parser = 'json', seqidx = [10, 20, 30];
          $q.all([
            DataManager.fetchLayer({ db, type: 's_cratio', seqidx, parser }, false),
            DataManager.fetchLayer({ db, type: 'hl_s_cratio', seqidx, parser }, false)
          ]).then(data => {
            $scope.data = {};
            _.merge(
              $scope.data,
              this_._processData('seq', layers, data[0]),
              this_._processData('hl_seq', hlLayers, data[1])
            );
            _.each($scope.options, (d: any) => { d.width = iterSet.size; });

            // filter
            _.each($scope.data, (d: any) => {
              d.value = _.filter(d.value, (o, i) => iterSet.has(d.iter[i]));
              d.iter = _.filter(d.iter, o => iterSet.has(o));
            });
            console.log($scope.data);
          });

        }

      }

      $scope.open = function (d, level) {
        if (d.nodes) {
          level = ' .level' + level;
          if (!$scope.opened[d.name]) {
            $('#' + d.name + level)
              .show(200, 'linear');
          } else {
            $('#' + d.name + level)
              .hide(200, 'linear');
          }
          $scope.opened[d.name] = !$scope.opened[d.name];
        } else {
          $scope.opened[d.name] = !$scope.opened[d.name];
          if ($scope.opened[d.name]) {
            $scope.showTypes[d.name] = 'pchart';
            openPixelChart(d);
          } else {
            if ($scope.conf.type === 's_cratio') {
              $scope.showTypes[d.name] = 'cr';
            } else {
              $scope.showTypes[d.name] = 'nvd3';
            }
          }
        }
      };

    }

    private _init() {
      let this_ = this;
      this_.$scope.kData = { 'a': 1, 'b': 2, 'c': 3 };

      this_.$timeout(function () {
        $('#widget-container-layerinfo .scrollable').each(function () {
          let $this = $(this);
          $(this).ace_scroll({
            size: $this.attr('data-size') || 100,
          });
        });
      }, 100);

      $('#widget-container-layerinfo')
        .mouseenter(function () {
          $('#widget-container-layerinfo .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-layerinfo .widget-header').addClass('invisible');
        });
    }

    private _processData(type, ...rest: any[]) {
      let this_ = this;
      let result = {};
      let [layers, data] = [rest[0], rest[1]],
        [min, max] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      switch (type) {
        case 'kernel':
          for (let d of data) {
            result[d.name] = {};
            let len = d.values[0].length;
            let tmp = _.map(_.range(len), idx => {
              return { iter: d.domain, value: [], index: idx };
            });
            for (let v of d.values) {
              for (let i = 0; i < len; i += 1) {
                tmp[i].value.push(v[i] > 0.05 ? 0 : 1);
              }
            }
            result[d.name].pixelChart = tmp;
          }
          return result;
        case 'stat':
          _.each(layers, (v) => {
            result[v.name] = _.map(data, (dv: any) => {
              min = dv.value[v.lid] < min ? dv.value[v.lid] : min;
              max = dv.value[v.lid] > max ? dv.value[v.lid] : max;
              return { x: dv.iter, y: dv.value[v.lid] };
            });
          });
          return [result, min, max];
        case 'hl_stat':
          _.each(layers, name => {
            result[name] = _.map(data, (dv: any) => {
              min = dv.value[name] < min ? dv.value[name] : min;
              max = dv.value[name] > max ? dv.value[name] : max;
              return { x: dv.iter, y: dv.value[name] };
            });
          });
          return [result, min, max];
        case 'boxPlot':
          _.each(layers, (v) => {
            result[v.name] = [];
            let size = data[0].length;
            for (let i = 0; i < size; i += 1) {
              min = data[0][i].value[v.lid] < min ? data[0][i].value[v.lid] : min;
              max = data[4][i].value[v.lid] > max ? data[4][i].value[v.lid] : max;
              result[v.name].push({
                x: data[0][i].iter,
                values: {
                  whisker_low: data[0][i].value[v.lid],
                  Q1: data[1][i].value[v.lid],
                  Q2: data[2][i].value[v.lid],
                  Q3: data[3][i].value[v.lid],
                  whisker_high: data[4][i].value[v.lid]
                }
              });
            }
          });
          return [result, min, max];
        case 'hl_boxPlot':
          _.each(layers, name => {
            result[name] = [];
            let size = data[0].length;
            for (let i = 0; i < size; i += 1) {
              min = data[0][i].value[name] < min ? data[0][i].value[name] : min;
              max = data[4][i].value[name] > max ? data[4][i].value[name] : max;
              result[name].push({
                x: data[0][i].iter,
                values: {
                  whisker_low: data[0][i].value[name],
                  Q1: data[1][i].value[name],
                  Q2: data[2][i].value[name],
                  Q3: data[3][i].value[name],
                  whisker_high: data[4][i].value[name]
                }
              });
            }
          });
          return [result, min, max];
        case 'seq':
          _.each(layers, v => {
            let d: any = _.find(data, (o: any) => +o.key === +v.lid);
            result[v.name] = { iter: d.domain, value: d.values };
          });
          return result;
        case 'hl_seq':
          _.each(layers, name => {
            let d: any = _.find(data, { key: name });
            result[name] = { iter: d.domain, value: d.values };
          });
          return result;
        default:
          break;
      }
    }

    private _setOptions(type) {
      let options;
      switch (type) {
        case 'sparklinePlus':
          options = {
            chart: {
              type: 'sparklinePlus',
              width: 757,
              height: 60,
              margin: {
                left: 0,
                right: 0,
                top: 2,
                bottom: 2
              },
              color: function (d, i) { return '#4682b4'; },
              // yDomain: [0, 50],
              x: function (d, i) { return d.x; },
              // y: function (d, i) { return d.y; },
              xTickFormat: function (d) {
                return d;
              },
              yTickFormat: function (d) {
                return d4.format('.3s')(d);
              },
              duration: 250
            }
          };
          break;
        case 'boxPlotChart':
          options = {
            chart: {
              type: 'boxPlotChart',
              height: 80,
              margin: {
                left: 0,
                right: 0,
                top: 2,
                bottom: 2,
              },
              color: ['#4682b4'],
              x: function (d, i) { return d.x; },
              y: function (d, i) { return d.y; },
              xAxis: {
                tickFormat: function (d) {
                  return d;
                }
              },
              yAxis: {
                tickFormat: function (d) {
                  return d3.format(',.3s')(d);
                }
              },
              showXAxis: false,
              showYAxis: false,
              maxBoxWidth: 1,
              // yDomain: [0, 500]
            }
          };
          break;
        case 'crChart':
          options = {
            width: 757,
            height: 60,
            cellWidth: 1,
            margin: {
              top: 2,
              right: 0,
              bottom: 2,
              left: 0
            },
            ratio: null
          };
          break;
        case 'pixelChartWithLine':
          options = {
            width: 757,
            height: 60,
            cellWidth: 1,
            pixelChart: true,
            lineChart: false,
            color: d4.scaleSequential(d4.interpolateBlues),
            margin: {
              top: 2,
              right: 0,
              bottom: 2,
              left: 0
            }
          };
          break;
        default:
          alert('wrong chart type');
      }
      return options;
    }
  }

  angular
    .module('vis')
    .controller('LayerController', Controller);
}
