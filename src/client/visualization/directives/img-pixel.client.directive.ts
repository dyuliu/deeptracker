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
    public Pip: IPipService;
    private container: d4.Selection<any, any, any, any>;
    private vldiv: d4.Selection<any, any, any, any>;
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

    public render(data, Pip: IPipService, scope, Global: IGlobalService) {
      let this_ = this;
      this_.Pip = Pip;
      let sx = 0, sy = 0, sk = 1; // saved transform

      // add zoom in & zoom out
      this_.canvas.call(d4.zoom().scaleExtent([1, 10]).on('zoom', zoomed))
        .on('wheel', function () { d4.event.preventDefault(); });
      this_.canvas
        .on('click', clickHandler)
        .on('mouseover', mouseOverHandler)
        .on('mouseout', mouseOutHandler)
        .on('mousemove', mouseMoveHandler);

      let svgContainer = this_.svg.append('g');
      let triangleData = [];
      _.each(data.lineChart, (d, i) => {
        if (d.value >= this_.options.threshold) {
          triangleData.push({ x: i, y: d.value, iter: d.iter });
        }
      });
      let scale = d4.scaleLinear()
        .domain([this_.options.threshold, this_.options.max])
        .range([6, 17]);
      this_._addTriangles(svgContainer, triangleData, scale, [sx, sy, sk]);

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
        let {x, y, k} = msg;
        [sx, sy, sk] = [x, y, k];   // update x y z
        drawImage();
        if (this_.options.hScale > 4) { this_._horizonLine(); }
        if (k > 6) { this_._verticalLine(x, y, k); }
        this_._addTriangles(svgContainer, triangleData, scale, [sx, sy, sk]);
        // svgContainer.attr('transform', 'translate(' + x + ', 0) scale(' + k + ',1)');
      });

      Pip.onTimeMouseMove(scope, (msg: any) => {
        let canvasHeight = this_.canvas.property('height');
        drawImage();
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.translate(0.5, 0.5);
        ctx.moveTo(msg.point[0], 0);
        ctx.lineTo(msg.point[0], canvasHeight);
        ctx.strokeStyle = '#2184f5';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        if (this_.options.hScale > 4) { this_._horizonLine(); }
        if (sk > 6) { this_._verticalLine(sx, sy, sk); }
        this_._addTriangles(svgContainer, triangleData, scale, [sx, sy, sk]);
      });

      Pip.onTimeMouseOut(scope, (msg: any) => {
        drawImage();
        if (this_.options.hScale > 4) { this_._horizonLine(); }
        if (sk > 6) { this_._verticalLine(sx, sy, sk); }
        this_._addTriangles(svgContainer, triangleData, scale, [sx, sy, sk]);
      });

      scope.$on('zoom', (evt, msg: any) => {
        let hScale = this_.options.hScale;
        if (scope.data && scope.data.pixelChart[0].cls === msg.cls) {
          if (msg.type === 'in') {
            hScale += 0.5;
          } else {
            hScale -= 0.5;
          }
          hScale = hScale < 1 ? 1 : hScale;
          hScale = hScale > 15 ? 15 : hScale;
          this_.options.hScale = hScale;
          let [dw, dh] = [data.pixelChart[0].iter.length, data.pixelChart.length];
          this_.container
            .style('width', (dw + 15) + 'px')
            .style('height', (this_.options.marginTop + dh * this_.options.hScale) + 'px');
          this_.canvas
            .attr('width', dw + 'px')
            .attr('height', (dh * this_.options.hScale) + 'px');
          drawImage();
        }
      });

      function drawImage() {
        let canvasWidth = this_.canvas.property('width'),
          canvasHeight = this_.canvas.property('height');
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.translate(sx, 0);
        ctx.scale(sk, this_.options.hScale);
        ctx.drawImage(this_.fakeCanvas.node(), 0, 0);
        ctx.restore();
      };

      function zoomed() {
        let x = d4.event.transform.x;
        let y = d4.event.transform.y;
        let k = d4.event.transform.k;
        if (k === 1) { x = 0; y = 0; d4.event.transform.x = 0; d4.event.transform.y = 0; }
        Pip.emitSyncHorizonScale({ x, y, k });
      }

      function clickHandler() {
        let point = d4.mouse(this);
        let row = Math.trunc(point[1] / this_.options.hScale);
        let col = Math.trunc((point[0] - sx) / sk);
        let tmp = _.find(data.pixelChart, (d: any) => d.index === row);
        if (Global.getConfig('timebox').pin) {
          Pip.emitTimePicked([col, tmp.iter[col]]);
        } else {
          Pip.emitShowModal(tmp);
        }
      }

      function mouseOverHandler() {
        let point = d4.mouse(this);
        // $('.vl-div-pixelchart').css('display', 'inline');
        Pip.emitTimeMouseOver({ point, x: sx, y: sy, k: sk });
      }

      function mouseOutHandler() {
        let point = d4.mouse(this);
        // $('.vl-div-pixelchart').css('display', 'none');
        Pip.emitTimeMouseOut({ point, x: sx, y: sy, k: sk });
      }

      function mouseMoveHandler() {
        let point = d4.mouse(this);
        // $('.vl-div-pixelchart').css('left', point[0] + 'px');
        Pip.emitTimeMouseMove({ point, x: sx, y: sy, k: sk });
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
        ctx.save();
        ctx.beginPath();
        ctx.translate(0.5, 0.5);
        ctx.lineWidth = 1;
        // ctx.strokeStyle = 'white';
        ctx.strokeStyle = '#6b6a6a';
        ctx.moveTo(0, off);
        ctx.lineTo(width, off);
        ctx.stroke();
        off += this_.options.hScale;
        ctx.restore();
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
        ctx.save();
        ctx.beginPath();
        ctx.translate(0.5, 0.5);
        ctx.lineWidth = 0.5;
        // ctx.strokeStyle = 'white';
        ctx.strokeStyle = '#6b6a6a';
        ctx.moveTo(off, 0);
        ctx.lineTo(off, height);
        ctx.stroke();
        off += k;
        ctx.restore();
      }
      ctx.restore();

    }

    private _addTriangles(container, data, scale, tr) {
      let [x, y, k] = tr;
      let this_ = this;
      if (!this_.options.threshold || this_.options.threshold === 0) { return; }

      $(container.node()).empty();
      let panel = container.append('g');
      panel.selectAll('polygon')
        .data(data)
        .enter().append('polygon')
        .attr('points', d => {
          let w = scale(d.y);
          return '0,0 ' + w + ',-9 -' + w + ',-9';
        })
        .attr('fill', '#4682b4')
        .attr('opacity', 0.9)
        .attr('transform', (d: any) => 'translate(' + (d.x * k + x + k / 2) + ', 0)')
        .on('click', clickHandler)
        .append('title').text(d => 'iter: ' + d.iter + ' value: ' + d.y);

      function clickHandler(d) {
        this_.Pip.emitTimePicked([d.x, d.iter]);
      }
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

        let start = () => {
          element.empty();
          scope.options.hScale = hScale;
          let board = new Painter(element, scope.options, scope.data);
          board.render(scope.data, Pip, scope, Global);
        };
        if (!_.isUndefined(scope.data)) { start(); };
        scope.$watch('data', (n, o) => { if (n !== o && n) { start(); } }, false);

      };
    }
  }

  angular
    .module('vis')
    .directive('imgPixel', Directive.factory());
}
