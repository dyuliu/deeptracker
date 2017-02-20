'use strict';

namespace application {

  interface IScope extends ng.IScope {
    data: any[];
    open: any;
  }

  class Controller {
    public static $inject: string[] = [
      '$scope', 'DataManager', 'Global', '$q', '$http'
    ];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      public Global: IGlobalService,
      $q: ng.IQService,
      $http: ng.IHttpService
    ) {
      let this_ = this;

      console.log('fetching tree.json');
      $q.all([
        DataManager.fetchInfo({ db: Global.getSelectedDB(), type: 'layer' }),
        $http.get('/json/tree.json')
      ]).then( (data: any) => {
        data[1] = data[1].data;
        for (let d of data[1]) { d.opened = false; }
        $scope.data = data;
      });

      $('#widget-container-layerinfo')
        .mouseenter(function () {
          $('#widget-container-layerinfo .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-layerinfo .widget-header').addClass('invisible');
        });

      $('#collapse-animation-container').click(function (e) {
        let content = $('#collapse-animation-content');
        if (content.css('height') === '0px') {
          $('#collapse-animation-content')
            .css('height', 100)
            .css('background-color', '#dc5151');
          $('#collapse-animation-content>div')
            .css('display', 'block');
        } else {
          $('#collapse-animation-content')
            .css('height', 0)
            .css('background-color', 'white');
          $('#collapse-animation-content>div')
            .css('display', 'none');
        }

      });

      $scope.open = function(d, level) {
        console.log($('#' + d.name + ' .level2'));
        $('#' + d.name + ' .level2')
          .removeClass('no-disp')
          .removeClass('no-height')
          .addClass('layerbox');
        d.opened = true;
        // $('#' + name)
        //   .addClass('no-height')
        //   .delay(350)
        //   .addClass('no-disp');
      };

    }

  }

  angular
    .module('vis')
    .controller('LayerController', Controller);
}


