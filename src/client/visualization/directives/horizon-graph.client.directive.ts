namespace application {
  'use strict';

  export interface IDTypeCrChart {
    iter: number[];
    value: Array<number[]>;
  };

  interface IScope extends ng.IScope {
    options: any;
    data: IDTypeCrChart;
  }

  class Painter {
    private svg: d4.Selection<any, any, any, any>;
    private svgContainer: d4.Selection<any, any, any, any>;
    private canvas: d4.Selection<any, any, any, any>;
    private rect: d4.Selection<any, any, any, any>;
    private container: d4.Selection<any, any, any, any>;
    private width: number;
    private height: number;
    private offW: number;
    private offH: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any, public data: any) {
      let [dw, dh] = [data.length, options.height];

      // set container - div
      this.container = d4.select(ele[0])
        .style('width', (dw + 15) + 'px')
        .style('height', (options.marginTop + dh * options.hScale) + 'px')
        .style('position', 'relative')
        .style('background', 'white');


      // initialize svg configuration
      this.svg = this.container
        .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', options.marginTop + 'px')
        .style('width', (dw + 15) + 'px')
        .style('height', (dh * options.hScale) + 'px');
      this.rect = this.svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', (dw + 15))
        .attr('height', (dh * options.hScale));
      this.svgContainer = this.svg
        .append('g')
        .attr('transform', 'translate(' + options.margin.left + ',' + options.margin.top + ')');

      // init env variables
      this.offW = options.margin.left;
      this.offH = options.margin.top;
      this.width = dw - options.margin.left - options.margin.right;
      this.height = options.height - options.margin.top - options.margin.bottom;

    }

    public render(data: any, scope, Pip) {
      let this_ = this;

      this_.svg
        .on('mouseover', mouseOverHandler)
        .on('mouseout', mouseOutHandler)
        .on('mousemove', mouseMoveHandler);

      let chart = d3.horizon()
        .width(this_.width)
        .height(this_.height)
        .bands(this_.options.band)
        .mode('mirror')
        .interpolate('basis');

      if (this_.options.yDomain) {
        let t = this_.options.yDomain;
        let tmax = Math.max(Math.abs(t[0]), Math.abs(t[1]));
        chart.max(tmax);
      };
      this_.svgContainer.data([data]).call(chart);

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

      scope.$on('zoom', (evt, msg: any) => {
        let hScale = this_.options.hScale;
        if (scope.data && scope.options.name === msg.name) {
          if (msg.type === 'in') {
            hScale += 0.5;
          } else {
            hScale -= 0.5;
          }
          hScale = hScale < 1 ? 1 : hScale;
          hScale = hScale > 15 ? 15 : hScale;
          this_.options.hScale = hScale;

          let [dw, dh] = [data.length, this_.options.height];
          this_.container
            .style('width', (dw + 15) + 'px')
            .style('height', (this_.options.marginTop + dh * this_.options.hScale) + 'px');
          $(this_.svgContainer.node()).empty();
          this_.svg
            .style('width', dw + 'px')
            .style('height', (dh * this_.options.hScale) + 'px');
          this_.rect
            .attr('width', dw)
            .attr('height', (dh * this_.options.hScale));
          chart.height(dh * this_.options.hScale);
          this_.svgContainer.data([data]).call(chart);

        }
      });

    }

  }

  class Directive {

    public link: (
      scope: ng.IScope,
      element: ng.IAugmentedJQuery,
      attrs: ng.IAttributes) => void;
    public restrict = 'A';
    public scope = {
      options: '=',
      data: '='
    };

    public static factory() {
      let directive = function (Pip, Global) { return new Directive(Pip, Global); };
      directive.$inject = ['Pip', 'Global'];
      return directive;
    }

    constructor(Pip: IPipService, Global: IGlobalService) {
      this.link = function (
        scope: IScope,
        element: ng.IAugmentedJQuery,
        attrs: ng.IAttributes
      ) {
        let hScale = 1;
        // let board = new Painter(element, scope.options);
        // board.render(scope.data);
        let start = () => {
          element.empty();
          scope.options.hScale = hScale;
          let board = new Painter(element, scope.options, scope.data);
          board.render(scope.data, scope, Pip);
        };
        if (!_.isUndefined(scope.data)) { start(); };
        scope.$watch('data', (n, o) => { if (n !== o && n) { start(); } }, false);

      };
    }
  }

  angular
    .module('vis')
    .directive('horizonGraph', Directive.factory());
}
