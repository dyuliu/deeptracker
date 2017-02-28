'use strict';

namespace application {

  interface IScope extends ng.IScope {
    options: {};
    data: {};
    kData: {};
    dataTree: any[];
    opened: {};
    open: any;    // func to open hl layer
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
      // $scope.kData = [1, 2, 3, 4, 5];

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

      function act(conf) {
        let globalData = Global.getData();
        let layerArray = globalData.info.layer,
          tree = globalData.tree,
          iterSet = globalData.iter.set;
        allLayers = _.map(layerArray, (d: any) => d.lid);
        layers = _.keyBy(layerArray, (o: any) => o.name); // turn array to object with key layername
        $scope.opened = {};
        $scope.options = {};

        // init tree
        for (let d of tree) {
          $scope.opened[d.name] = true;
          $scope.options[d.name] = this_._setOptions('sparklinePlus');
          if (d.nodes) {
            hlLayers.push(d.name);
            $scope.opened[d.name] = false;
            for (let dn of d.nodes) {
              dn.parent = d.name;
              $scope.opened[dn.name] = false;
              $scope.options[dn.name] = this_._setOptions('sparklinePlus');
              if (dn.nodes) {
                hlLayers.push(dn.name);
                for (let dnn of dn.nodes) {
                  dnn.parent = dn.name;
                  $scope.opened[dnn.name] = false;
                  $scope.options[dnn.name] = this_._setOptions('sparklinePlus');
                  // $scope.options[dnn.name].height = layers[dnn.name].kernelNum + 20;
                };
              }
            }
          }


        }
        $scope.dataTree = tree;

        /*--- kernel detail data ---*/
        // let opt: IHTTPOptionConfig = {
        //   db: Global.getSelectedDB(),
        //   type: 'w_norm1',
        //   layer: allLayers.slice(0, 3),
        //   parser: 'json'
        // };
        // DataManager
        //   .fetchKernel(opt, true)
        //   .then(dataKernel => {
        //     $scope.data = this_._processData('kernel', layers, dataKernel);
        //     console.log('$scope.data', $scope.data);
        //   });

        let type = conf.gw + '_' + conf.type;
        /*--- layer stat data ---*/
        let opt: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: conf.gw + '_' + conf.type,
          // layer: allLayers,
          parser: 'json'
        };

        let optHL: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'hl_' + conf.gw + '_' + conf.type,
          // layer: allLayers,
          parser: 'json'
        };

        $q.all([
          DataManager.fetchLayer(opt, false),
          DataManager.fetchLayer(optHL, false)
        ]).then(layerData => {
          $scope.data = {};
          layerData[0] = _.filter(layerData[0], (d: any) => iterSet.has(d.iter));
          layerData[1] = _.filter(layerData[1], (d: any) => iterSet.has(d.iter));
          _.merge(
            $scope.data,
            this_._processData('stat', layers, layerData[0])[0],
            this_._processData('hl_stat', hlLayers, layerData[1])[0]
          );
          console.log($scope.data);
        });

        /*--- layer stat data ---*/
        // let opt: IHTTPOptionConfig = {
        //   db: Global.getSelectedDB(),
        //   type: 's_cratio',
        //   layer: allLayers,
        //   seqidx: [10, 20, 30],
        //   parser: 'json'
        // };

        // let optHL: IHTTPOptionConfig = {
        //   db: Global.getSelectedDB(),
        //   type: 'hl_s_cratio',
        //   seqidx: [10, 20, 30],
        //   parser: 'json'
        // };

        // $q.all([
        //   DataManager.fetchLayer(opt, false),
        //   DataManager.fetchLayer(optHL, false),
        // ]).then(layerData => {
        //   $scope.data = {};
        //   _.merge(
        //     $scope.data,
        //     this_._processData('seq', layers, layerData[0]),
        //     this_._processData('hl_seq', hlLayers, layerData[1])
        //   );
        //   console.log($scope.data);
        // });
      }

      $scope.open = function (d, level) {
        level = ' .level' + level;
        if (!$scope.opened[d.name]) {
          $('#' + d.name + level)
            .show(200, 'linear');
        } else {
          $('#' + d.name + level)
            .hide(200, 'linear');
        }
        $scope.opened[d.name] = !$scope.opened[d.name];
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
        case 'seq':
          _.each(data, d => {
            let layer: any = _.find(layers, { lid: +d.key });
            result[layer.name] = { iter: d.domain, value: d.values };
          });
          return result;
        case 'hl_seq':
          _.each(data, d => {
            result[d.key] = { iter: d.domain, value: d.values };
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
              y: function (d, i) { return d.y; },
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
        case 'pixelChartWithLine':
          options = {
            width: 757,
            height: 60,
            cellWidth: 1,
            pixelChart: true,
            lineChart: false,
            margin: {
              top: 2,
              right: 0,
              bottom: 2,
              left: 0
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
