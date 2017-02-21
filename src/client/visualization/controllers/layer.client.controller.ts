'use strict';

namespace application {

  interface IScope extends ng.IScope {
    options: {};
    data: {};
    dataTree: any[];
    opened: {};
    layers: {};
    open: any;
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
        $scope.options = {};
        for (let d of data[1]) {
          $scope.opened[d.name] = true;
          $scope.options[d.name] = this_._setOptions('pixelChartWithLine');
          if (d.nodes) {
            $scope.opened[d.name] = false;
            for (let dn of d.nodes) {
              dn.parent = d.name;
              $scope.opened[dn.name] = false;
              $scope.options[dn.name] = this_._setOptions('sparklinePlus');
              if (dn.nodes) {
                for (let dnn of dn.nodes) {
                  dnn.parent = dn.name;
                  $scope.opened[dnn.name] = false;
                  $scope.options[dnn.name] = this_._setOptions('pixelChartWithLine');
                  $scope.options[dnn.name].height = $scope.layers[dnn.name].kernelNum + 20;
                };
              }
            }
          }
        }
        $scope.dataTree = data[1];

        let opt: IHTTPOptionConfig = {
          db: Global.getSelectedDB(),
          type: 'w_norm1',
          layer: selectedLayers.slice(0, 3),
          parser: 'json'
        };
        DataManager
          .fetchKernel(opt, true)
          .then(dataKernel => {
            $scope.data = this_._processData('kernel', $scope.layers, dataKernel);
            console.log('$scope.data', $scope.data);
          });

        // let opt: IHTTPOptionConfig = {
        //   db: Global.getSelectedDB(),
        //   type: 'g_norm1',
        //   layer: selectedLayers,
        //   parser: 'json'
        // };

        // $scope.options = this_._setOptions('sparklinePlus');
        // DataManager.fetchLayer(opt, false)
        //   .then((layerData: ILayerEle[]) => {
        //     let tmpData = this_._processData(
        //       'stat',
        //       $scope.layers,
        //       $scope.dataTree,
        //       layerData
        //     );
        //     $scope.data = tmpData[0];
        //   });

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

    }

    private _processData(type, ...rest: any[]) {
      let this_ = this;
      let result = {};
      let layers, dataTree, dataLayer, dataKernel;
      switch (type) {
        case 'kernel':
          [layers, dataKernel] = [rest[0], rest[1]];
          for (let d of dataKernel) {
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
          break;
        case 'stat':
          [layers, dataTree, dataLayer] = [rest[0], rest[1], rest[2]];
          let [min, max] = [9999999, -9999999];
          _.each(layers, (v) => {
            result[v.name] = _.map(dataLayer, (dv: any) => {
              min = dv.value[v.lid] < min ? dv.value[v.lid] : min;
              max = dv.value[v.lid] > max ? dv.value[v.lid] : max;
              return { x: dv.iter, y: dv.value[v.lid] };
            });
          });
          break;
        case 'seq':
          break;
        default:
          break;
      }
      return result;
      // return [result, min, max];
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
        case 'pixelChartWithLine':
          options = {
            width: 1200,
            height: 70,
            cellWidth: 1,
            pixelChart: true,
            lineChart: false,
            margin: {
              top: 10,
              right: 0,
              bottom: 10,
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
