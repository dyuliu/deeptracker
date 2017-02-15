namespace application {
  'use strict';

  export interface IKernelDataEle {
    key: string;  // layer id
    name: string; // layer name
    domain?: Array<number>; // x domain
    values: Array<number[]>; // y domain of each kernel
  }

  export interface IKernelDataType extends Array<IKernelDataEle> {};

  class Layer {

    constructor(ele: d4.Selection<any, any, any, any>, public options: any) {
      let this_ = this;
      let data: IKernelDataEle = options.data;
      let ctx: CanvasRenderingContext2D = ele.node().getContext('2d');
      let size = options.kernelSize;
      // create Image
      let iterNum = data.values.length;
      let layerInfo: IInfoLayerEle = options.layer[options.idx];
      let move = 0;
      for (let i = 0; i < layerInfo.kernelNum; i += 1) {
        for (let c = 0; c < layerInfo.channels; c += 1) {
          let idx = i + c * layerInfo.kernelNum;
          let image = ctx.createImageData(size * iterNum, size);
          let rowSize = size * iterNum * 4;
          for (let j = 0; j < image.data.length; j += 4) {
            let k = Math.trunc((j % rowSize) / ( 4 * size));
            let color: d4.RGBColor;
            if (data.values[k][idx] >= options.ratio) {
              color = d4.color('#fdc086').rgb();
            } else {
              color = d4.color('#7fc97f').rgb();
            }
            image.data[j + 0] = color.r;
            image.data[j + 1] = color.g;
            image.data[j + 2] = color.b;
            image.data[j + 3] = color.opacity * 255;
          }
          ctx.putImageData(image, options.offX, options.offY + move);
          move += size;
        }
      }
    }

  }

  class Painter {
    private svg: d4.Selection<any, any, any, any>;
    private canvas: d4.Selection<any, any, any, any>;
    private data: IKernelDataType;
    private width: number;
    private height: number;
    private offsetW: number;
    private offsetH: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any) {

      // set container - div
      d4.select(ele[0])
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '100%')
        .style('background', 'white');

      // initialize canvas configuration
      this.canvas = d4.select(ele[0])
       .append('canvas')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .attr('width', options.width ? options.width + 'px' : '100%')
        .attr('height', options.height ? options.height + 'px' : '1000px');

      // initialize svg configuration
      this.svg = d4.select(ele[0])
       .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '1000px')
       .append('g')
        .attr('transform', 'translate(' + options.margin.left + ',' +
        options.margin.top + ')');
      // init env variables
      this.offsetW = options.margin.left;
      this.offsetH = options.margin.top;
      this.width = ele.width() - options.margin.left - options.margin.right;
      this.height = ele.height() - options.margin.top - options.margin.bottom;
    }

    public render(data: IKernelDataType) {
      // console.time('render');

      let this_ = this;
      this_.data = data;

      let offX = this_.offsetW + 150, offY = this_.offsetH;
      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');

      console.log('max length:', d4.max(data, d => d.values[0].length));

      _.each(data, (d: IKernelDataEle, idx: string) => {
        // paint each layer
        let params = {idx, data: d, offX, offY: offY};
        _.merge(params, this_.options);
        new Layer(this_.canvas, params);

        // append ruler
        ctx.beginPath();
        ctx.moveTo(0, offY);
        ctx.lineTo(this_.offsetW + 150, offY);
        ctx.stroke();

        // append layer name
        let name = d.key + '_' + d.name;
        ctx.font = '14px Arial';
        ctx.fillText(name, 10, offY + 16);
        offY += this_.options.groupSpace + d.values[0].length * this_.options.kernelSize;
      });

      console.timeEnd('render');
    }


  }

  interface IScope extends ng.IScope {
    options: any;
    data: IKernelDataType;
  }

  class Directive {

    public link: (scope: IScope, element: ng.IAugmentedJQuery,
      attrs: ng.IAttributes) => void;
    public restrict = 'A';
    public scope = {
      options: '=',
      data: '='
    };

    public static factory() {
      let directive = () => { return new Directive(); };
      directive.$inject = [];
      return directive;
    }

    constructor() {
      this.link = function (scope: IScope, element: ng.IAugmentedJQuery,
        attrs: ng.IAttributes) {
        let start = () => {
          let ele = element.empty();
          let board = new Painter(ele, scope.options);
          board.render(scope.data);
          scope.data = null;
        };

        scope.$watch('data', (n, o) => { if (n !== o && n) { start(); } }, false);
        // scope.$watch('options', (n, o) => { if (n !== o) { start(); } }, true);

      };
    }
  }

  angular
    .module('vis')
    .directive('kernel', Directive.factory());
}
