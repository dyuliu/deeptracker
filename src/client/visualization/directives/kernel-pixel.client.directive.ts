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
      let self = this;
      self.Pip = Pip;
      let sx = 0, sy = 0, sk = 1; // saved transform

      // add zoom in & zoom out
      self.canvas.call(d4.zoom().scaleExtent([1, 10]).on('zoom', zoomed))
        .on('wheel', function () { d4.event.preventDefault(); });
      self.canvas
        .on('mouseover', mouseOverHandler)
        .on('mouseout', mouseOutHandler)
        .on('mousemove', mouseMoveHandler);

      self._paintPixelChart(self.fakeCanvas.node().getContext('2d'), data.pixelChart);
      let ctx: CanvasRenderingContext2D = self.canvas.node().getContext('2d');
      ctx.save();
      ctx.scale(1, self.options.hScale);
      ctx.drawImage(self.fakeCanvas.node(), 0, 0);
      ctx.restore();

      Pip.onSyncHorizonScale(scope, (msg: any) => {
        let {x, y, k} = msg;
        [sx, sy, sk] = [x, y, k];   // update x y z
        drawImage();
      });

      Pip.onTimeMouseMove(scope, (msg: any) => {
        let canvasHeight = self.canvas.property('height');
        drawImage();
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.translate(0.5, 0.5);
        ctx.moveTo(msg.point[0], 0);
        ctx.lineTo(msg.point[0], canvasHeight);
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      });

      Pip.onTimeMouseOut(scope, (msg: any) => {
        drawImage();
      });

      scope.$on('zoom', (evt, msg: any) => {
        let hScale = self.options.hScale;
        if (scope.data && scope.options.name === msg.name) {
          if (msg.type === 'in') {
            hScale += 0.5;
          } else {
            hScale -= 0.5;
          }
          hScale = hScale < 1 ? 1 : hScale;
          hScale = hScale > 15 ? 15 : hScale;
          self.options.hScale = hScale;
          console.log('redraw');
          let [dw, dh] = [data.pixelChart[0].iter.length, data.pixelChart.length];
          self.container
            .style('width', (dw + 15) + 'px')
            .style('height', (self.options.marginTop + dh * self.options.hScale) + 'px');
          self.canvas
            .attr('width', dw + 'px')
            .attr('height', (dh * self.options.hScale) + 'px');
          drawImage();
        }
      });

      function drawImage() {
        let canvasWidth = self.canvas.property('width'),
          canvasHeight = self.canvas.property('height');
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.translate(sx, 0);
        ctx.scale(sk, self.options.hScale);
        ctx.drawImage(self.fakeCanvas.node(), 0, 0);
        ctx.restore();
      };

      function zoomed() {
        let x = d4.event.transform.x;
        let y = d4.event.transform.y;
        let k = d4.event.transform.k;
        if (k === 1) { x = 0; y = 0; d4.event.transform.x = 0; d4.event.transform.y = 0; }
        Pip.emitSyncHorizonScale({ x, y, k });
      }

      function mouseOverHandler() {
        let point = d4.mouse(this);
        Pip.emitTimeMouseOver({ point, x: sx, y: sy, k: sk });
      }

      function mouseOutHandler() {
        let point = d4.mouse(this);
        Pip.emitTimeMouseOut({ point, x: sx, y: sy, k: sk });
      }

      function mouseMoveHandler() {
        let point = d4.mouse(this);
        Pip.emitTimeMouseMove({ point, x: sx, y: sy, k: sk });
      }

    }

    private _paintPixelChart(ctx: CanvasRenderingContext2D, data) {
      let self = this;
      let colorFunc = self.options.color;
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
    .directive('kernelPixel', Directive.factory());
}
