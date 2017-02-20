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
    optionsHeatLine: any;
    optionsDetail: any;
    dataModel: any;
    dataCls: any;
    dataDetail: any;
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

      let optTestError: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'test_error',
        parser: 'json'
      };
      let optStat: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'model_stat',
        parser: 'json'
      };
      let optClsStat: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'cls_stat',
        cls: ['n03544143'],
        parser: 'json'
      };
      let optDetail: IHTTPOptionConfig = {
        db: Global.getSelectedDB(),
        type: 'detail',
        cls: ['n03544143'],
        parser: 'json'
      };
      $q.all([
        DataManager.fetchRecord(optTestError),
        DataManager.fetchImg(optStat, false),
        DataManager.fetchImg(optClsStat, false),
        DataManager.fetchImg(optDetail, false)
      ]).then(data => {
        $scope.dataModel = {
          testError: data[0],
          abnormal: _.map(data[1], (d: any) => {
            return {iter: d.iter, value: d.abLeft};
          }),
          max: d4.max(data[1], (d: any) => d.abLeft)
        };
        $scope.dataCls = {
          testError: _.map(data[2], (d: any) => {
            return {iter: d.iter, value: d.testError};
          }),
          abnormal: _.map(data[2], (d: any) => {
            return {iter: d.iter, value: d.abLeft};
          }),
          max: $scope.dataModel.max
        };


        // mds
        // let coordinate = LG.utils.Mds.mds(simMatrix);
        let pixelChart: any = _.map(data[3], (d: any) => {
          let correct = _.map(d.answer, o => o === d.label ? 1 : 0);
          return {iter: d.iter, value: correct, file: d.file};
        });
        let distMatrix = [];
        let pLength = pixelChart.length;
        let max = -1;
        for (let i = 0; i < pLength; i += 1) {
          distMatrix.push(Array(pLength).fill(0));
          distMatrix[i][i] = 0;
          for (let j = i - 1; j >= 0; j -= 1) { distMatrix[i][j] = distMatrix[j][i]; }
          for (let j = i + 1; j < pLength; j += 1) {
            distMatrix[i][j] = computeDist(pixelChart[i].value, pixelChart[j].value);
            if (distMatrix[i][j] > max) { max = distMatrix[i][j]; }
          }
        }
        let fs = d4.scaleLinear().range([0, 1]).domain([0, max]).clamp(true);
        for (let i = 0; i < pLength; i += 1) {
          for (let j = 0; j < pLength; j += 1) {
            distMatrix[i][j] = fs(distMatrix[i][j]);
          }
        }
        let coordinate = _.map(LG.utils.Mds.mds(distMatrix, 1), (d, i) => {
          return [i, d[0]];
        });
        coordinate = _.sortBy(coordinate, d => d[1]);
        console.log('coordinate', coordinate);
        for (let i = 0; i < pixelChart.length; i += 1) { pixelChart[i].index = coordinate[i][0]; }
        $scope.dataDetail = {
          pixelChart: pixelChart,
          lineChart: $scope.dataCls.testError
        };
      });

      function computeDist (veca, vecb) {
        let size = veca.length;
        let dist = 0;
        for (let i = 0; i < size; i += 1) {
          dist += veca[i] !== vecb[i] ? 1 : 0;
        }
        return dist;
      }

      function computeDist2 (veca, vecb) {
        return  1 - numeric.dot(veca, vecb) / ( numeric.norm2(veca) * numeric.norm2(vecb) );
      }

      $scope.optionsHeatLine = {
        width: 900,
        height: 100,
        cellWidth: 1,
        margin: {
          top: 10,
          right: 20,
          bottom: 10,
          left: 20
        }
      };
      $scope.optionsDetail = {
        width: 900,
        height: 100,
        cellWidth: 1,
        margin: {
          top: 10,
          right: 20,
          bottom: 10,
          left: 20
        }
      };
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
          r.push({ key });
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
    .controller('LabelController', Controller);
}
