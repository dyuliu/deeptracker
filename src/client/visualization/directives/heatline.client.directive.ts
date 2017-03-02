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
      console.log(this_.options);
      if (this_.options.threshold > 0) { this_._addTriangles(data.linechartData); }
      if (this_.options.lineChart) { this_._paintLineChart(data.linechartData, data.max); }
    }

    private _addTriangles(data: IDTypeEle) {
      console.log('draw tri');
      let this_ = this;
      let threshold = this_.options.threshold;
      let triangleData = [];
      _.each(data, (d, i) => {
        if (d.value >= threshold) {
          triangleData.push({ x: i, y: d.value, iter: d.iter });
        }
      });

      let color = d4.scaleSequential(d4.interpolateBlues);
      let scale = d4.scaleLinear()
        .domain(d4.extent(triangleData, d => d.y))
        .range([50, 300]);

      // _.each(triangleData, (d: any) => { d.y = scale(d.y); });

      let arc = d3.svg.symbol().type('triangle-down')
        .size(function (d) { return scale(d.y); });

      let triangles = this_.svg.append('g');
      triangles.selectAll('path')
        .data(triangleData)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', '#4682b4')
        .attr('transform', (d: any) => 'translate(' + d.x + ', -2) scale(1,'
          + (4 / Math.sqrt(scale(d.y))) + ')')
        .append('title').text(d => 'iter: ' + d.iter + ' value: ' + d.y);
      // .attr('transform', (d: any) => 'translate(' + d.x + ',' + 0 + ') scale(1,1)');

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

    private _paintLineChart(data: IDTypeEle, max: number) {
      let this_ = this;
      let size = data.length;
      let y = d4.scaleLinear()
        .domain([0, d4.max(data, d => d.value)])
        // .domain([0, max])
        .rangeRound([this_.height, 0]);
      // .rangeRound([996, 0]);
      let lineData = _.map(data, (d, i) => [+i, y(d.value)]);
      let line = d4.line()
        .x(function (d) { return d[0]; })
        .y(function (d) { return d[1]; });
      let chart = this_.svg.append('g');
      chart.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        // .attr('stroke', 'steelblue')
        .attr('stroke', 'rgba(100%, 0%, 0%, 0.84)')
        .attr('stroke-opacity', 1)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1)
        .attr('d', line);

      let focus = this_.svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');
      focus.append('circle')
        .attr('r', 2)
        .attr('fill', 'steelblue');
      focus.append('text')
        .attr('x', 9)
        .attr('dy', '.35em');

      this_.rect
        .on('mouseover', function () { focus.style('display', null); })
        .on('mouseout', function () { focus.style('display', 'none'); })
        .on('mousemove', mousemove);
      function mousemove() {
        let iter = Math.trunc(d4.mouse(this)[0]);
        focus.attr('transform', 'translate(' + iter + ',' + lineData[iter][1] + ')');
        focus.select('text').text('iter.toString()');
        // console.log(iter);
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
