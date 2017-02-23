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
      DataManager: IDataManagerService,
      $q: ng.IQService,
      Global: IGlobalService,
      Pip: IPipService
    ) {
      let this_ = this;

      $scope.imgDataset = Global.getImgDataset();
      $scope.models = [];
      $scope.selected = {
        imgDataset: 'imagenet',  // default val
        model: 'imagenet-8x-1'   // default val
      };

      $scope.$watch('selected.imgDataset', (n: any, o) => {
        if (n === null) { return; }
        $scope.models = Global.getModels()[n];
      });

      $scope.$watch('selected.model', (n: any, o) => {
        Global.setSelectedDB(n);
        // fetch model related info
        $q.all([
          DataManager.fetchInfo({ db: Global.getSelectedDB(), type: 'layer' }),
          DataManager.fetchInfo({ db: Global.getSelectedDB(), type: 'cls' })
        ]).then( (data: any[]) => {
          Global.setInfo('layer', data[0]);
          Global.setInfo('cls', data[1]);
        });
      });

      // four buttons click event handler
      $scope.click = function (eType) {
        switch (eType) {
          case 'vlDiv':
            Pip.emitVlDiv(null);
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
      // bug: to activate sidebar
      setTimeout(() => {
        $('#sidebar-collapse').trigger('click');
        if ($('#sidebar').hasClass('menu-min')) {
          $('#sidebar-collapse').trigger('click');
        };
      }, 100);

      $scope.config = {
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

      $scope.checkbox = {
        record: [
          { label: 'global lr', model: 'lr' },
          { label: 'test error', model: 'testError' },
          { label: 'train error', model: 'trainError' },
          { label: 'test loss', model: 'testLoss' },
          { label: 'train loss', model: 'trainLoss' }
        ]
      };

      $scope.timeSlider = {
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
      $scope.levelChange = function (step) {
        let val = $scope.config.layerInfo.level + step;
        if (val < 0 || val > 3) { return; }
        $scope.config.layerInfo.level = val;
      };

    }
  }

  angular
    .module('core')
    .controller('DashboardController', Controller);
}
