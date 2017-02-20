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
    reset: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService
    ) {
      let this_ = this;

      // to activate sidebar
      setTimeout(() => {
        $('#sidebar-collapse').trigger('click');
        if ($('#sidebar').hasClass('menu-min')) {
          $('#sidebar-collapse').trigger('click');
        };
      }, 100);

      $scope.imgDataset = Global.getImgDataset();
      $scope.models = [];
      $scope.selected = {
        imgDataset: null,
        model: null
      };

      $scope.selected.imgDataset = 'imagenet';

      $scope.$watch('selected.imgDataset', function (n: any, o) {
        if (n === null) { return; }
        console.log(n);
        $scope.models = Global.getModels()[n];
        $scope.selected.model = $scope.models[3].value;
      }, false);
      $scope.$watch('selected.model', function (n: any, o) {
        console.log(n);
        Global.setSelectedDB(n);
      });

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
      $scope.levelChange = function(step) {
        let val = $scope.config.layerInfo.level + step;
        if (val < 0 || val > 3) { return; }
        $scope.config.layerInfo.level = val;
      };

      $scope.reset = function() {
        ace.data.remove('demo', 'widget-state');
        ace.data.remove('demo', 'widget-order');
        document.location.reload();
      };
    }
  }

  angular
    .module('core')
    .controller('DashboardController', Controller);
}
