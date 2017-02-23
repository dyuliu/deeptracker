'use strict';

namespace application {

  class Controller {
    public static $inject: string[] = ['$scope', '$sce', 'Global'];

    constructor(
      $scope,
      $sce,
      Global: IGlobalService
    ) {
      let this_ = this;

      $scope.imgDatabase = 'imagenet';
      $scope.$watch(function() {
        return Global.getInfo('cls');
      }, (n, o) => {
        if (!n) { return; }
        $scope.images = _.map(n, (d: any) => {
          let tmp = {cls: d.name, file: []};
          for (let i = 0; i < 18; i += 1) {
            tmp.file.push(d.name + '/' + d.file[i]);
          }
          return tmp;
        });

        $scope.images = _.sampleSize($scope.images, 20);
      });

    }
    // end of constructor

  }
  angular
    .module('content')
    .controller('GalleryController', Controller);
}
