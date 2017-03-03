'use strict';

namespace application {

  class Controller {
    public static $inject: string[] = ['$scope', 'Global'];

    constructor(
      public $scope,
      public Global: IGlobalService,
    ) {
      let this_ = this;
      let dbName = this_.Global.getSelectedDB();
      if (_.startsWith(dbName, 'imagenet')) {
        $scope.imgDatabase = 'imagenet';
      } else if (_.startsWith(dbName, 'cifar')) {
        $scope.imgDatabase = 'cifar';
      }
      $scope.clsName = $scope.cls;
      $scope.myStyle = {};
      if ($scope.type === 'class') {
        let data = _.find(this_.Global.getData('info').cls, (o: any) => o.name === $scope.cls);
        $scope.images = data.file;
        // $scope.myStyle = {'width': '800px'};
      } else if ($scope.type === 'file') {
        $scope.simg = $scope.name;
        // $scope.myStyle = {'width': '200px'};
      }
    }
  }

  angular
    .module('vis')
    .controller('ImgModalController', Controller);
}


