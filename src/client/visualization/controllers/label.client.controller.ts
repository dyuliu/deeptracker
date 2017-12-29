'use strict';

namespace application {

  interface IScope extends ng.IScope {
    optionsHeatLine: any;
    optionsDetail: any;
    optionsCls: {};
    optionsMatrix: {};
    dataModel: any;
    dataMatrix: any;
    dataCls: any;
    dataDetail: any;
    selectedCls: any[];
    open: any;
    flip: any;
    click: any;
    showModal: any;
    btnShow: any;
    aggregations: any[];
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'DataManager', 'Global', '$q',
      'Pip', '$timeout', '$modal', '$rootScope', '$http'
    ];

    constructor(
      public $scope: IScope,
      public DataManager: IDataManagerService,
      public Global: IGlobalService,
      public $q: ng.IQService,
      public Pip: IPipService,
      public $timeout: ng.ITimeoutService,
      public $modal,
      public $rootScope,
      public $http: ng.IHttpService
    ) {
      let self = this;
      let first;

      let previous_conf = null;
      self._init();
      let modal = $modal({
        scope: $scope,
        templateUrl: 'src/client/visualization/views/tpls/img-modal.client.tpls.html',
        show: false,
        controller: 'ImgModalController',
        keyboard: true
      });

      function updateContainerHeight() {
        setTimeout(function () {
          // console.log($('.label-chart').height());
          // console.log($('div[heatline]').height());
          $('#widget-container-labelinfo').height($('.label-chart').height());
          updateContainerHeight();
        }, 3000);
      }
      updateContainerHeight();


      $scope.showModal = function (name, type) {
        modal.$scope.cls = name;
        modal.$scope.type = 'class';
        modal.$promise.then(modal.show);
      };

      Pip.onShowModal($scope, (msg: any) => {
        modal.$scope.name = msg.key;
        modal.$scope.cls = msg.cls;
        modal.$scope.type = 'file';
        modal.$promise.then(modal.show);
      });

      $scope.click = function (type: string, clsName?: string) {
        if (type === 'open') {
          $scope.open = !$scope.open;
          if ($scope.open) {
            // $scope.selectedCls = Global.getData('info').cls;
            // fetch dataCls
          }
        } else if (type === 'flip') {
          $scope.flip[clsName] = !$scope.flip[clsName];
          $scope.optionsCls[clsName].triangle = Global.getConfig('label').triangle;
          if ($scope.flip[clsName]) {
            showDetail(clsName);
          }
        } else if (type === 'zoomin') {
          $scope.$broadcast('zoom', { type: 'in', cls: clsName });
        } else if (type === 'zoomout') {
          $scope.$broadcast('zoom', { type: 'out', cls: clsName });
        }
      };


      Pip.onTimeChanged($scope, (iter) => {
        console.log('select iter: ', iter);
      });
      Pip.onModelChanged($scope, (msg) => {
        first = true;
        // act();
      });
      Pip.onLabelConfigChanged($scope, (conf: any) => {
        if (conf.show === true) { act(conf); }
      });

      function showDetail(clsName: string) {
        DataManager.fetchImg({
          db: Global.getSelectedDB(),
          type: 'detail',
          cls: [clsName],
          parser: 'json'
        }, false).then((data: any) => {

          $scope.optionsDetail[clsName] = self._setOptions('pixelChartWithLine', data.length);
          $scope.optionsDetail[clsName].threshold = $scope.optionsCls[clsName].threshold;
          $scope.optionsDetail[clsName].max = $scope.optionsCls[clsName].max;

          $scope.dataDetail[clsName] = {
            pixelChart: data,
            lineChart: $scope.dataCls[clsName].linechartData
          };
        });
      }

      function act(conf) {
        if (first) {
          $scope.optionsHeatLine = self._setOptions('heatline');
          $scope.optionsHeatLine.height = 100;
          let gd = Global.getData();

          $scope.dataModel = {
            heatmapData: Global.getData('record').testError,
            linechartData: gd.label.modelStat,
            max: d4.max(gd.label.modelStat, (d: any) => d.value)
          };

          $scope.optionsCls = {};
          $scope.dataCls = self._processData('cls_heatline', gd.label.clsStat, $scope.dataModel.max);
          gd.label.clsStat = null;

          first = false;
        }

        let selectedCls = [], maxPMax = Number.MIN_SAFE_INTEGER;
        _.each($scope.dataCls, (d: any, k) => {
          if (d.pmax > maxPMax) { maxPMax = d.pmax; }
          // if (d.rpmax > maxPMax) { maxPMax = d.rpmax; }
        });

        let root = '/assets/images/gallery/';
        let currentDBName = self.Global.getSelectedDB();
        if (_.startsWith(currentDBName, 'imagenet')) {
          root += 'imagenet/';
        } else if (_.startsWith(currentDBName, 'cifar')) {
          root += 'cifar/';
        }

        /******************* tist revision - bg ********************/
        // computer clusters
        self._cluster($scope.dataCls, clusterResult => {
          // than aggregate clusters
          let aggregationResult = self._aggregate(clusterResult);
          console.log('final cluster & aggre result: ', aggregationResult);
          let rankedResult = self._rank(aggregationResult);
          $scope.aggregations = [];
          _.each(rankedResult, r => {
            $scope.aggregations.push({
              classes: r.classes,
              data: {
                heatmapData: r.data
              },
              options: self._setOptions('heatline', 25)
            });
          });
        });
        /******************* tist revision - ed ********************/


        _.each($scope.dataCls, (d: any, k) => {
          let findedCls = _.find(Global.getData('info').cls, (o: any) => o.name === k);
          let firstFile = findedCls.file[0];
          // if (d.pmax >= conf.threshold || d.rpmax >= conf.threshold) {
          if (d.pmax >= conf.threshold) {
            $scope.optionsCls[k] = self._setOptions('heatline');
            $scope.optionsCls[k].threshold = conf.threshold;
            $scope.optionsCls[k].triangle = conf.triangle;
            $scope.optionsCls[k].immediate = conf.immediate;
            $scope.optionsCls[k].max = maxPMax;
            selectedCls.push({ name: k, pmax: d.pmax, file: root + k + '/' + firstFile });
          }
        });

        if (selectedCls.length > 588) {
          selectedCls = selectedCls.slice(0, 588);
        }
        console.log($scope.dataCls);
        if (conf.mds && selectedCls.length < 600) {
          console.log('calc mds !!');
          let tmp = [];
          _.each(selectedCls, d => {
            let v = _.map($scope.dataCls[d.name].heatmapData, (o: any) => o.value);
            tmp.push({ name: d.name, value: v });
          });
          tmp = mdsLayout(tmp);
          $scope.selectedCls = [];
          for (let i = 0; i < selectedCls.length; i += 1) {
            $scope.selectedCls.push(selectedCls[tmp[i]]);
          }
        } else {
          $scope.selectedCls = _.reverse(_.sortBy(selectedCls, ['pmax']));
        }

        let iterInfo = Global.getData('iter');
        let iterSet = new Set();
        let rec = [];
        let resMap = new Map();

        let orderStr = '';
        for (let i = 0; i < $scope.selectedCls.length; i += 1) {
          rec.push(new Set());
          let cc = 0;
          let d = $scope.dataCls[$scope.selectedCls[i].name].linechartData;
          for (let j = 0; j < d.length; j += 1) {
            if (d[j].value >= conf.threshold) { cc += 1; iterSet.add(iterInfo.array[j]); rec[i].add(iterInfo.array[j]); }
            if (d[j].valueR >= conf.threshold) {
              if (j + 1 < iterInfo.array.length) {
                cc += 1;
                iterSet.add(iterInfo.array[j + 1]); rec[i].add(iterInfo.array[j + 1]);
              }
            }
          }
          // !!!! delete cls with outlier iter only once
          if (cc < 2) { $scope.selectedCls.splice(i, 1); i -= 1; }
        }

        // manual order
        let orderArr = [
          'n11879895',
          'n02489166',
          'n11939491',
          'n04487081',
          'n03344393',
          'n03447447',
          'n04562935',
          'n02509815',
          'n02510455',
          'n01531178',
          'n02951358',
          'n04153751',
          'n06359193',
          'n03590841',
          'n02965783',
          'n02280649',
          'n03888257',
          'n01930112',
          'n02782093',
          'n02690373',
          'n07730033',
          'n03956157',
          'n04019541',
          'n04398044',
          'n01910747',
          'n02096051',
          'n10565667',
          'n03791053',
          'n02097209',
          'n12998815',
          'n04147183',
          'n01773157',
          'n04536866',
          'n01773797',
          'n03447721',
          'n02895154'
        ];

        // order as specified order
        let tmpCls = [];
        for (let o of orderArr) {
          let idx = _.findIndex($scope.selectedCls, d => d.name === o);
          tmpCls.push($scope.selectedCls[idx]);
        }
        $scope.selectedCls = tmpCls;

        let allQuery = {};
        let parser = 'json', type = 'i_cosine', db = Global.getSelectedDB();
        iterSet.forEach((v) => {
          allQuery[v] = DataManager.fetchKernel({ db, type, iter: v, parser }, false);
        });
        let lidtoName = {};
        $('#correlation-data-loading').removeClass('invisible');
        $q.all(allQuery).then((data: any) => {
          for (let i = 0; i < $scope.selectedCls.length; i += 1) {
            rec[i].forEach((v) => {
              let d = data[v];
              for (let j = 0; j < d.length; j += 1) {
                if (!lidtoName[d[j].lid]) { lidtoName[d[j].lid] = d[j].name; }
                if (!resMap.has(d[j].lid)) { resMap.set(d[j].lid, {}); }
                let o = resMap.get(d[j].lid);
                if (!o[i]) { o[i] = {}; };
                if (!o[i][v]) { o[i][v] = [rec[i]]; }
                o[i][v].push(d[j].idx);
              }
            });
          }
          Pip.emitCorrelationReady({
            data: resMap,
            options: {
              class: $scope.selectedCls,
              classNum: $scope.selectedCls.length,
              lidtoName,
              rec,
              width: 1000,
              height: 1000,
              minHeight: 6,
              minWidth: 6,
              threshold: 4,
              h: 3,
              w: 6,
              margin: {
                top: 100,
                right: 5,
                bottom: 5,
                left: 175
              }
            }
          });
          $('#correlation-data-loading').addClass('invisible');
        });

      }

      function mdsLayout(data) {
        let result = [];
        let distMatrix = [];
        let length = data.length;
        let max = -1;
        for (let i = 0; i < length; i += 1) {
          distMatrix.push(Array(length).fill(0));
          distMatrix[i][i] = 0;
          for (let j = i - 1; j >= 0; j -= 1) { distMatrix[i][j] = distMatrix[j][i]; }
          for (let j = i + 1; j < length; j += 1) {
            distMatrix[i][j] = computeDist2(data[i].value, data[j].value);
            if (distMatrix[i][j] > max) { max = distMatrix[i][j]; }
          }
        }

        let fs = d4.scaleLinear().range([0, 1]).domain([0, max]).clamp(true);
        for (let i = 0; i < length; i += 1) {
          for (let j = 0; j < length; j += 1) {
            distMatrix[i][j] = fs(distMatrix[i][j]);
          }
        }
        let coordinate = _.map(LG.utils.Mds.mds(distMatrix, 1), (d, i) => {
          return [i, d[0]];
        });
        coordinate = _.sortBy(coordinate, d => d[1]) as any;
        for (let i = 0; i < data.length; i += 1) {
          let idx = coordinate[i][0];
          result.push(idx);
        }
        return result;
      }

      function computeDist(va, vb) {
        let size = va.length;
        let dist = 0;
        for (let i = 0; i < size; i += 1) {
          dist += va[i] !== vb[i] ? 1 : 0;
        }
        return dist;
      }

      // cos
      function computeDist2(va, vb) {
        let nva = numeric.norm2(va);
        let nvb = numeric.norm2(vb);
        if (nva !== 0 && nvb !== 0) {
          return 1 - numeric.dot(va, vb) / (numeric.norm2(va) * numeric.norm2(vb));
        }
        return 1;
      }

    }
    // end of constructor

    private _init() {

      let self = this;
      let cls = self.Global.getData('info').cls;
      self.$scope.open = false;
      self.$scope.flip = {};
      self.$scope.optionsDetail = {};
      _.each(cls, c => {
        self.$scope.flip[c.name] = false;
      });
      self.$scope.dataDetail = {};

      self.$timeout(function () {
        $('#widget-container-labelinfo .scrollable').each(function () {
          let $this = $(this);
          $(this).ace_scroll({
            size: $this.attr('data-size') || 100,
          });
        });
      }, 100);

      $('#widget-container-labelinfo')
        .mouseenter(function () {
          $('#widget-container-labelinfo .widget-header:first-child').removeClass('invisible');
          self.$scope.$apply(function () {
            self.$scope.btnShow = true;
          });
        })
        .mouseleave(function () {
          $('#widget-container-labelinfo .widget-header:first-child').addClass('invisible');
          self.$scope.$apply(function () {
            self.$scope.btnShow = false;
          });
        });
    }
    private _processData(type, ...rest: any[]) {
      let self = this;
      let result = {};
      let data, max;
      switch (type) {
        case 'cls_heatline':
          [data, max] = [rest[0], rest[1]];
          for (let d of data) {
            if (!result[d.cls]) {
              result[d.cls] = { heatmapData: [], linechartData: [], max, pmax: -1, rpmax: -1 };
            }
            result[d.cls].heatmapData.push({ iter: d.iter, value: d.testError });
            result[d.cls].linechartData.push({ iter: d.iter, value: d.value, valueR: d.valueR });
            result[d.cls].pmax = result[d.cls].pmax < d.value ? d.value : result[d.cls].pmax;
            result[d.cls].rpmax = result[d.cls].rpmax < d.valueR ? d.valueR : result[d.cls].rpmax;
          }
          _.each(result, (d: any) => {
            d.heatmapData = _.sortBy(d.heatmapData, ['iter']);
            d.linechartData = _.sortBy(d.linechartData, ['iter']);
          });
          return result;
        case 'cls_pixelchart':
          break;
        default:
          break;
      }
    }

    private _setOptions(type, height?) {
      let self = this;
      let options;
      switch (type) {
        case 'heatline':
          options = {
            width: self.Global.getData('iter').num + 30,
            height: height ? height : 16,
            cellWidth: 1,
            color: d4.scaleSequential(d4.interpolateRdYlGn),
            margin: {
              top: 1,
              right: 30,
              bottom: 0,
              left: 0
            },
            type: 'cls',
            lineChart: false
          };
          break;
        case 'pixelChartWithLine':
          options = {
            width: self.Global.getData('iter').num + 30,
            height: height ? height + 20 : 50,
            cellWidth: 1,
            pixelChart: true,
            lineChart: true,
            // color: function (d) {
            //   if (d === 1) { return '#7fc97f'; } else { return '#fdc086'; };
            // },
            color: function (d) {
              if (d === 1) { return '#B6EB9D'; } else { return '#E88984'; };
            },
            marginTop: 9,
            marginBottom: 9,
            margin: {
              top: 0,
              right: 30,
              bottom: 0,
              left: 0
            }
          };
      }
      return options;
    }

    /******************* tist revision - bg ********************/

    private _cluster(data: any, cb: Function) {
      // do something
      console.log('cluster', data);
      let vectorsName = [];
      let vectors = _.map(data, (d: any, k) => {
        vectorsName.push(k);
        return _.map(d.heatmapData, (dd: any) => dd.value);
      });

      // vectors = vectors.slice(0, 10);
      // vectorsName = vectorsName.slice(0, 10);

      let msg: ng.IRequestConfig = {
        url: 'http://localhost:5001/api/v1/computing/cluster',
        method: 'POST',
        data: { vectors }
      };

      let output = {
        clusterNum: 0,
        labels: []
      };
      this.$http(msg).then(
        res => {
          let resData: any = res.data;
          output.clusterNum = resData.clusterNum;
          _.each(resData.labels, (label, i) => {
            output.labels.push({ cls: vectorsName[i], label });
          });
          cb(output);
        },
        err => {
          console.error(err);
        }
      );

      return null;
    }

    private _aggregate(data) {
      // do something
      let self = this;
      let result = [];

      let fileRoot = '/assets/images/gallery/';
      let currentDBName = self.Global.getSelectedDB();
      if (_.startsWith(currentDBName, 'imagenet')) {
        fileRoot += 'imagenet/';
      } else if (_.startsWith(currentDBName, 'cifar')) {
        fileRoot += 'cifar/';
      }

      for (let i = 0; i < data.clusterNum; i++) {
        // extract label i
        let filterdData = _.filter(data.labels, d => +d.label === +i);

        console.log('filteredData', filterdData);
        // init the aggregation result for current cluster
        let r = _.map(self.$scope.dataCls[filterdData[0].cls].heatmapData, (d: any) => {
          return {
            iter: d.iter,
            value: 0
          };
        });

        // sum
        _.each(filterdData, d => {
          let a = this.$scope.dataCls[d.cls].heatmapData;
          for (let j = 0; j < a.length; j++) {
            r[j].value += a[j].value;
          }
        });

        // average
        for (let j = 0; j < r.length; j++) {
          r[j].value /= filterdData.length;
        }

        result.push({
          data: r,
          classes: _.map(filterdData, d => {
            let findedCls = _.find(self.Global.getData('info').cls, (o: any) => o.name === d.cls);
            let firstFile = findedCls.file[0];
            return {
              one: fileRoot + d.cls + '/' + firstFile,
              name: d.cls
            }
          })
        });
      }

      return result;
    }

    private _rank(data) {
      // rank error rate
      _.each(data, (d: any) => {
        d.sum = _.sumBy(d.data, (o: any) => o.value);
      });
      let result = _.sortBy(data, ['sum']);
      return result;
    }

    /******************* tist revision - ed ********************/

  }
  angular
    .module('vis')
    .controller('LabelController', Controller);
}
