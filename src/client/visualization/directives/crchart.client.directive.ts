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

      // set container - div
      let container = d4.select(ele[0])
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '80px')
        .style('position', 'relative')
        .style('background', 'white');

      // initialize canvas configuration
      this.canvas = container
        .append('canvas')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .attr('width', options.width ? options.width + 'px' : '100%')
        .attr('height', options.height ? options.height + 'px' : '80px');

      // initialize svg configuration
      this.svg = container
        .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '80px')
        .append('g')
        .attr('transform', 'translate(' +
        options.margin.left + ',' +
        options.margin.top + ')'
        );
      // init env variables
      this.offsetWidth = options.margin.left;
      this.offsetHeight = options.margin.top;
      this.width = ele.width() - options.margin.left - options.margin.right;
      this.height = ele.height() - options.margin.top - options.margin.bottom;
    }

    public render(data: IDTypeCrChart) {
      let this_ = this;
      let color = this_.buildColorMap(data.value[0].length + 1);
      // this_.drawLegends(color);

      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      let oh, nowh, lasth;
      let h = (mul: number) => this_.height * mul;
      _.each(data.value, (d, idx) => {
        [oh, nowh, lasth] = [0, 0, this_.height];
        _.each(d, (o, k) => {
          nowh = h(o);
          ctx.fillStyle = color[k];
          ctx.fillRect(
            this_.offsetWidth + (+idx),
            this_.offsetHeight + oh,
            this_.options.cellWidth,
            lasth - nowh
          );
          oh += lasth - nowh;
          lasth = nowh;
        });
        // append last one
        nowh = 0;
        ctx.fillStyle = color[d.length];
        ctx.fillRect(
          this_.offsetWidth + (+idx),
          this_.offsetHeight + oh,
          this_.options.cellWidth,
          lasth - nowh
        );
      });

    }

    private buildColorMap(index: number) {
      let colorMappingTable = {
        '2': ['#fc6621', '#a7ed6d'],
        '3': ['#fc8d59', '#ffffbf', '#91cf60'],
        '4': ['#d7191c', '#fdae61', '#a6d96a', '#1a9641'],
        '5': ['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641'],
        '6': ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'],
        '7': ['#d73027', '#fc8d59', '#fee08b', '#ffffbf', '#d9ef8b', '#91cf60', '#1a9850'],
        '8': ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'],
        '9': ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'],
        '10': ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
        '11': ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837']
      };
      return colorMappingTable[index];
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
      let directive = function () { return new Directive(); };
      directive.$inject = [];
      return directive;
    }

    constructor() {
      this.link = function (
        scope: IScope,
        element: ng.IAugmentedJQuery,
        attrs: ng.IAttributes
      ) {

        let start = () => {
          element.empty();
          let board = new Painter(element, scope.options);
          board.render(scope.data);
        };
        if (!_.isUndefined(scope.data)) { start(); };
        scope.$watch('data', (n, o) => { if (n !== o && n) { start(); } }, false);

      };
    }
  }

  angular
    .module('vis')
    .directive('crchart', Directive.factory());
}
