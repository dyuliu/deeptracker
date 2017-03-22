'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dataMatrix: any;
    optionsMatrix: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'Pip', 'Global', '$q', 'DataManager'];

    constructor(
      public $scope: IScope,
      public Pip: IPipService,
      public Global: IGlobalService,
      public $q: ng.IQService,
      public DataManager: IDataManagerService
    ) {
      let this_ = this;
      Pip.onCorrelationReady($scope, msg => {
        $scope.dataMatrix = msg.data;
        $scope.optionsMatrix = msg.options;
      });

      updateScrollBar();

      function updateScrollBar() {
        setTimeout(function () {
          let maxWidth = $('.face-right').prop('scrollWidth') - $('.face-right').width();
          let maxHeight = $('.face-top').prop('scrollHeight') - $('.face-top').height();
          let tmpRatio = $('.face-right').scrollLeft() / maxWidth;
          let h1 = (1 - tmpRatio) * maxHeight;
          $('.face-top').animate(
            { scrollTop: h1 },
            250,
            'easeOutQuint'
          );
          let h2 = $('.face-right').scrollTop();
          $('.face-front').animate(
            { scrollTop: h2 },
            250,
            'easeOutQuint'
          );
          updateScrollBar();
        }, 500);
      }

    }

  }

  angular
    .module('vis')
    .controller('CorrelationController', Controller);
}


