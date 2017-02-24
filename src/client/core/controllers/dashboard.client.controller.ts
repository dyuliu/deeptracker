'use strict';
namespace application {

  interface IScope extends ng.IScope {
    selected: any;
    imgDataset: string[];
    models: { label: string, value: string }[];
    checkbox: any;
    config: any;
    timeSlider: any;
    levelChange: any;
    click: any; // emit event
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

      // bug: to activate sidebar
      setTimeout(() => {
        $('#sidebar-collapse').trigger('click');
        if ($('#sidebar').hasClass('menu-min')) {
          $('#sidebar-collapse').trigger('click');
        };
      }, 100);

      this._setBtnEvent();
      this._setDBPanel();
      this._setVisPanel();

    }

    private _setBtnEvent() {
      let this_ = this;
      this_.$scope.click = function (eType) {
        switch (eType) {
          case 'vlDiv':
            this_.Pip.emitVlDiv(null);
            break;
          case 'reset':
            ace.data.remove('demo', 'widget-state');
            ace.data.remove('demo', 'widget-order');
            document.location.reload();
            break;
          case 'upload':
            console.log('upload your db file');
            break;
          case 'save':
            console.log('save your db file');
            break;
          default:
            break;
        };
      };
    }

    private _setDBPanel() {
      let this_ = this;
      this_.$scope.imgDataset = this_.Global.getImgDataset();
      this_.$scope.models = [];
      this_.$scope.selected = {
        imgDataset: 'imagenet',
        // model: 'imagenet-8x-1'
        // imgDataset: null,
        model: null
      };

      this_.$scope.$watch('selected.imgDataset', (n: any, o) => {
        if (!n) { return; }
        this_.$scope.models = this_.Global.getModels()[n];
      });

      this_.$scope.$watch('selected.model', (n: any, o) => {
        if (!n) { return; }
        this_.Global.setSelectedDB(n);
        let [db, parser] = [n, 'json'];
        // prefetch data
        this_.$q.all({
          infoLayer: this_.DataManager.fetchInfo({ db, type: 'layer' }),
          infoCls: this_.DataManager.fetchInfo({ db, type: 'cls' }),
          lr: this_.DataManager.fetchRecord({ db, type: 'lr', parser }),
          testError: this_.DataManager.fetchRecord({ db, type: 'test_error', parser }),
          trainError: this_.DataManager.fetchRecord({ db, type: 'train_error', parser }),
          testLoss: this_.DataManager.fetchRecord({ db, type: 'test_loss', parser }),
          trainLoss: this_.DataManager.fetchRecord({ db, type: 'train_loss', parser }),
          labelStat: this_.DataManager.fetchImg({ db, type: 'model_stat', seqidx: [49], parser }, false)
        }).then((data: any) => {
          let iterSet = new Set();
          for (let i = 0; i < data.labelStat.length; i += 1) { iterSet.add(data.labelStat[i].iter); }
          this_.Global.setData('iterSet', iterSet);
          this_.Global.setData('iterNum', iterSet.size);
          this_.Global.setData('record', {
            lr: myFilter(data.lr, iterSet),
            testError: _.filter(data.testError, (d: any) => iterSet.has(d.iter)),
            testLoss: _.filter(data.testLoss, (d: any) => iterSet.has(d.iter)),
            trainError: myFilter(data.trainError, iterSet),
            trainLoss: myFilter(data.trainLoss, iterSet)
          });
          this_.Global.setData('info', {
            layer: data.infoLayer,
            cls: data.infoCls
          });
          this_.Global.setData('label', {
            modelStat: data.labelStat,
            clsStat: null
          });
          this_.Pip.emitModelChanged(null);
          console.log(this_.Global.getData());
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
      this_.$scope.config = {
        record: {
          lr: false,
          testError: true,
          testLoss: false,
          trainError: true,
          trainLoss: false,
          merge: false,
          show: false,
          lrMark: false
        },
        labelInfo: {
          show: false
        },
        layerInfo: {
          type: null,
          show: false,
          sameScale: true,
          level: 0
        }
      };

      this_.$scope.checkbox = {
        record: [
          { label: 'global lr', model: 'lr' },
          { label: 'test error', model: 'testError' },
          { label: 'train error', model: 'trainError' },
          { label: 'test loss', model: 'testLoss' },
          { label: 'train loss', model: 'trainLoss' }
        ]
      };

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

      // spinner
      this_.$scope.levelChange = function (step) {
        let val = this_.$scope.config.layerInfo.level + step;
        if (val < 0 || val > 3) { return; }
        this_.$scope.config.layerInfo.level = val;
      };
    }

  }

  angular
    .module('core')
    .controller('DashboardController', Controller);
}
