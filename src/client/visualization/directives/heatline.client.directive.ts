namespace application {
  'use strict';

  interface IDTypeEle extends Array<{ iter: number, value: number, valueR: number }> { };
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
      let self = this;
      self.Pip = Pip;

      console.log('render heatline', data);
      self.rect
        .on('mouseover', mouseOverHandler)
        .on('mouseout', mouseOutHandler)
        .on('mousemove', mouseMoveHandler);

      self._paintHeatMap(data.heatmapData);
      if (self.options.threshold > 0) {
        self._addTriangles(data.linechartData);
        if (self.options.triangle === true) {
          self.svg.selectAll('polygon').style('display', 'inline');
        } else {
          self.svg.selectAll('polygon').style('display', 'none');
        }
      }

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
      let self = this;
      let threshold = self.options.threshold;
      let triangleData = [], downTriangleData = [];
      _.each(data, (d, i) => {
        if (d.value >= threshold) {
          triangleData.push({ x: i, y: d.value, iter: d.iter });
        }
        if (d.valueR >= threshold) {
          downTriangleData.push({ x: i + 1, y: d.valueR, iter: data[i + 1].iter });
        }
      });

      // let color = d4.scaleSequential(d4.interpolateBlues);
      let scale = d4.scaleLinear()
        .domain([self.options.threshold, self.options.max])
        // .range([5, 14]);
        .range([6, 15]);

      if (self.options.immediate) {
        scale.range([3, 3]);
      }

      let triangles = self.svg.append('g');
      triangles.selectAll('polygon')
        .data(triangleData)
        .enter().append('polygon')
        .attr('class', 'triangle')
        .attr('points', d => {
          let w = scale(d.y);
          return '0,3, ' + w + ',-3 -' + w + ',-3';
        })
        .style('fill', '#4682b4')
        .attr('opacity', 0.9)
        .attr('transform', (d: any) => 'translate(' + d.x + ', 4)')
        .on('click', clickHandler)
        .append('title').text(d => 'iter: ' + d.iter + ' value: ' + d.y);

      let downTriangles = self.svg.append('g')
        .attr('transform', 'translate(0,' + self.options.height + ')');
      downTriangles.selectAll('polygon')
        .data(downTriangleData)
        .attr('class', 'triangle')
        .enter().append('polygon')
        .attr('points', d => {
          let w = scale(d.y);
          return w + ',0 -' + w + ',0 ' + '0,-6';
        })
        .attr('fill', '#4682b4')
        .style('opacity', 0.9)
        .attr('transform', (d: any) => 'translate(' + d.x + ', 0)')
        .on('click', clickHandler)
        .append('title').text(d => 'iter: ' + d.iter + ' value: ' + d.y);
      function clickHandler(d) {
        self.Pip.emitTimePicked([d.x, d.iter]);
      }

    }

    private _paintHeatMap(data: IDTypeEle) {
      // to do
      let self = this;
      let ctx: CanvasRenderingContext2D = self.canvas.node().getContext('2d');
      let size = data.length;
      let lw = self.options.cellWidth ? self.options.cellWidth : 1;
      let color = self.options.color;
      let definedColor = d3.scale.linear()
        .domain([0, 0.5, 0.52, 1])
        .range(['#dd261c', '#ffffbf', '#d9ef8b', '#0e9247']);
      // let color = d4.scaleSequential(d4.interpolateYlOrRd);
      // ctx.globalCompositeOperation = 'destination-over';
      if (self.options.type === 'kernel') {
        let scale = d4.scaleLinear()
          .domain(d4.extent(data, d => d.value))
          .range([0.01, 0.95])
          .clamp(true);
        for (let i = 0; i < size; i += 1) {
          ctx.beginPath();
          ctx.moveTo(self.offsetWidth + i * lw, self.offsetHeight);
          ctx.lineTo(self.offsetWidth + i * lw, self.offsetHeight + self.height);
          ctx.lineWidth = lw;
          ctx.strokeStyle = color(scale(data[i].value)).toString();
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < size; i += 1) {
          ctx.beginPath();
          ctx.moveTo(self.offsetWidth + i * lw, self.offsetHeight);
          ctx.lineTo(self.offsetWidth + i * lw, self.offsetHeight + self.height);
          ctx.lineWidth = lw;
          ctx.strokeStyle = definedColor(1 - data[i].value).toString();
          // ctx.strokeStyle = color(Math.max(0.96 - data[i].value, 0)).toString();
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
          // if (scope.options.type === 'kernel') {
          //   console.log('heatline for kernel', scope.data);
          // }
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
