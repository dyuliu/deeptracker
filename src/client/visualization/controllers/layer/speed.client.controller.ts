'use strict';

namespace application {

  interface ISpeedDataEle {
    iter: number;
    cid: number;
    points: any;
  }

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
    layerList: IInfoLayerDataType;
    typeList: string[];
    selectedDB: IInfoDBEle;
    selectedLayer: number;
    selectedType: { value: string };
    data: any[];  // nvd3 chart data
    options: any;
    render(): void;
    clean(): void; // clean current data in chart
  }

  export class SpeedController {
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
      DataManager.fetchInfo({ type: 'layer' }).then(data => {
        $scope.layerList = data;
        // $scope.selectedLayer = [data[0]];
      });
      $scope.typeList = Global.getLayerTypeList().weight
        .concat(Global.getLayerTypeList().gradient);

      $scope.data = [];
      $scope.options = this_._setOption();

      $scope.clean = function () {
        $scope.data = [];
      };

      $scope.render = function () {
        let opt: IHTTPOptionConfig = {
          db: $scope.selectedDB.name,
          type: $scope.selectedType.value,
          parser: 'json'
        };
        DataManager
          .fetchLayer(opt, false)
          .then((data: ILayerEle[]) => {
            $scope.data = this_._process(data);
            console.log($scope.data);
          });
      };
    }

    // private methods
    private _process(data: any[]) {
      let this_ = this;
      let m = new Map();
      let r = [];
      _.each(data, d => {
        _.each(d.value, (val, lid) => {
          if (m.has(lid)) {
            r[m.get(lid)].values.push([d.iter, val]);
          } else {
            r.push({key: lid, values: [[d.iter, val]]});
            m.set(lid, r.length - 1);
          }
        });
      });

      // iteration sample
      let range = _.range(0, r[0].values.length, 5);
      r = _.map(r, d => {
        let tmpValues = [];
        for (let i of range) { tmpValues.push(d.values[i]); }
        return {
          key: d.key,
          values: tmpValues
        };
      });



      // let type = this_.$scope.selectedType.value;
      // if (type === 'w_norm1' || type === 'w_norm2' ||
      //   type === 'g_norm1' || type === 'g_norm2') {
      //   _.each(this_.$scope.layerList, (d: any, lid) => {
      //     let size = (d.channels * d.kernelNum * d.kernelHeight * d.kernelWidth);
      //     if (r[lid]) {
      //       _.each(r[lid].values, (dd) => { dd[1] /= size; });
      //     }
      //   });
      // }
      // r = _.sampleSize(r, 10);
      r = _.sortBy(r, o => +o.key);
      r.splice(1, 1);
      r.splice(r.length - 1, 1);
      return r;
    }

    private _setOption() {
      let options;
      options = {
        chart: {
          type: 'stackedAreaChart',
          color: d3.scale.category10().range(),
          height: 900,
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
              return d3.format('.5r')(d);
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
          },
          style: 'expand'
        }
      };
      return options;
    }
  }

  angular
    .module('vis')
    .controller('SpeedController', SpeedController);
}
