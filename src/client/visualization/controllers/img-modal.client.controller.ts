'use strict';

namespace application {

  class Controller {
    public static $inject: string[] = ['$scope', 'Global'];

    constructor(
      public $scope,
      public Global: IGlobalService,
    ) {
      let this_ = this;
      let name = this_.$scope.clsName;

      let dbName = this_.Global.getSelectedDB();
      if (_.startsWith(dbName, 'imagenet')) {
        $scope.imgDatabase = 'imagenet';
      } else if (_.startsWith(dbName, 'cifar')) {
        $scope.imgDatabase = 'cifar';
      }

      let data = _.find(this_.Global.getData('info').cls, (o: any) => o.name === name);
      $scope.images = data.file;
    }
  }

  angular
    .module('vis')
    .controller('ImgModalController', Controller);
}


