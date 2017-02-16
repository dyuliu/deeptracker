'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
    typeList: string[];
    clsList: string[];
    selectedDB: IInfoDBEle;
    selectedType: { value: string };
    selectedCls: string[];
    range: { start: number, end: number };
    data?: IImgDataType;
    options: any;  // options for img directive
    dataEvent?: any[];
    optionsEvent?: any;
    dataOutlierLeft?: any[];
    dataOutlierRight?: any[];
    optionsOutlier?: any;
    render(): void;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService,
      public $q: ng.IQService
    ) {
      let this_ = this;
      DataManager.fetchInfo({ type: 'db' }).then(data => {
        $scope.dbList = data;
        $scope.selectedDB = data[1];
      });

      $scope.clsList = Global.getImgTypeList().cls;
      $scope.typeList = Global.getImgTypeList().type;
      $scope.range = { start: 0, end: 1200000 };
      $scope.data = [];
      $scope.dataEvent = [];
      $scope.selectedType = { value: $scope.typeList[0] };

      $scope.options = this_._setOption('pixelChart');
      $scope.optionsEvent = this_._setOption('eventChart');
      $scope.optionsOutlier = this_._setOption('outlierChart');

      $scope.render = function () {
        $scope.optionsEvent.chart.height = 250;
        $scope.optionsOutlier.chart.height = 250;

        let opt0 = {
          db: Global.getSelectedDB(),
          type: 'outlier',
          parser: 'json'
        };
        DataManager.fetchImg(opt0, false)
          .then(data => {
            $scope.dataOutlierLeft = this_._process(data, 'outlier', 'left');
            $scope.dataOutlierRight = this_._process(data, 'outlier', 'right');
          });

        let opt1 = {
          db: Global.getSelectedDB(),
          type: 'event',
          parser: 'json'
        };
        DataManager.fetchImg(opt1, false)
          .then(data => { $scope.dataEvent = this_._process(data, 'event'); });

        // let opt2 = {
        //   db: $scope.selectedDB.name,
        //   type: 'testinfo',
        //   range: $scope.range,
        //   cls: $scope.selectedCls,
        //   parser: 'json'
        // };
        // console.time('render');

        // DataManager.fetchImg(opt2, true)
        //   .then(data => { $scope.data = data; });
      };
    }
    // end of constructor

    private _process(data: any[], type, ...rest: any[]): any {
      let this_ = this;
      let r;
      // {key: xxx, values: [xxx, xxx]}
      if (type === 'event') {
        r = [
          { key: 'n-y', values: [] },
          { key: 'y-n', values: [] },
          { key: 'y-y', values: [] },
          { key: 'n-n', values: [] },
        ];
        for (let o of data) {
          for (let i = 0; i < 4; i += 1) {
            // r[i].values.push({ x: o.iter, y: o.event[i] });
            r[i].values.push([o.iter, o.event[i]]);
          }
        }
      } else if (type === 'outlier') {
        // do some to r
        r = [];
        // let keys = [10, 20, 30, 40, 50, 60, 70, 80, 90, 99];
        let keys = [20, 40, 60, 80];
        for (let key of keys) {
          r.push({key});
          let tmp = _.map(data, (d: any) => {
            return { x: d.iter, y: d[rest[0]][key] };
          });
          r[r.length - 1].values = tmp;
        }
        console.log(r);
      }
      return r;
    }

    private _setOption(type: string) {
      let options;
      if (type === 'outlierChart') {
        // do some
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
          },
          title: {
            enable: true,
            text: 'Outlier Chart'
          },
        };
      } else if (type === 'eventChart') {
        options = {
          chart: {
            type: 'stackedAreaChart',
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
          },
          title: {
            enable: true,
            text: 'Event Chart'
          },
        };
      } else if (type === 'pixelChart') {
        options = {
          height: 13000,
          width: 3000,
          margin: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        };
      }

      return options;
    }
  }
  angular
    .module('vis')
    .controller('ImgController', Controller);
}
