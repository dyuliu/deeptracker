'use strict';

namespace application {

  interface IScope extends ng.IScope {
    images: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', '$sce'];

    constructor(
      public $scope: IScope,
      $sce
    ) {
      let this_ = this;

      $scope.images = {
        n01491361: ['n01491361_117', 'n01491361_132', 'n01491361_144', 'n01491361_556', 'n01491361_839'],
        n01532829: ['n01532829_3', 'n01532829_120', 'n01532829_145', 'n01532829_229', 'n01532829_246'],
        n01592084: ['n01592084_387', 'n01592084_400', 'n01592084_439', 'n01592084_508', 'n01592084_1143'],
        n01622779: ['n01622779_15', 'n01622779_182', 'n01622779_927', 'n01622779_1229', 'n01622779_1975'],
        n01664065: ['n01664065_27', 'n01664065_148', 'n01664065_360', 'n01664065_541', 'n01664065_1614']
      };

    }
    // end of constructor

  }
  angular
    .module('content')
    .controller('GalleryController', Controller);
}
