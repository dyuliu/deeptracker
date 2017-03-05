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
    private canvas: d4.Selection<any, any, any, any>;
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
        .style('height', (dh * options.hScale) + 'px')
        .append('g')
        .attr('transform', 'translate(' + options.margin.left + ',' + options.margin.top + ')');

      // init env variables
      this.offW = options.margin.left;
      this.offH = options.margin.top;
      this.width = dw - options.margin.left - options.margin.right;
      this.height = options.height - options.margin.top - options.margin.bottom;

    }

    public render(data: IDTypeCrChart) {
      let this_ = this;
      console.log(this_.options.band);
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
      // let arr = [];
      // let k = 1;
      // _.each(_.range(50), i => {
      //   if (i % 10 === 0) { k *= -1; }
      //   arr.push([i, k * 50 * Math.random()]);
      // });
      // this_.svg.data([arr]).call(chart);
      this_.svg.data([data]).call(chart);
      // console.log([arr]);
      // console.log(data);
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
          board.render(scope.data);
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
