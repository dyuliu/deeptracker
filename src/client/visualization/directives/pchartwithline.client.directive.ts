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
    private container: d4.Selection<any, any, any, any>;
    private svg: d4.Selection<any, any, any, any>;
    private rect: d4.Selection<any, any, any, any>;
    private canvas: d4.Selection<any, any, any, any>;
    private fakeCanvas: d4.Selection<any, any, any, any>;
    private width: number;
    private height: number;
    private offW: number;
    private offH: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any, public data: any) {

      let [dw, dh] = [data.pixelChart[0].iter.length, data.pixelChart.length];
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
        .style('width', (dw + 15) + 'px')
        .style('height', (options.marginTop + 10) + 'px');

      this.svg = this.svg.append('g')
        .attr('transform', 'translate(0,' + options.marginTop + ')');

      // initialize canvas configuration
      this.canvas = this.container
        .append('canvas')
        .style('position', 'absolute')
        .style('top', options.marginTop + 'px')
        .attr('width', dw + 'px')
        .attr('height', (dh * options.hScale) + 'px');

      this.fakeCanvas = this.container
        .append('canvas')
        .attr('width', dw + 'px')
        .attr('height', dh + 'px')
        .style('display', 'none');

      this.offW = options.margin.left;
      this.offH = options.margin.top;
      this.width = options.width - options.margin.left - options.margin.right;
      this.height = options.height - options.margin.top - options.margin.bottom;
    }

    public render(data, Pip: IPipService, scope) {
      let this_ = this;

      // add zoom in & zoom out
      this_.canvas.call(d4.zoom().scaleExtent([1, 10]).on('zoom', zoomed));
      this_.canvas.on('click', clickHandler);

      let svgContainer = this_.svg.append('g');
      this_._addTriangles(svgContainer, data.lineChart);

      this_._paintPixelChart(this_.fakeCanvas.node().getContext('2d'), data.pixelChart);
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      ctx.save();
      ctx.scale(1, this_.options.hScale);
      ctx.drawImage(this_.fakeCanvas.node(), 0, 0);
      ctx.restore();

      if (this_.options.hScale > 4) {
        this_._horizonLine();
      }

      Pip.onSyncHorizonScale(scope, (msg: any) => {
        let canvasWidth = this_.canvas.property('width'),
          canvasHeight = this_.canvas.property('height');
        let {x, y, k} = msg;
        ctx.save();
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.translate(x, 0);
        ctx.scale(k, this_.options.hScale);
        ctx.drawImage(this_.fakeCanvas.node(), 0, 0);
        ctx.restore();
        if (k > 4) {
          this_._verticalLine(x, y, k);
        }
        svgContainer.attr('transform', 'translate(' + x + ', 0) scale(' + k + ',1)');
      });

      function zoomed() {
        let x = d4.event.transform.x;
        let y = d4.event.transform.y;
        let k = d4.event.transform.k;
        if (k === 1) { x = 0; y = 0; d4.event.transform.x = 0; d4.event.transform.y = 0; }
        Pip.emitSyncHorizonScale({ x, y, k });
      }

      function clickHandler() {
        let point = d4.mouse(this);
        // let idx = Math.trunc((point[1] - y) / k);
        // Pip.emitShowModal(_.find(data.pixelChart, (d: any) => d.index === idx));
      }

    }

    private _horizonLine() {
      let this_ = this;
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      let height = this_.canvas.property('height');
      let width = this_.canvas.property('width');
      let off = this_.options.hScale;

      while (off < height) {
        // ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#4c4c4c';
        ctx.moveTo(0, off);
        ctx.lineTo(width, off);
        ctx.stroke();
        off += this_.options.hScale;
      }

    }

    private _verticalLine(x, y, k) {
      let this_ = this;
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      let height = this_.canvas.property('height');
      let width = this_.canvas.property('width') * k;
      let off = k;
      ctx.save();
      ctx.translate(x, 0);
      while (off < width) {
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#4c4c4c';
        ctx.moveTo(off, 0);
        ctx.lineTo(off, height);
        ctx.stroke();
        off += k;
      }
      ctx.restore();

    }

    private _addTriangles(container, data) {
      let this_ = this;
      if (!this_.options.threshold) { return; }
      let triangleData = [];
      _.each(data, (d, i) => {
        if (d.value >= this_.options.threshold) {
          triangleData.push({ x: i, y: d.value, iter: d.iter });
        }
      });
      let scale = d4.scaleLinear()
        .domain([this_.options.threshold, this_.options.max])
        .range([6, 17]);
      let panel = container.append('g');
      panel.selectAll('polygon')
        .data(triangleData)
        .enter().append('polygon')
        .attr('points', d => {
          let w = scale(d.y);
          return '0,0 ' + w + ',-8 -' + w + ',-8';
        })
        .attr('fill', '#4682b4')
        .attr('opacity', 0.9)
        .attr('transform', (d: any) => 'translate(' + d.x + ', 0)')
        .append('title').text(d => 'iter: ' + d.iter + ' value: ' + d.y);
    }

    private _paintPixelChart(ctx: CanvasRenderingContext2D, data) {
      let this_ = this;
      let colorFunc = this_.options.color;
      for (let d of data) {
        let size = d.iter.length;
        let image = ctx.createImageData(size, 1);
        for (let i = 0; i < size; i += 1) {
          let color;
          color = d4.color(colorFunc(d.value[i])).rgb();
          image.data[i * 4 + 0] = color.r;
          image.data[i * 4 + 1] = color.g;
          image.data[i * 4 + 2] = color.b;
          image.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(image, 0, 0 + d.index);
      }
    }

  }

  interface IScope extends ng.IScope {
    options: any;
    data: any;
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

        let hScale = 1;

        let start = () => {
          element.empty();
          scope.options.hScale = hScale;
          let board = new Painter(element, scope.options, scope.data);
          board.render(scope.data, Pip, scope);
        };
        if (!_.isUndefined(scope.data)) { start(); };
        scope.$watch('data', (n, o) => { if (n !== o && n) { start(); } }, false);

        scope.$on('zoom', (evt, msg: any) => {
          if (scope.data && scope.data.pixelChart[0].cls === msg.cls) {
            if (msg.type === 'in') {
              hScale += 1;
            } else {
              hScale -= 1;
            }
            hScale = hScale < 1 ? 1 : hScale;
            hScale = hScale > 10 ? 10 : hScale;
            element.empty();
            scope.options.hScale = hScale;
            let board = new Painter(element, scope.options, scope.data);
            board.render(scope.data, Pip, scope);
          }
        });
      };
    }
  }

  angular
    .module('vis')
    .directive('pchartwithline', Directive.factory());
}
