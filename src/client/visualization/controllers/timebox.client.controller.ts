'use strict';

namespace application {

  interface IScope extends ng.IScope {
    iter: any;
    show: any;
    reset: any;
    btnShow: any;
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'Pip', 'Global', '$q'];

    constructor(
      public $scope: IScope,
      public Pip: IPipService,
      public Global: IGlobalService,
      $q: ng.IQService
    ) {
      let this_ = this;

      $scope.show = false;
      let iterInfo = null;
      let currentIdx = null;
      let svg, focus, rect, svgContainer, picked;
      let scale = null;
      let sx = 0, sy = 0, sk = 1;

      Pip.onModelChanged($scope, (msg) => {
        $scope.show = true;
        iterInfo = Global.getData('iter');

        $('#timebox').empty();
        scale = d4.scaleLinear()
          .domain(d4.extent(iterInfo.array))
          .range([0, iterInfo.num]);
        let axis = d4.axisTop(scale).ticks(10)
          .tickFormat(d4.format(',.3s'));

        // set up svg
        svg = d4.select('#timebox')
          .attr('width', iterInfo.num + 10)
          .attr('height', 34);

        rect = svg.append('rect')
          .attr('class', 'overlay')
          .attr('width', iterInfo.num + 10)
          .attr('height', 34)
          .style('cursor', 'crosshair');

        svgContainer = svg.append('g');

        // add time axis
        svgContainer.append('g')
          .attr('class', 'time-axis')
          .attr('transform', 'translate(0, 20)')
          .call(axis);

        picked = svg.append('g');
        // set up mouse over event
        focus = svgContainer.append('g')
          // .attr('transform', 'translate(100, 20)')
          .style('display', 'none');

        focus.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 3)
          .attr('fill', '#438EB9');

        focus.append('text')
          .attr('x', 9)
          .attr('dy', '1em')
          .attr('font-size', 12);

        rect
          .on('mouseover', mouseOverHandler)
          .on('mouseout', mouseOutHandler)
          .on('mousemove', mouseMoveHandler)
          .on('click', clickHandler);

        function mouseOverHandler() {
          let point = d4.mouse(this);
          Pip.emitTimeMouseOver({ point, x: 0, y: 0, k: 1 });
        }

        function mouseOutHandler() {
          let point = d4.mouse(this);
          Pip.emitTimeMouseOut({ point, x: 0, y: 0, k: 1 });
        }

        function mouseMoveHandler() {
          let point = d4.mouse(this);
          Pip.emitTimeMouseMove({ point, x: 0, y: 0, k: 1 });
        }

        function clickHandler() {
          let point = d4.mouse(this);
          let idx = Math.trunc(point[0]);
          Pip.emitTimePicked([idx, iterInfo.array[idx]]);
        }

      });

      $scope.reset = function() {
        iterInfo.picked = null;
        $(picked.node()).empty();
      };

      // handle mouse event
      Pip.onTimePicked($scope, (msg) => {
        let ci, cv;
        if (!msg) {
          ci = currentIdx;
          cv = iterInfo.array[currentIdx];
        } else {
          [ci, cv] = msg;
        }
        picked.append('circle')
          .attr('cx', scale(cv))
          .attr('cy', 20)
          .attr('r', 2)
          .attr('fill', 'orange');

        // if (!iterInfo.picked) { iterInfo.picked = []; }
        // iterInfo.picked.push(msg);
      });

      Pip.onTimeMouseOver($scope, (msg) => {
        focus.style('display', 'inline');
      });

      Pip.onTimeMouseOut($scope, (msg) => {
        focus.style('display', 'none');
      });

      Pip.onTimeMouseMove($scope, (msg) => {
        let {point, x, y, k} = msg;
        let v = (point[0] - x) / k;
        focus.attr('transform', 'translate(' + v + ',' + 20 + ')');
        currentIdx = Math.trunc(v);
        focus.select('text').text(iterInfo.array[currentIdx].toString());
        let offset = $('#timebox').offset().left - $('.vl-div-global').parent().offset().left;
        $('.vl-div-global').css('left', offset + v);
        $('.vl-div-current').css('left', offset + point[0]);
      });


      $('#widget-container-timebox')
        .mouseenter(function () {
          this_.$scope.$apply(function () {
            this_.$scope.btnShow = true;
          });
        })
        .mouseleave(function () {
          this_.$scope.$apply(function () {
            this_.$scope.btnShow = false;
          });
        });

    }

  }

  angular
    .module('vis')
    .controller('TimeBoxController', Controller);
}


