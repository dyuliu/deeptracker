'use strict';
namespace application {

  interface IScope extends ng.IScope {
    selected: any;
    imgDataset: string[];
    models: { label: string, value: string }[];
    checkbox: any;
    config: any;
    timeSlider: any;
    spinnerChange: any;
    labelRender: any;
    recordTypeList: any;
    layerTypeList: any;
    pin: any;
    layerChartType: any;
    selectedRatio: any;
    ratioList: any;
    click: any; // emit event
    layerKernelScale: any;
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'DataManager', '$q', 'Global', 'Pip'
    ];

    constructor(
      public $scope: IScope,
      public DataManager: IDataManagerService,
      public $q: ng.IQService,
      public Global: IGlobalService,
      public Pip: IPipService
    ) {

      let this_ = this;
      // bug: to activate sidebar

      $scope.ratioList = Global.getRatioList();
      $scope.ratioList = Global.getRatioList();

      setTimeout(() => {
        $('#sidebar-collapse').trigger('click');
        if ($('#sidebar').hasClass('menu-min')) {
          $('#sidebar-collapse').trigger('click');
        };
      }, 100);

      this._setBtnEvent();
      this._setDBPanel();
      this._setVisPanel();

      $scope.$watch('config.correlation.show', (n: any, o) => {
        Pip.emitCorrelationConfigChanged($scope.config.correlation);
      });

      $scope.$watch('config.record', (n: any, o) => {
        Pip.emitRecordConfigChanged(n);
      }, true);

      $scope.$watch('config.label.show', (n: any, o) => {
        // let clsStat = this_.Global.getData('label').clsStat;
        // if (n.show && !o.show && !clsStat) {
        //   $scope.config.label.show = false;
        //   return;
        // }
        if (n === true) { Pip.emitLabelConfigChanged($scope.config.label); }
      }, true);

      $scope.$watch('config.label.triangle', (n: any, o) => {
        if (n === true) {
          $('polygon').css('display', 'inline');
        } else {
          $('polygon').css('display', 'none');
        }
      });

      $scope.$watch('config.label.immediate', (n: any, o) => {
        if (n === true) {
          $scope.config.label.abnormal = 0;
          $scope.config.label.threshold = 30;
        } else {
          $scope.config.label.abnormal = 30;
          $scope.config.label.threshold = 5;
        }
        let [db, parser] = [this_.Global.getSelectedDB(), 'json'];
        $('#label-data-loading').removeClass('invisible');
        this_.DataManager.fetchImg({ db, type: 'cls_stat', seqidx: [$scope.config.label.abnormal], cls: [], parser }, false)
          .then(data => {
            $('#label-data-loading').addClass('invisible');
            let labelData = this_.Global.getData('label');
            labelData.clsStat = data;
            if ($scope.config.label.show) { Pip.emitLabelConfigChanged($scope.config.label); }
          });
      });

      $scope.$watch('config.layer', (n: any, o) => {
        Pip.emitLayerConfigChanged(n);
      }, true);

      $scope.$watch('config.timebox', (n: any, o) => {
        Pip.emitTimeboxConfigChanged(n);
      }, true);
    }

    private _setBtnEvent() {
      let this_ = this;
      this_.$scope.pin = this_.Global.getConfig('timebox').pin;

      this_.$scope.click = function (eType) {
        switch (eType) {
          case 'pin':
            // this_.Pip.emitVlDiv(null);
            let cf = this_.Global.getConfig('timebox');
            cf.pin = !cf.pin;
            this_.$scope.pin = cf.pin;
            break;
          case 'reset':
            ace.data.remove('demo', 'widget-state');
            ace.data.remove('demo', 'widget-order');
            document.location.reload();
            break;
          case 'upload':
            console.log('upload your db file');
            break;
          case 'triangle':
            this_.Pip.emitLabelConfigChanged(this_.Global.getConfig('label'));
            break;
          case 'showTopKernel':
            this_.Pip.emitShowTopKernel(null);
            break;
          case 'hovering':
            let cff = this_.Global.getConfig('interaction');
            cff.hovering = !cff.hovering;
            break;
          default:
            break;
        };
      };
    }

    private _setDBPanel() {
      let this_ = this;
      this_.$scope.imgDataset = this_.Global.getImgDBList();
      this_.$scope.models = [];
      this_.$scope.selected = {
        imgDataset: 'imagenet',
        // model: 'imagenet-8x-1'
        // imgDataset: null,
        model: null
      };

      this_.$scope.$watch('selected.imgDataset', (n: any, o) => {
        if (!n) { return; }
        this_.$scope.models = this_.Global.getModelList()[n];
        if (n === 'imagenet') {
          this_.DataManager.loadJson('/json/imagenet-tree.json').then(data => {
            data = data.data;
            this_.Global.setData(data, 'tree');
          });
        } else if (n === 'cifar') {
          this_.DataManager.loadJson('/json/cifar-tree.json').then(data => {
            data = data.data;
            this_.Global.setData(data, 'tree');
          });
        }
      });

      this_.$scope.$watch('selected.model', (n: any, o) => {
        if (!n) { return; }
        this_.Global.setSelectedDB(n);
        let [db, parser] = [n, 'json'];
        // cached label cls stat
        $('#label-data-loading').removeClass('invisible');
        this_.DataManager.fetchImg({ db, type: 'cls_stat', seqidx: [this_.Global.getConfig('label').abnormal], cls: [], parser }, false)
          .then(data => {
            $('#label-data-loading').addClass('invisible');
            let labelData = this_.Global.getData('label');
            labelData.clsStat = data;
            console.log('cache ', this_.Global.getData('label'));
          });

        // // cached label cls stat
        $('#correlation-data-loading').removeClass('invisible');
        this_.DataManager.fetchKernel({ db, type: 'i_cosine_range', parser }, false)
          .then(data => {
            $('#correlation-data-loading').addClass('invisible');
            let correlationConf = this_.Global.getData('correlation');
            correlationConf.filterRange = data;
          });

        // // cached change ratio data
        // $('#layer-data-loading').removeClass('invisible');
        // this_.$q.all([
        //   this_.DataManager.fetchLayer({ db, type: 's_cratio', seqidx: [0], parser }, false),
        //   this_.DataManager.fetchLayer({ db, type: 'hl_s_cratio', seqidx: [0], parser }, false)
        // ]).then(data => {
        //   $('#layer-data-loading').addClass('invisible');
        // });

        // prefetch data
        this_.$q.all({
          infoLayer: this_.DataManager.fetchInfo({ db, type: 'layer' }),
          infoCls: this_.DataManager.fetchInfo({ db, type: 'cls' }),
          lr: this_.DataManager.fetchRecord({ db, type: 'lr', parser }),
          testError: this_.DataManager.fetchRecord({ db, type: 'test_error', parser }),
          trainError: this_.DataManager.fetchRecord({ db, type: 'train_error', parser }),
          testLoss: this_.DataManager.fetchRecord({ db, type: 'test_loss', parser }),
          trainLoss: this_.DataManager.fetchRecord({ db, type: 'train_loss', parser }),
          labelStat: this_.DataManager.fetchImg({ db, type: 'model_stat', parser }, false)
        }).then((data: any) => {

          if (_.startsWith(db, 'cifar')) {
            // filter
            let fa = _.range(0, data.labelStat.length, 2);
            let tmp = [];
            for (let i = 0; i < fa.length; i += 1) { tmp.push(data.labelStat[fa[i]]); }
            data.labelStat = tmp;
          }
          let iterSet = new Set(), iterArray = [];
          for (let i = 0; i < data.labelStat.length; i += 1) {
            iterSet.add(data.labelStat[i].iter);
            iterArray.push(data.labelStat[i].iter);
          }
          this_.Global.setData({ num: iterSet.size, set: iterSet, array: iterArray, picked: null }, 'iter');
          this_.Global.setData({
            lr: myFilter(data.lr, iterSet),
            testError: _.filter(data.testError, (d: any) => iterSet.has(d.iter)),
            testLoss: _.filter(data.testLoss, (d: any) => iterSet.has(d.iter)),
            trainError: myFilter(data.trainError, iterSet),
            trainLoss: myFilter(data.trainLoss, iterSet)
          }, 'record');
          this_.Global.setData({
            layer: data.infoLayer,
            cls: data.infoCls,
          }, 'info');
          let labelData = this_.Global.getData('label');
          labelData.modelStat = data.labelStat;
          // this_.Global.setData({
          //   modelStat: data.labelStat,
          //   clsStat: null
          // }, 'label');
          this_.Pip.emitModelChanged(null);
        }).catch(reason => {
          console.log(reason);
        });
      });

      function myFilter(data, iterSet) {
        let tmp = _.filter(data, (d: any) => iterSet.has(d.iter));
        let result = [];
        for (let i = 0; i < tmp.length - 1; i += 1) {
          if (tmp[i].iter === tmp[i + 1].iter) { continue; }
          result.push(tmp[i]);
        }
        result.push(_.last(tmp));
        return result;
      }
    }

    private _setVisPanel() {
      let this_ = this;

      this_.$scope.config = this_.Global.getConfig();

      this_.$scope.recordTypeList = this_.Global.getRecordTypeList();
      this_.$scope.layerTypeList = this_.Global.getLayerTypeList();
      this_.$scope.layerChartType = this_.Global.getLayerChartType();
      this_.$scope.layerKernelScale = this_.Global.getLayerKernelScale();

      this_.$scope.timeSlider = {
        min: 10,
        max: 60,
        options: {
          floor: 0,
          ceil: 120
        }
      };

      // time range
      $('#timerange')
        .slider({
          orientation: 'horizontal',
          range: true,
          min: 0,
          max: 120,
          values: [20, 60],
          slide: function (event, ui: any) {
            let val = ui.values[$(ui.handle).index() - 1] + '';
            // console.log('sliding!!!', ui.values);
            if (!ui.handle.firstChild) {
              $("<div class='tooltip right in' style='display:none;left:16px;top:-6px;'><div class='tooltip-arrow'></div><div class='tooltip-inner'></div></div>")
                .prependTo(ui.handle);
            }
            $(ui.handle.firstChild).show().children().eq(1).text(val);
          }
        })
        .find('span.ui-slider-handle').on('blur', function () {
          $(this.firstChild).hide();
        });


      // label info
      this_.$scope.spinnerChange = function (step, key) {
        if (key === 'threshold') {
          let val = +this_.$scope.config.label[key] + step;
          if (val < 0) { return; }
          if (key === 'abnormal' && val > 100) { return; }
          this_.$scope.config.label[key] = val;
        } else if (key === 'band') {
          let val = +this_.$scope.config.layer[key] + step;
          if (val < 1) { return; }
          this_.$scope.config.layer[key] = val;
        }
      };

      this_.$scope.labelRender = function (step, key) {
        this_.Pip.emitLabelConfigChanged(this_.$scope.config.label);
      };

    }

  }

  angular
    .module('core')
    .controller('DashboardController', Controller);
}
