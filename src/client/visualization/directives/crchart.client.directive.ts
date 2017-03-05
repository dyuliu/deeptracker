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
    private fakeCanvas: d4.Selection<any, any, any, any>;
    private container: d4.Selection<any, any, any, any>;
    private width: number;
    private height: number;
    private offW: number;
    private offH: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any, public data: any) {
      let [dw, dh] = [data.iter.length, options.height];

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
      // init env variables
      this.offW = options.margin.left;
      this.offH = options.margin.top;
      this.width = dw - options.margin.left - options.margin.right;
      this.height = options.height - options.margin.top - options.margin.bottom;
    }

    public render(data: IDTypeCrChart, Pip: IPipService, scope, Global: IGlobalService) {
      let this_ = this;
      let sx = 0, sy = 0, sk = 1; // saved transform
      this_.canvas.call(d4.zoom().scaleExtent([1, 10]).on('zoom', zoomed));
      this_.canvas
        .on('mouseover', mouseOverHandler)
        .on('mouseout', mouseOutHandler)
        .on('mousemove', mouseMoveHandler);

      this_._paintContext(this_.fakeCanvas.node().getContext('2d'), data);
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');

      drawImage();

      scope.$on('zoom', (evt, msg: any) => {
        let hScale = this_.options.hScale;
        if (scope.data && scope.options.name === msg.name) {
          if (msg.type === 'in') {
            hScale += 0.5;
          } else {
            hScale -= 0.5;
          }
          hScale = hScale < 1 ? 1 : hScale;
          hScale = hScale > 15 ? 15 : hScale;
          this_.options.hScale = hScale;
          console.log('redraw');
          let [dw, dh] = [data.iter.length, this_.options.height];
          this_.container
            .style('width', (dw + 15) + 'px')
            .style('height', (this_.options.marginTop + dh * this_.options.hScale) + 'px');
          this_.canvas
            .attr('width', dw + 'px')
            .attr('height', (dh * this_.options.hScale) + 'px');
          drawImage();
        }
      });

      Pip.onSyncHorizonScale(scope, (msg: any) => {
        let {x, y, k} = msg;
        [sx, sy, sk] = [x, y, k];   // update x y z
        drawImage();
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
        ctx.strokeStyle = '#5096df';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      });

      Pip.onTimeMouseOut(scope, (msg: any) => {
        drawImage();
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

    private _paintContext(ctx: CanvasRenderingContext2D, data) {
      let this_ = this;
      let color = this_._buildColorMap(data.value[0].length + 1);
      let oh, nowh, lasth;
      let h = (mul: number) => this_.height * mul;
      _.each(data.value, (d, idx) => {
        [oh, nowh, lasth] = [0, 0, this_.height];
        _.each(d, (o, k) => {
          nowh = h(o);
          ctx.fillStyle = color[k];
          ctx.fillRect(
            this_.offW + (+idx),
            this_.offH + oh,
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
          this_.offW + (+idx),
          this_.offH + oh,
          this_.options.cellWidth,
          lasth - nowh
        );
      });
    }

    private _buildColorMap(index: number) {
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
    .directive('crchart', Directive.factory());
}
