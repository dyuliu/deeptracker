'use strict';

namespace application {

  export class HomeController {
    public static $inject: string[] = ['$scope', '$location'];

    constructor($scope, $location) {
      $scope.actives = {
        info: false,
        gallery: false,
        visualization: false
      };

      let self = this;
      $scope.subPageTitle = self._getSubPageTitle($scope.actives);

      $scope.$watch(function () {
        return $location.url();
      }, function (url: string, oldUrl) {
        $scope.actives.info = _.endsWith(url, 'info');
        $scope.actives.gallery = _.endsWith(url, 'gallery');
        $scope.actives.visualization = _.endsWith(url, 'visualization');
        $scope.subPageTitle = self._getSubPageTitle($scope.actives);
      });

      $scope.showScroll = false;
      $(window).on('scroll', function(e) {
        $('.my-btn-scroll-up').removeClass('invisible');
      });

      $scope.click = function() {
        $('html,body').animate({ scrollTop: 0 }, 500, function() {
          $('.my-btn-scroll-up').addClass('invisible');
        });
      };

    }

    private _getSubPageTitle(actives) {
      let title = '';
      _.each(actives, (d, k) => {
        if (d) { title = k; }
      });
      return _.capitalize(title);
    }
  }

  angular
    .module('core')
    .controller('HomeController', HomeController);
}
