'use strict';

namespace application {
  export class HomeController {
    public static $inject: string[] = ['$scope', '$location', 'Pip'];

    constructor($scope, $location, Pip: IPipService) {
      $scope.actives = {
        overview: true,
        records: false,
        layers: {
          lineWithFocusChart: false,
          boxPlotChart: false
        },
        timepath: false,
        filtermatrix: false,
        speed: false,
        seq: false,
        imginfo: false,
        kernel: false
      };


      $scope.$watch(function () {
        return $location.url();
      }, function (url: string, oldUrl) {
        // if (url === oldUrl) { return; }
        $scope.actives.overview = _.endsWith(url, 'overview');
        $scope.actives.records = _.endsWith(url, 'records');
        $scope.actives.timepath = _.endsWith(url, 'timepath');
        $scope.actives.filtermatrix = _.endsWith(url, 'filtermatrix');
        $scope.actives.speed = _.endsWith(url, 'speed');
        $scope.actives.seq = _.endsWith(url, 'seq');
        $scope.actives.img = _.endsWith(url, 'img');
        $scope.actives.kernel = _.endsWith(url, 'kernel');
        if (url.includes('layers')) {
          for (let key of _.keys($scope.actives.layers)) {
            $scope.actives.layers[key] = _.endsWith(url, key);
          }
        } else {
          for (let key of _.keys($scope.actives.layers)) {
            $scope.actives.layers[key] = false;
          }
        }
        Pip.emitUrlChanged($location.search().chartType);
      }, true);
    }

  }

  angular
    .module('core')
    .controller('HomeController', HomeController);
}
