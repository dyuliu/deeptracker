'use strict';

namespace application {

  interface IScope extends ng.IScope {
    iter: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'Pip', 'Global', '$q'];

    constructor(
      public $scope: IScope,
      public Pip: IPipService,
      public Global: IGlobalService,
      $q: ng.IQService
    ) {
      let this_ = this;

      this_._init();
      $scope.iter = null;
      Pip.onModelChanged($scope, (msg) => {
        $('#timebox').slider({max: Global.getData('iter').num - 1});
      });

      $scope.$watch('iter', (n: any, o) => {
        if (!n) { return; }
        $('#timebox').slider({value: n});
        Pip.emitTimeChanged(Global.getData('iter').array[n]);
      });

    }

    private _init() {
      let this_ = this;
      $('#widget-container-timebox')
        .mouseenter(function () {
          $('#widget-container-timebox .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-timebox .widget-header').addClass('invisible');
        });

      $('#timebox')
        .slider({
          orientation: 'horizontal',
          min: 0,
          max: 1,
          value: 0,
          slide: function (event, ui: any) {
            let val = ui.value;
            if (!ui.handle.firstChild) {
              $("<div class='tooltip right in' style='display:none;left:16px;top:-6px;'><div class='tooltip-arrow'></div><div class='tooltip-inner'></div></div>")
                .prependTo(ui.handle);
            }
            $(ui.handle.firstChild).show().children().eq(1).text(val);
            this_.$scope.$apply(function(){
              this_.$scope.iter = val;
            });
          }
        })
        .find('span.ui-slider-handle').on('blur', function () {
          $(this.firstChild).hide();
        });
    }

  }

  angular
    .module('vis')
    .controller('TimeBoxController', Controller);
}


