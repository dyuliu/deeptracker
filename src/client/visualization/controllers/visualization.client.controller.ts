'use strict';

namespace application {

  interface IScope extends ng.IScope {
    vlDiv: boolean;
    config: any;
    click: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', 'Pip'];

    constructor(
      public $scope: IScope,
      public DataManager: IDataManagerService,
      public Global: IGlobalService,
      public Pip: IPipService
    ) {

      $scope.vlDiv = false;
      Pip.onVlDiv($scope, e => { $scope.vlDiv = !$scope.vlDiv; });

      $scope.click = function() {
        Pip.emitTimePicked(null);
      };

      $scope.config = Global.getConfig();
      Pip.onRecordConfigChanged($scope, (conf: any) => {
        $scope.config.record = conf;
      });

      Pip.onLabelConfigChanged($scope, (conf: any) => {
        $scope.config.label = conf;
      });

      Pip.onLayerConfigChanged($scope, (conf: any) => {
        $scope.config.layer = conf;
      });

      Pip.onTimeboxConfigChanged($scope, (conf: any) => {
        $scope.config.timebox = conf;
      });

      $(document).on('shown.ace.widget hidden.ace.widget closed.ace.widget', '.widget-box', function (event) {
        let widgets = ace.data.get('demo', 'widget-state', true);
        if (widgets == null) { widgets = {}; };

        let id = $(this).attr('id');
        widgets[id] = event.type;
        ace.data.set('demo', 'widget-state', widgets, null, true);
      });

      (function () {
        let container_list = ace.data.get('demo', 'widget-order', true);
        if (container_list) {
          for (let container_id in container_list) {
            if (container_list.hasOwnProperty(container_id)) {

              let widgets_inside_container = container_list[container_id];
              if (widgets_inside_container.length === 0) { continue; }

              for (let i = 0; i < widgets_inside_container.length; i++) {
                let widget = widgets_inside_container[i];
                $('#' + widget).appendTo('#' + container_id);
              }
            }
          }
        }

        let widgets = ace.data.get('demo', 'widget-state', true);
        if (widgets != null) {
          for (let id in widgets) {
            if (widgets.hasOwnProperty(id)) {
              let state = widgets[id];
              let widget = $('#' + id);
              if ((state === 'shown' && widget.hasClass('collapsed')) ||
                (state === 'hidden' && !widget.hasClass('collapsed'))) {
                widget.widget_box('toggleFast');
              } else if (state === 'closed') {
                widget.widget_box('closeFast');
              }
            }
          }
        }

        $('#main-widget-container').removeClass('invisible');

        $('#reset-widgets').on('click', function () {
          ace.data.remove('demo', 'widget-state');
          ace.data.remove('demo', 'widget-order');
          document.location.reload();
        });

      })();

      // $('#myclose2').click(function(){
      //   $('#myclose').trigger('click');
      // });


      $('#widget-container-labelinfo')
        .mouseenter(function () {
          $('#labelinfo-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#labelinfo-header').addClass('invisible');
        });
      $('#widget-container-labelinfo-model')
        .mouseenter(function () {
          $('#widget-container-labelinfo-model .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-labelinfo-model .widget-header').addClass('invisible');
        });
      $('#widget-container-labelinfo-cls')
        .mouseenter(function () {
          $('#widget-container-labelinfo-cls .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-labelinfo-cls .widget-header').addClass('invisible');
        });
      $('#widget-container-labelinfo-detail')
        .mouseenter(function () {
          $('#widget-container-labelinfo-detail .widget-header').removeClass('invisible');
        })
        .mouseleave(function () {
          $('#widget-container-labelinfo-detail .widget-header').addClass('invisible');
        });
    }
    // end of constructor

  }
  angular
    .module('vis')
    .controller('VisualizationController', Controller);
}
