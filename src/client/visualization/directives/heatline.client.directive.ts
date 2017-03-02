namespace application {
  'use strict';

  interface IDTypeEle extends Array<{ iter: number, value: number }> { };
  export interface IDTypeHeatline {
    heatmapData: IDTypeEle;
    linechartData: IDTypeEle;
    max: number;
  }

  interface IScope extends ng.IScope {
    options: any;
    data: IDTypeHeatline;
  }

  class Painter {
    private svg: d4.Selection<any, any, any, any>;
    private canvas: d4.Selection<any, any, any, any>;
    private rect: d4.Selection<any, any, any, any>;
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
      this.svg = d4.select(ele[0])
        .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '80px');

      this.rect = this.svg
        .attr('class', 'overlay')
        .attr('width', ele.width() - options.margin.left - options.margin.right)
        .attr('height', ele.height() - options.margin.top - options.margin.bottom);

      this.svg = this.svg.append('g')
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

    public render(data: IDTypeHeatline) {
      let this_ = this;
      this_._paintHeatMap(data.heatmapData);
      if (this_.options.threshold > 0) { this_._addTriangles(data.linechartData); }
    }

    private _addTriangles(data: IDTypeEle) {
      let this_ = this;
      let threshold = this_.options.threshold;
      let triangleData = [];
      _.each(data, (d, i) => {
        if (d.value >= threshold) {
          triangleData.push({ x: i, y: d.value, iter: d.iter });
        }
      });

      // let color = d4.scaleSequential(d4.interpolateBlues);
      let scale = d4.scaleLinear()
        .domain([this_.options.threshold, this_.options.max])
        .range([6, 17]);

      let triangles = this_.svg.append('g');
      triangles.selectAll('polygon')
        .data(triangleData)
        .enter().append('polygon')
        .attr('points', d => {
          let w = scale(d.y);
          return '0,10, ' + w + ',-2 -' + w + ',-2';
        })
        .attr('fill', '#4682b4')
        .attr('opacity', 0.9)
        .attr('transform', (d: any) => 'translate(' + d.x + ', 0)')
        .append('title').text(d => 'iter: ' + d.iter + ' value: ' + d.y);

    }

    private _paintHeatMap(data: IDTypeEle) {
      // to do
      let this_ = this;
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      let size = data.length;
      let lw = this_.options.cellWidth ? this_.options.cellWidth : 1;
      // let color = d4.scaleSequential(d4.interpolateYlOrRd);
      let color = d4.scaleSequential(d4.interpolateRdYlGn);
      for (let i = 0; i < size; i += 1) {
        ctx.beginPath();
        ctx.moveTo(this_.offsetWidth + i * lw, this_.offsetHeight);
        ctx.lineTo(this_.offsetWidth + i * lw, this_.offsetHeight + this_.height);
        ctx.lineWidth = lw;
        ctx.strokeStyle = color(1 - data[i].value).toString();
        ctx.stroke();
      }
    }

  }

  class Directive {

    public link: (
      scope: IScope,
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
    .directive('heatline', Directive.factory());
}
