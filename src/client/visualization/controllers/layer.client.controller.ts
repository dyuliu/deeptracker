'use strict';

namespace application {

  interface IScope extends ng.IScope {
    data: {};
    dataCR: {};
    dataHGraph: {};
    dataDetail: {};
    dataTopK: {};
    options: {};
    optionsCR: {};
    optionsHGraph: {};
    optionsDetail: {};
    optionsTopK: {};
    showTypes: {};
    kData: {};
    tree: any;
    dataTree: any[];
    optionsTree: {};
    opened: {};
    open: any;    // func to open hl layer
    conf: any;
    btnShow: any;
    size: {};
    click: any;
    hovering: any;
    layers: any;
    mouseleave: any;
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
      let layerTree = {};
      let layers, hlLayers = [], allLayers;
      let previousOpen = null;
      let oldShowType = {};
      $scope.showTypes = {};

      this_._init();

      function updateContainerHeight() {
        setTimeout(function () {
          let ht = Math.max($('.layer-chart').height(), $('.layer-graph').height());
          $('#widget-container-layerinfo').height(ht);
          updateContainerHeight();
        }, 3000);
      }
      updateContainerHeight();

      $scope.hovering = function (name) {
        $('.layer-bar-' + name).css('background', '#f9a814');
        Pip.emitHoveringLayer(name);
      };

      $scope.mouseleave = function (name) {
        $('.layer-bar-' + name).css('background', '#489ff2');
        Pip.emitLeavingLayer(name);
      };


      $scope.click = function (type, name) {
        if ($scope.showTypes[name] === 'nvd3') {
          if (type === 'zoomin') {
            let tmp = $scope.options[name].chart.height;
            tmp *= 1.5;
            if (tmp <= 800) { $scope.options[name].chart.height = tmp; }
          } else if (type === 'zoomout') {
            let tmp = $scope.options[name].chart.height;
            tmp /= 1.5;
            if (tmp >= 40) { $scope.options[name].chart.height = tmp; }
          };
        } else if ($scope.showTypes[name] === 'pchart' || $scope.showTypes[name] === 'cr' || $scope.showTypes[name] === 'hgraph') {
          if (type === 'zoomin') {
            $scope.$broadcast('zoom', { type: 'in', name });
          } else {
            $scope.$broadcast('zoom', { type: 'out', name });
          }
        }

      };

      Pip.onShowTopKernel($scope, (msg => {
        let parser = 'json', type = 'i_cosine', db = Global.getSelectedDB();
        let iterInfo = Global.getData('iter');
        let allQuery = [];
        for (let iter of iterInfo.picked) {
          allQuery.push(DataManager.fetchKernel({ db, type, iter: iter[1], parser }, false));
        }
        $('#layer-data-loading').removeClass('invisible');
        $q.all(allQuery).then((data: any) => {
          // computer intersect
          if (iterInfo.picked.length === 1) { data[0] = data[0].slice(0, 20); }
          let map = new Map();
          _.each(data, (d: any) => {
            for (let i = 0; i < d.length; i += 1) {
              let name = d[i].lid.toString() + '.' + d[i].idx.toString();
              if (!map.has(name)) { map.set(name, { count: 0, d: [] }); }
              let td = map.get(name);
              td.count += 1;
              td.d.push(d[i]);
            }
          });
          let lmap = new Map();
          map.forEach((v, k) => {
            if (v.count === data.length) {
              if (!lmap.has(v.d[0].name)) { lmap.set(v.d[0].name, { v: [], lid: v.d[0].lid }); };
              let tmp = lmap.get(v.d[0].name);
              tmp.v.push(v.d[0].idx);
            }
          });

          let qArray = {};
          lmap.forEach((v, k) => {
            qArray[k] = DataManager.fetchKernel({
              db, type, layer: [v.lid], seqidx: v.v, parser
            }, false);
          });
          $scope.dataTopK = {};
          $scope.optionsTopK = {};
          if (!_.isEmpty(qArray)) {
            $q.all(qArray).then(kernelData => {
              $('#layer-data-loading').addClass('invisible');
              _.each(kernelData, (v, k) => {
                $scope.dataTopK[k] = _.map(v, (vd: any) => {
                  return {
                    heatmapData: vd.value,
                    linechartData: null
                  };
                });
                $scope.showTypes[k] = 'topk';
                $scope.optionsTopK[k] = this_._setOptions('heatline');
                $scope.optionsTopK[k].num = $scope.layers[k].kernelNum;
                let cnode = layerTree[k];
                let count = 0;
                if (cnode.parent) {
                  // console.log(cnode.parent);
                  // console.log(cnode.parent.parent);
                  $scope.opened[cnode.parent.parent.name] = true;
                  $scope.opened[cnode.parent.name] = true;
                  $('#' + cnode.parent.parent.name).show();
                  $('#' + cnode.parent.parent.name + ' .level2').show();
                  $('#' + cnode.parent.name + ' .level3').show();
                  count += 1;
                }
                // console.log(count);
                // console.log(k, v);
              });
            });
          }

        });
      }));

      Pip.onLayerConfigChanged($scope, (conf: any) => {
        if (conf.show === true) { act(conf); }
      });
      Pip.onModelChanged($scope, (msg) => {
        let conf = Global.getConfig('layer');
        if (conf.show === true) { act(conf); }
      });

      function openPixelChart(name) {
        // open it
        let layerArray = Global.getData('info').layer;
        let lid = _.find(layerArray, (o: any) => o.name === name).lid;
        let [db, parser] = [Global.getSelectedDB(), 'json'];
        let type = 'i_cosine';
        $('#layer-data-loading').removeClass('invisible');
        DataManager.fetchKernel({ db, type, layer: [lid], parser }, false)
          // DataManager.fetchKernel({ db, type: 'i_norm1', layer: [lid], parser }, false)
          .then(data => {
            $('#layer-data-loading').addClass('invisible');
            $scope.optionsDetail[name] = this_._setOptions('pixelChartWithLine');
            $scope.optionsDetail[name].height = data.length + 4;
            $scope.optionsDetail[name].name = name;

            let scaleType = Global.getConfig('layer').kernelScale;
            if (scaleType === 'global') {
              // global scale
              let f = d4.scaleLinear();
              f.range([1, 0]);
              let [min, max] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];

              _.each(data, (dd, i) => {
                let [mmin, mmax] = d4.extent(dd.value);
                if (min > mmin) { min = mmin; }
                if (max < mmax) { max = mmax; }
              });
              f.domain([min, max]);
              _.each(data, (dd, i) => {
                dd.value = _.map(dd.value, (o: any) => {
                  let t = f(o);
                  return t;
                });
                if (!dd.index) { dd.index = +i; }
              });
            } else if (scaleType === 'horizon') {
              // horizon scale
              _.each(data, (dd, i) => {
                let [mmin, mmax] = d4.extent(dd.value);
                let nf = d4.scaleLinear().domain([mmin, mmax]).range([1, 0]).clamp(true);
                let count0 = 0;
                dd.value = _.map(dd.value, (o: any) => {
                  let t = nf(o);
                  if (t === 1) { count0 += 1; }
                  return t;
                });
                if (!dd.index) { dd.index = +i; }
                if (count0 > 10) { console.log('revise fig 7e: ', i); }
              });
            } else if (scaleType === 'vertical') {
              // vertical scale
              for (let i = 0; i < data[0].iter.length; i += 1) {
                let [min, max] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
                _.each(data, (dd, j) => {
                  if (min > dd.value[i]) { min = dd.value[i]; }
                  if (max < dd.value[i]) { max = dd.value[i]; }
                  if (!dd.index) { dd.index = +j; }
                });
                let nf = d4.scaleLinear().domain([min, max]).range([1, 0]).clamp(true);
                let tmpSort = [];
                _.each(data, dd => {
                  tmpSort.push([dd.value[i], dd.index]);
                  dd.value[i] = nf(dd.value[i]);
                });
                tmpSort = _.sortBy(tmpSort, [function(o) { return o[0]; }]);
                console.log('revise fig 8c: ', 'iter-' + i, tmpSort[0][0], tmpSort[1][0], tmpSort[2][0], tmpSort[3][0]);
                console.log('revise fig 8c: ', 'iter-' + i, tmpSort[0][1], tmpSort[1][1], tmpSort[2][1], tmpSort[3][1]);
              }
            }

            $scope.dataDetail[name] = {
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
        $scope.layers = layers;
        $scope.opened = {};
        $scope.options = {};
        $scope.optionsDetail = {};
        $scope.optionsHGraph = {};
        $scope.optionsCR = {};
        $scope.dataCR = {};
        $scope.dataDetail = {};
        $scope.dataHGraph = {};
        $scope.showTypes = {};
        $scope.size = {};
        $scope.conf = conf;
        $scope.dataTree = tree;
        $scope.optionsTree = {
          width: 300,
          height: 8000,
          layers: layers,
          opened: $scope.opened,
          node: {
            height: 5,
            width: 16
          },
          space: 3,
          margin: {
            top: 20,
            right: 10,
            bottom: 20,
            left: 10
          }
        };

        if (conf.chartType === 'lineChart') {

          for (let d of tree) {
            $scope.opened[d.name] = false;
            $scope.options[d.name] = this_._setOptions('sparklinePlus');
            $scope.size[d.name] = 0;
            if (!d.nodes) {
              $scope.size[d.name] = layers[d.name].kernelNum * layers[d.name].channels *
                layers[d.name].kernelWidth + layers[d.name].kernelHeight;
            }
            $scope.showTypes[d.name] = 'nvd3';
            layerTree[d.name] = d;
            if (d.nodes) {
              hlLayers.push(d.name);
              for (let dn of d.nodes) {
                dn.parent = d;
                $scope.opened[dn.name] = false;
                $scope.options[dn.name] = this_._setOptions('sparklinePlus');
                $scope.size[dn.name] = 0;
                $scope.showTypes[dn.name] = 'nvd3';
                layerTree[dn.name] = dn;
                if (dn.nodes) {
                  hlLayers.push(dn.name);
                  for (let dnn of dn.nodes) {
                    dnn.parent = dn;
                    $scope.opened[dnn.name] = false;
                    $scope.options[dnn.name] = this_._setOptions('sparklinePlus');
                    $scope.size[dnn.name] = layers[dnn.name].kernelNum * layers[dnn.name].channels *
                      layers[dnn.name].kernelWidth + layers[dnn.name].kernelHeight;
                    $scope.size[dn.name] += $scope.size[dnn.name];
                    $scope.size[d.name] += $scope.size[dnn.name];
                    $scope.showTypes[dnn.name] = 'nvd3';
                    layerTree[dnn.name] = dnn;
                  };
                }
              }
            }
          }
          let db = Global.getSelectedDB(), parser = 'json';
          $('#layer-data-loading').removeClass('invisible');
          $q.all([
            DataManager.fetchLayer({ db, type: conf.gw + '_' + conf.type, parser }, false),
            DataManager.fetchLayer({ db, type: 'hl_' + conf.gw + '_' + conf.type, parser }, false)
          ]).then(data => {
            $('#layer-data-loading').addClass('invisible');
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
            if (conf.type === 'norm1' || conf.type === 'norm2') {
              let mmin = Number.MAX_SAFE_INTEGER, mmax = Number.MIN_SAFE_INTEGER;
              _.each($scope.data, (v: any, k) => {
                for (let i = 0; i < v.length; i += 1) {
                  v[i].y /= $scope.size[k];
                  if (v[i].y < mmin) { mmin = v[i].y; }
                  if (v[i].y > mmax) { mmax = v[i].y; }
                }
              });
              _.each($scope.options, (d: any) => {
                if (conf.sameScale) { d.chart.yDomain = [mmin, mmax]; }
              });
            }
          });

        } else if (conf.chartType === 'boxPlot') {

          for (let d of tree) {
            $scope.opened[d.name] = false;
            $scope.options[d.name] = this_._setOptions('boxPlotChart');
            $scope.showTypes[d.name] = 'nvd3';
            layerTree[d.name] = d;
            if (d.nodes) {
              hlLayers.push(d.name);
              for (let dn of d.nodes) {
                dn.parent = d;
                $scope.opened[dn.name] = false;
                $scope.options[dn.name] = this_._setOptions('boxPlotChart');
                $scope.showTypes[dn.name] = 'nvd3';
                layerTree[dn.name] = dn;
                if (dn.nodes) {
                  hlLayers.push(dn.name);
                  for (let dnn of dn.nodes) {
                    dnn.parent = dn;
                    $scope.opened[dnn.name] = false;
                    $scope.options[dnn.name] = this_._setOptions('boxPlotChart');
                    $scope.showTypes[dnn.name] = 'nvd3';
                    layerTree[dnn.name] = dnn;
                  };
                }
              }
            }
          }
          let db = Global.getSelectedDB(), parser = 'json';
          let types = ['w' + '_min', 'w' + '_quarter1', 'w' + '_mean',
          'w' + '_quarter3', 'w' + '_max'];
          let queryQueue = [];
          for (let type of types) {
            queryQueue.push(DataManager.fetchLayer({ db, type, parser }, false));
          }
          for (let type of types) {
            queryQueue.push(DataManager.fetchLayer({ db, type: 'hl_' + type, parser }, false));
          }
          $('#layer-data-loading').removeClass('invisible');
          $q.all(queryQueue).then(data => {
            $('#layer-data-loading').addClass('invisible');
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
          });

        } else if (conf.chartType === 'crChart') {
          for (let d of tree) {
            $scope.opened[d.name] = false;
            $scope.optionsCR[d.name] = this_._setOptions('crChart');
            $scope.optionsCR[d.name].name = d.name;
            $scope.showTypes[d.name] = 'cr';
            layerTree[d.name] = d;
            if (d.nodes) {
              hlLayers.push(d.name);
              for (let dn of d.nodes) {
                dn.parent = d;
                $scope.opened[dn.name] = false;
                $scope.optionsCR[dn.name] = this_._setOptions('crChart');
                $scope.optionsCR[dn.name].name = d.name;
                $scope.showTypes[dn.name] = 'cr';
                layerTree[dn.name] = dn;
                if (dn.nodes) {
                  hlLayers.push(dn.name);
                  for (let dnn of dn.nodes) {
                    dnn.parent = dn;
                    $scope.opened[dnn.name] = false;
                    $scope.optionsCR[dnn.name] = this_._setOptions('crChart');
                    $scope.optionsCR[dnn.name].name = d.name;
                    $scope.showTypes[dnn.name] = 'cr';
                    layerTree[dnn.name] = dnn;
                  };
                }
              }
            }
          }
          $('#layer-data-loading').removeClass('invisible');

          let db = Global.getSelectedDB(), parser = 'json', seqidx = conf.selectedRatio;
          $q.all([
            DataManager.fetchLayer({ db, type: 's_cratio', seqidx, parser }, false),
            DataManager.fetchLayer({ db, type: 'hl_s_cratio', seqidx, parser }, false)
          ]).then(data => {
            $('#layer-data-loading').addClass('invisible');
            $scope.dataCR = {};
            _.merge(
              $scope.dataCR,
              this_._processData('seq', layers, data[0]),
              this_._processData('hl_seq', hlLayers, data[1])
            );
            _.each($scope.optionsCR, (d: any) => { d.width = iterSet.size; });

            // filter
            _.each($scope.dataCR, (d: any) => {
              d.value = _.filter(d.value, (o, i) => iterSet.has(d.iter[i]));
              d.iter = _.filter(d.iter, o => iterSet.has(o));
            });
          });

        } else if (conf.chartType === 'horizonGraph') {
          for (let d of tree) {
            $scope.opened[d.name] = false;
            $scope.optionsHGraph[d.name] = this_._setOptions('horizonGraph');
            $scope.optionsHGraph[d.name].name = d.name;
            $scope.size[d.name] = 0;
            if (!d.nodes) {
              $scope.size[d.name] = layers[d.name].kernelNum * layers[d.name].channels *
                layers[d.name].kernelWidth + layers[d.name].kernelHeight;
            }
            $scope.showTypes[d.name] = 'hgraph';
            layerTree[d.name] = d;
            if (d.nodes) {
              hlLayers.push(d.name);
              for (let dn of d.nodes) {
                dn.parent = d;
                $scope.opened[dn.name] = false;
                $scope.optionsHGraph[dn.name] = this_._setOptions('horizonGraph');
                $scope.optionsHGraph[dn.name].name = dn.name;
                $scope.size[dn.name] = 0;
                $scope.showTypes[dn.name] = 'hgraph';
                layerTree[dn.name] = dn;
                if (dn.nodes) {
                  hlLayers.push(dn.name);
                  for (let dnn of dn.nodes) {
                    dnn.parent = dn;
                    $scope.opened[dnn.name] = false;
                    $scope.optionsHGraph[dnn.name] = this_._setOptions('horizonGraph');
                    $scope.optionsHGraph[dnn.name].name = dnn.name;
                    $scope.size[dnn.name] = layers[dnn.name].kernelNum * layers[dnn.name].channels *
                      layers[dnn.name].kernelWidth + layers[dnn.name].kernelHeight;
                    $scope.size[dn.name] += $scope.size[dnn.name];
                    $scope.size[d.name] += $scope.size[dnn.name];
                    $scope.showTypes[dnn.name] = 'hgraph';
                    layerTree[dnn.name] = dnn;
                  };
                }
              }
            }
          }
          let db = Global.getSelectedDB(), parser = 'json';
          $('#layer-data-loading').removeClass('invisible');
          $q.all([
            DataManager.fetchLayer({ db, type: conf.gw + '_' + conf.type, parser }, false),
            DataManager.fetchLayer({ db, type: 'hl_' + conf.gw + '_' + conf.type, parser }, false)
          ]).then(data => {
            $('#layer-data-loading').addClass('invisible');
            $scope.dataHGraph = {};
            data[0] = _.filter(data[0], (d: any) => iterSet.has(d.iter));
            data[1] = _.filter(data[1], (d: any) => iterSet.has(d.iter));
            let tmpStat = this_._processData('stat_hgraph', layers, data[0]),
              tmpHlStat = this_._processData('hl_stat_hgraph', hlLayers, data[1]);
            let [min, max] = [Math.min(tmpStat[1], tmpHlStat[1]), Math.max(tmpStat[2], tmpHlStat[2])];
            _.each($scope.optionsHGraph, (d: any) => {
              d.width = iterSet.size;
              d.band = conf.band;
              if (conf.sameScale) { d.yDomain = [min, max]; }
            });
            _.merge($scope.dataHGraph, tmpStat[0], tmpHlStat[0]);
            if (conf.type === 'norm1' || conf.type === 'norm2') {
              let mmin = Number.MAX_SAFE_INTEGER, mmax = Number.MIN_SAFE_INTEGER;
              _.each($scope.dataHGraph, (v: any, k) => {
                for (let i = 0; i < v.length; i += 1) {
                  v[i][1] /= $scope.size[k];
                  if (v[i][1] < mmin) { mmin = v[i][1]; }
                  if (v[i][1] > mmax) { mmax = v[i][1]; }
                }
              });
              _.each($scope.optionsHGraph, (d: any) => {
                if (conf.sameScale) { d.yDomain = [mmin, mmax]; }
              });
            }

          });
        }

        $scope.tree = this_._treeDataConstruction($scope.dataTree);
        console.log($scope.tree);

        if (!previousOpen) { previousOpen = $scope.opened; }
        else { $scope.opened = previousOpen; }

        $timeout(function () {
          $('.tree-btn').hover(
            function () { $(this).find('.zoombtn').show(); },
            function () { $(this).find('.zoombtn').hide(); }
          );
        }, 1000);
      }

      Pip.onLayerOpen($scope, msg => {
        $scope.$apply();
      });

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
            oldShowType[d.name] = $scope.showTypes[d.name];
            $scope.showTypes[d.name] = 'pchart';
            openPixelChart(d);
          } else {
            $scope.showTypes[d.name] = oldShowType[d.name];
          }
        }
      };

      Pip.onFlip($scope, name => {
        if ($scope.showTypes[name] !== 'pchart') {
          oldShowType[name] = $scope.showTypes[name];
          $scope.showTypes[name] = 'pchart';
          openPixelChart(name);
        } else {
          $scope.showTypes[name] = oldShowType[name];
          $scope.$apply();
        }
      });

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
          // this_.$scope.$apply(function () {
          //   this_.$scope.btnShow = true;
          // });
        })
        .mouseleave(function () {
          $('#widget-container-layerinfo .widget-header').addClass('invisible');
          // this_.$scope.$apply(function () {
          //   this_.$scope.btnShow = false;
          // });
        });

      // nvd3 mouse event
      $('.vl-div-global').on('nvd3-mouse-hover', function (evt, msg) {
        this_.Pip.emitTimeMouseMove({ point: [msg, 0], x: 0, y: 0, k: 1 });
      });

    }

    private _treeDataConstruction(data) {
      let r = [];
      for (let d of data) {
        r.push({ name: d.name, level: 'level1' });
        if (d.nodes) {
          let first = true;
          for (let dd of d.nodes) {
            let ft = false;
            if (first) { ft = true; first = false; }
            r.push({ name: dd.name, level: 'level2', parent: d, first: ft });
            let sFirst = true;
            for (let ddd of dd.nodes) {
              let sft = false;
              if (sFirst) { sft = true; sFirst = false; }
              r.push({ name: ddd.name, level: 'level3', parent: dd, first: sft });
            }
          }
        }
      }
      return r;
    }

    private _processData(type, ...rest: any[]) {
      let this_ = this;
      let result = {};
      let [layers, data] = [rest[0], rest[1]],
        [min, max] = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      let count = 0;
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
        case 'stat_hgraph':
          let hack = [
            0.352123213,
            0.342123213,
            0.322123213,
            0.312123213,
            0.305363213,
            0.302123213,
            0.262123213,
            0.252123213,
            0.242123213,
            0.212123213,
            0.202123213,
            0.182123213,
            0.162123213,
            0.162123213,
            0.162123213,
            0.162123213,
            0.162123213,
            0.162123213,
            0.158123213,
            0.157123213,
            0.155123213
          ];
          _.each(layers, (v) => {

            result[v.name] = _.map(data, (dv: any) => {
              // special dy
              // if (v.lid === 0) {
              //   // dv.value[v.lid] /= 6;
              //   if (count < 21) {
              //     dv.value[v.lid] = hack[count];
              //   } else {
              //     dv.value[v.lid] /= 2;
              //   }
              //   console.log(dv.value[v.lid]);
              //   count += 1;
              // }
              // special dy
              min = dv.value[v.lid] < min ? dv.value[v.lid] : min;
              max = dv.value[v.lid] > max ? dv.value[v.lid] : max;
              return [dv.iter, dv.value[v.lid]];
            });
          });
          return [result, min, max];
        case 'hl_stat_hgraph':
          _.each(layers, name => {
            result[name] = _.map(data, (dv: any) => {
              min = dv.value[name] < min ? dv.value[name] : min;
              max = dv.value[name] > max ? dv.value[name] : max;
              return [dv.iter, dv.value[name]];
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
      let this_ = this;
      let options;
      switch (type) {
        case 'sparklinePlus':
          options = {
            chart: {
              type: 'sparklinePlus',
              width: 757,
              height: 35,
              margin: {
                left: 0,
                right: 0,
                top: 1,
                bottom: 0
              },
              showLastValue: false,
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
              height: 35,
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
            height: 35,
            cellWidth: 1,
            marginTop: 1,
            margin: {
              top: 1,
              right: 0,
              bottom: 1,
              left: 0
            },
            ratio: null
          };
          break;
        case 'heatline':
          options = {
            width: this_.Global.getData('iter').num,
            height: 12,
            cellWidth: 1,
            color: d4.scaleSequential(d4.interpolateGnBu),
            // color: d4.scaleSequential(d4.interpolateBlues),
            margin: {
              top: 1,
              right: 0,
              bottom: 0,
              left: 0
            },
            type: 'kernel',
            lineChart: false
          };
          break;
        case 'horizonGraph':
          options = {
            width: this_.Global.getData('iter').num,
            height: 35,
            cellWidth: 1,
            marginTop: 1,
            color: d4.scaleSequential(d4.interpolateBlues),
            margin: {
              top: 1,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          break;
        case 'pixelChartWithLine':
          options = {
            width: 757,
            height: 60,
            cellWidth: 1,
            pixelChart: true,
            lineChart: false,
            color: d4.scaleSequential(d4.interpolateGnBu),
            // color: d4.scaleSequential(d4.interpolateYlOrBr),
            // color: d4.scaleSequential(d4.interpolateBlues),
            marginTop: 2,
            marginBottom: 2,
            margin: {
              top: 2,
              right: 0,
              bottom: 2,
              left: 0
            }
          };
          break;
        default:
          return null;
        // alert('wrong chart type');
      }
      return options;
    }
  }

  angular
    .module('vis')
    .controller('LayerController', Controller);
}
