'use strict';

namespace application {

  interface IScope extends ng.IScope {
    test: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      public Global: IGlobalService,
      $q: ng.IQService
    ) {
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
          max: 756,
          value: 0,
          slide: function (event, ui: any) {
            let val = ui.value;
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
    }

  }

  angular
    .module('vis')
    .controller('TimeBoxController', Controller);
}


