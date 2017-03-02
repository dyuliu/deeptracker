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
    private width: number;
    private height: number;
    private offsetWidth: number;
    private offsetHeight: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any) {

      // // set container - div
      // let container = d4.select(ele[0])
      //   .style('width', options.width ? options.width + 'px' : '100%')
      //   .style('height', options.height ? options.height + 'px' : '80px')
      //   .style('position', 'relative')
      //   .style('background', 'white');

      // // initialize canvas configuration
      // this.canvas = container
      //   .append('canvas')
      //   .style('position', 'absolute')
      //   .style('left', 0)
      //   .style('top', 0)
      //   .attr('width', options.width ? options.width + 'px' : '100%')
      //   .attr('height', options.height ? options.height + 'px' : '80px');

      // // initialize svg configuration
      // this.svg = container
      //   .append('svg')
      //   .style('position', 'absolute')
      //   .style('left', 0)
      //   .style('top', 0)
      //   .style('width', options.width ? options.width + 'px' : '100%')
      //   .style('height', options.height ? options.height + 'px' : '80px')
      //   .append('g')
      //   .attr('transform', 'translate(' +
      //   options.margin.left + ',' +
      //   options.margin.top + ')'
      //   );

      // set container - div
      let container = d4.select(ele[0])
        .style('width', 800 + 'px')
        .style('height', 500 + 'px')
        .style('position', 'relative')
        .style('background', 'white');

      // initialize svg configuration
      this.svg = container
        .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .style('width', 800 + 'px')
        .style('height', 500 + 'px');

      // init env variables
      // this.offsetWidth = options.margin.left;
      // this.offsetHeight = options.margin.top;
      // this.width = ele.width() - options.margin.left - options.margin.right;
      // this.height = ele.height() - options.margin.top - options.margin.bottom;
    }

    public render(data: IDTypeCrChart) {
      console.log('rendering horizon graph');
      let this_ = this;
      let width = 800;
      let height = 600;
      let chart = d3.horizon()
        .width(width)
        .height(height / 3)
        .bands(3)
        .mode('mirror')
        .interpolate('basis');

      let arr = [];
      let k = 1;
      _.each(_.range(50), i => {
        if (i % 10 === 0) { k *= -1; }
        arr.push([i, k * 50 * Math.random()]);
      });
      this_.svg.data([arr]).call(chart);
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
      let directive = function (Pip) { return new Directive(Pip); };
      directive.$inject = ['Pip'];
      return directive;
    }

    constructor(Pip: IPipService) {
      this.link = function (
        scope: IScope,
        element: ng.IAugmentedJQuery,
        attrs: ng.IAttributes
      ) {


        let board = new Painter(element, scope.options);
        board.render(scope.data);
        // let start = () => {
        //   element.empty();
        //   let board = new Painter(element, scope.options);
        //   board.render(scope.data);
        // };
        // if (!_.isUndefined(scope.data)) { start(); };
        // scope.$watch('data', (n, o) => { if (n !== o && n) { start(); } }, false);

      };
    }
  }

  angular
    .module('vis')
    .directive('horizonGraph', Directive.factory());
}
