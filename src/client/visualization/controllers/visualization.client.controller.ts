'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      Global: IGlobalService
    ) {

      console.log('visualization ctrl', d4.interpolateYlGn(0.5));

      /* tslint:disable */
      $('#simple-colorpicker-1').ace_colorpicker({ pull_right: true }).on('change', function () {
        let color_class = $(this).find('option:selected').data('class');
        let new_class = 'widget-box';
        if (color_class !== 'default') { new_class += ' widget-color-' + color_class; }
        $(this).closest('.widget-box').attr('class', new_class);
      });


      // scrollables
      $('.scrollable').each(function () {
        let $this = $(this);
        $(this).ace_scroll({
          size: $this.attr('data-size') || 100,
        });
      });
      $('.scrollable-horizontal').each(function () {
        let $this = $(this);
        $(this).ace_scroll(
          {
            horizontal: true,
            styleClass: 'scroll-top',
            size: $this.attr('data-size') || 500,
            mouseWheelLock: true
          }
        ).css({ 'padding-top': 12 });
      });

      $(window).on('resize.scroll_reset', function () {
        $('.scrollable-horizontal').ace_scroll('reset');
      });


      $('#id-checkbox-vertical').prop('checked', false).on('click', function () {
        $('#widget-toolbox-1').toggleClass('toolbox-vertical')
          .find('.btn-group').toggleClass('btn-group-vertical')
          .filter(':first').toggleClass('hidden')
          .parent().toggleClass('btn-toolbar');
      });


      // widget boxes
      // widget box drag & drop example
      // $('.widget-container-col').sortable({
      //   connectWith: '.widget-container-col',
      //   items: '> .widget-box',
      //   handle: ace.vars.touch ? '.widget-title' : false,
      //   cancel: '.fullscreen',
      //   opacity: 0.8,
      //   revert: true,
      //   forceHelperSize: true,
      //   placeholder: 'widget-placeholder',
      //   forcePlaceholderSize: true,
      //   tolerance: 'pointer',
      //   start: function (event, ui) {
      //     ui.item.parent().css({ 'min-height': ui.item.height() });
      //   },
      //   update: function (event, ui) {
      //     ui.item.parent({ 'min-height': '' });
      //     let widget_order = {};
      //     $('.widget-container-col').each(function () {
      //       let container_id = $(this).attr('id');
      //       widget_order[container_id] = [];


      //       $(this).find('> .widget-box').each(function () {
      //         let widget_id = $(this).attr('id');
      //         widget_order[container_id].push(widget_id);
      //       });
      //     });

      //     ace.data.set('demo', 'widget-order', widget_order, null, true);
      //   }
      // });


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
              if ( (state === 'shown' && widget.hasClass('collapsed')) ||
              (state === 'hidden' && !widget.hasClass('collapsed')) ) {
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
      $('#widget-container-timebox')
        .mouseenter(function() {
          $('#widget-container-timebox .widget-header').removeClass('invisible');
        })
        .mouseleave(function() {
          $('#widget-container-timebox .widget-header').addClass('invisible');
        });
      $('#timebox')
        .slider({
          orientation: 'horizontal',
          min: 0,
          max: 120,
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

      $('#widget-container-labelinfo')
        .mouseenter(function() {
          $('#labelinfo-header').removeClass('invisible');
        })
        .mouseleave(function() {
          $('#labelinfo-header').addClass('invisible');
        });
      $('#widget-container-labelinfo-model')
        .mouseenter(function() {
          $('#widget-container-labelinfo-model .widget-header').removeClass('invisible');
        })
        .mouseleave(function() {
          $('#widget-container-labelinfo-model .widget-header').addClass('invisible');
        });
      $('#widget-container-labelinfo-cls')
        .mouseenter(function() {
          $('#widget-container-labelinfo-cls .widget-header').removeClass('invisible');
        })
        .mouseleave(function() {
          $('#widget-container-labelinfo-cls .widget-header').addClass('invisible');
        });
      $('#widget-container-labelinfo-detail')
        .mouseenter(function() {
          $('#widget-container-labelinfo-detail .widget-header').removeClass('invisible');
        })
        .mouseleave(function() {
          $('#widget-container-labelinfo-detail .widget-header').addClass('invisible');
        });
      /* tslint:enable */
    }
    // end of constructor

  }
  angular
    .module('vis')
    .controller('VisualizationController', Controller);
}
