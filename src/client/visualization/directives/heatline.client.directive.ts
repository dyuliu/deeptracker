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
    public Pip: IPipService;
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
      this.rect = this.svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', options.width)
        .attr('height', options.height);
      this.svg = this.svg.append('g');

      // init env variables
      this.offsetWidth = options.margin.left;
      this.offsetHeight = options.margin.top;
      this.width = ele.width() - options.margin.left - options.margin.right;
      this.height = ele.height() - options.margin.top - options.margin.bottom;
    }

    public render(data: IDTypeHeatline, Pip: IPipService) {
      let this_ = this;
      this_.Pip = Pip;

      this_.rect
        .on('mouseover', mouseOverHandler)
        .on('mouseout', mouseOutHandler)
        .on('mousemove', mouseMoveHandler);

      this_._paintHeatMap(data.heatmapData);
      if (this_.options.triangle && this_.options.threshold > 0) { this_._addTriangles(data.linechartData); }

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
          return '0,6, ' + w + ',-3 -' + w + ',-3';
        })
        .attr('fill', '#4682b4')
        .attr('opacity', 0.9)
        .attr('transform', (d: any) => 'translate(' + d.x + ', 3)')
        .on('click', clickHandler)
        .append('title').text(d => 'iter: ' + d.iter + ' value: ' + d.y);

      function clickHandler(d) {
        this_.Pip.emitTimePicked([d.x, d.iter]);
      }

    }

    private _paintHeatMap(data: IDTypeEle) {
      // to do
      let this_ = this;
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      let size = data.length;
      let lw = this_.options.cellWidth ? this_.options.cellWidth : 1;
      let color = this_.options.color;
      // let color = d4.scaleSequential(d4.interpolateYlOrRd);
      // ctx.globalCompositeOperation = 'destination-over';
      if (this_.options.type === 'kernel') {
        let scale = d4.scaleLinear()
          .domain(d4.extent(data, d => d.value))
          .range([0.01, 0.95])
          .clamp(true);
        for (let i = 0; i < size; i += 1) {
          ctx.beginPath();
          ctx.moveTo(this_.offsetWidth + i * lw, this_.offsetHeight);
          ctx.lineTo(this_.offsetWidth + i * lw, this_.offsetHeight + this_.height);
          ctx.lineWidth = lw;
          ctx.strokeStyle = color(scale(data[i].value)).toString();
          ctx.stroke();
        }
      } else {
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

        let start = () => {
          element.empty();
          if (scope.options.type === 'kernel') {
            console.log('heatline for kernel', scope.data);
          }
          let board = new Painter(element, scope.options);
          board.render(scope.data, Pip);
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
