'use strict';

namespace application {

  interface IScope extends ng.IScope {
    options: any;
    data: {};
    dataTree: any[];
    opened: {};
    layers: {};
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'DataManager', 'Global', '$q', '$http'
    ];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      public Global: IGlobalService,
      $q: ng.IQService,
      $http: ng.IHttpService
    ) {
      let this_ = this;
      let selectedLayers = [];
      $q.all([
        DataManager.fetchInfo({ db: Global.getSelectedDB(), type: 'layer' }),
        $http.get('/json/tree.json')
      ]).then((data: any) => {
        for (let o of data[0]) {
          selectedLayers.push(o.lid);
        }
        $scope.layers = _.keyBy(data[0], (o: any) => o.name); // turn array to object with key layername
        data[1] = data[1].data;
        $scope.opened = {};
        for (let d of data[1]) {
          $scope.opened[d.name] = true;
          if (d.nodes) {
            $scope.opened[d.name] = false;
            for (let dn of d.nodes) {
              dn.parent = d.name;
              $scope.opened[dn.name] = false;
              if (dn.nodes) {
                for (let dnn of dn.nodes) {
                  dnn.parent = dn.name;
                  $scope.opened[dnn.name] = false;
                }
              }
            }
          }
        }
        $scope.dataTree = data[1];

        let opt: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'g_norm1',
          layer: selectedLayers,
          parser: 'json'
        };

        $scope.options = this_._setOptions('sparklinePlus');
        DataManager.fetchLayer(opt, false)
          .then((layerData: ILayerEle[]) => {
            let tmpData = this_._processData(
              $scope.layers,
              $scope.dataTree,
              layerData
            );
            $scope.data = tmpData[0];
            // $scope.options.chart.yDomain = [tmpData[1], tmpData[2]];
          });

        // $scope.data = volatileChart(25.0, 0.09, 30);
      });

      $('#widget-container-layerinfo')
        .mouseenter(function () {
          $('#widget-container-layerinfo .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-layerinfo .widget-header').addClass('invisible');
        });

      $scope.open = function (d, level) {
        level = ' .level' + level;
        if (!$scope.opened[d.name]) {
          $('#' + d.name + level)
            .show(200, 'swing');
          // .removeClass('no-disp');
        } else {
          $('#' + d.name + level)
            .hide(200, 'swing');
          // .addClass('no-disp');
        }
        $scope.opened[d.name] = !$scope.opened[d.name];
      };

      function sine() {
        let sin = [];
        let now = +new Date();

        for (let i = 0; i < 100; i++) {
          sin.push({ x: now + i * 1000 * 60 * 60 * 24, y: Math.sin(i / 10) });
        }

        return sin;
      }

      function volatileChart(startPrice, volatility, numPoints) {
        let rval = [];
        let now = +new Date();
        numPoints = numPoints || 100;
        for (let i = 1; i < numPoints; i++) {

          rval.push({ x: now + i * 1000 * 60 * 60 * 24, y: startPrice });
          let rnd = Math.random();
          let changePct = 2 * volatility * rnd;
          if (changePct > volatility) {
            changePct -= (2 * volatility);
          }
          startPrice = startPrice + startPrice * changePct;
        }
        return rval;
      }

    }

    private _processData(layers, dataTree, dataLayer) {
      let this_ = this;
      let [min, max] = [9999999, -9999999];
      let result = {};
      _.each(layers, (v) => {
        result[v.name] = _.map(dataLayer, (dv: any) => {
          min = dv.value[v.lid] < min ? dv.value[v.lid] : min;
          max = dv.value[v.lid] > max ? dv.value[v.lid] : max;
          return {x: dv.iter, y: dv.value[v.lid]};
        });
      });
      // function calc(d, o) {
      //   if (!d.nodes) {
      //     let l = layers[d.name];
      //     return {
      //       iter: o.iter,
      //       size: l.channels * l.kernelNum * l.kernelWidth * l.kernelHeight,
      //       value: o.value[l.lid]
      //     };
      //   }
      //   let size = 0, value = 0;
      //   for (let node of d.nodes) {
      //     let sub = calc(node, o);
      //     size += sub.size;
      //     value +=
      //   }
      //   return {
      //     iter: o.iter,
      //     size, value
      //   };
      // }
      return [result, min, max];
    }

    private _setOptions(type) {
      let options;
      switch (type) {
        case 'sparklinePlus':
          options = {
            chart: {
              type: 'sparklinePlus',
              height: 70,
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
