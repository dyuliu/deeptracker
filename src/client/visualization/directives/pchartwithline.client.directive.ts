namespace application {
  'use strict';

  interface IDTypeEle extends Array<{ iter: number, value: number }> { };

  export interface IImgDataEle {
    key: string;  // img file name or kernel
    cls: string;  // img class
    domain?: Array<number>;  // iter
    value: Array<number>; // correctness for all imgs in one iter
  }

  export interface IImgDataType extends Array<IImgDataEle> { };

  class Painter {
    private svg: d4.Selection<any, any, any, any>;
    private rect: d4.Selection<any, any, any, any>;
    private canvas: d4.Selection<any, any, any, any>;
    private width: number;
    private height: number;
    private offsetWidth: number;
    private offsetHeight: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any) {

      // set container - div
      d4.select(ele[0])
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '80px')
        .style('position', 'relative')
        .style('background', 'white');

      // initialize canvas configuration
      this.canvas = d4.select(ele[0])
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

    public render(data) {
      let this_ = this;
      if (this_.options.pixelChart) { this_._paintPixelChart(data.pixelChart); }
      if (this_.options.lineChart) { this_._paintLineChart(data.lineChart, data.pixelChart.length); }
    }

    private _paintPixelChart(data) {
      let this_ = this;
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      // create Image
      let idx = 0;
      let colorFunc = this_.options.color;
      for (let d of data) {
        let size = d.iter.length;
        let image = ctx.createImageData(size, 1);
        for (let i = 0; i < size; i += 1) {
          let color;
          if (d.value[i] === 1) {
            // color = d4.color('#7fc97f').rgb();
            color = d4.color(colorFunc(d.value[i])).rgb();
          } else {
            // color = d4.color('#fdc086').rgb();
            color = d4.color(colorFunc(d.value[i])).rgb();
          }
          image.data[i * 4 + 0] = color.r;
          image.data[i * 4 + 1] = color.g;
          image.data[i * 4 + 2] = color.b;
          image.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(image, this_.offsetWidth, this_.offsetHeight + d.index);
        // ctx.putImageData(image, this_.offsetWidth, this_.offsetHeight + idx);
        idx += 1;
      }
    }

    private _paintLineChart(data: IDTypeEle, maxHeight: number) {
      let this_ = this;
      let size = data.length;
      let y = d4.scaleLinear()
        .domain([0, 1])
        .rangeRound([maxHeight, 0]);
      let lineData = _.map(data, (d, i) => [+i, y(1 - d.value)]);
      let line = d4.line()
        .x(function (d) { return d[0]; })
        .y(function (d) { return d[1]; });
      let chart = this_.svg.append('g');
      chart.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.5)
        .attr('stroke', 'steelblue')
        .attr('stroke-opacity', 1)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1)
        .attr('d', line);

      // add hover line
      // let focus = this_.svg.append('g')
      //   .attr('class', 'focus')
      //   .style('display', 'none');
      // focus.append('circle')
      //   .attr('r', 2)
      //   .attr('fill', 'steelblue');
      // focus.append('text')
      //   .attr('x', 9)
      //   .attr('dy', '.35em');

      // this_.rect
      //   .on('mouseover', function () { focus.style('display', null); })
      //   .on('mouseout', function () { focus.style('display', 'none'); })
      //   .on('mousemove', mousemove);
      // function mousemove() {
      //   console.log(d3.mouse(this));
      // }
    }
  }

  interface IScope extends ng.IScope {
    options: any;
    data: IImgDataType;
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
    .directive('pchartwithline', Directive.factory());
}
