namespace application {
  'use strict';

  export interface IImgDataEle {
    key: string;  // img file name
    cls: string;  // img class
    domain?: Array<number>;  // iter
    values: Array<number>; // correctness for all imgs in one iter
  }

  export interface IImgDataType extends Array<IImgDataEle> {};

  class Row {

    constructor(
      ele: d4.Selection<any, any, any, any>,
      stat: Map<string, number[]>,
      public options: any
    ) {
      let this_ = this;
      let data: IImgDataEle = options.data;
      let ctx: CanvasRenderingContext2D = ele.node().getContext('2d');

      // deal with stat
      if (!stat.has(data.cls)) {
        stat.set(data.cls, _.fill(Array(data.domain.length), 0));
      }

      // create Image
      let size = data.values.length;
      let image = ctx.createImageData(size, 1);
      for (let i = 0; i < size; i += 1) {
        // count stat
        let d = stat.get(data.cls);
        d[i] += data.values[i];
        let color;
        if (data.values[i] === 1) {
          color = d4.color('#7fc97f').rgb();
        } else {
          color = d4.color('#fdc086').rgb();
        }
        image.data[i * 4 + 0] = color.r;
        image.data[i * 4 + 1] = color.g;
        image.data[i * 4 + 2] = color.b;
        image.data[i * 4 + 3] = 255;
        // image.data[i * 4 + 3] = color.opacity;
      }
      ctx.putImageData(image, options.offX, options.offY);
    }

  }

  class Painter {
    private svg: d4.Selection<any, any, any, any>;
    private canvas: d4.Selection<any, any, any, any>;
    private data: IImgDataType;
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

    public render(data: IImgDataType) {
      // console.time('render');

      let this_ = this;
      this_.data = data;
      let offX = this_.offsetW + 150, offY = this_.offsetH;
      let count = 0;
      // paint pixel based matrix
      let stat = new Map<string, number[]>();
      _.each(data, (d: IImgDataEle) => {
        let params = {data: d, offX, offY: offY + (count)};
        new Row(this_.canvas, stat, params);
        count++;
      });
      this_._paintRules();
      this_._paintLineCharts(stat);
      this_.data = data = null;
      console.timeEnd('render');

    }

    private _paintLineCharts(stat: Map<string, number[]>) {
      let this_ = this;
      let size = this_.data.length;
      let offh: any = [[0, this_.data[0].cls]];
      let classes = [this_.data[0].cls];
      for (let i = 1; i < size; i += 1) {
        if (this_.data[i].cls !== this_.data[i - 1].cls) {
          offh.push([i, this_.data[i].cls]);
          classes.push(this_.data[i].cls);
        }
      }
      offh.push([size, null]);
      size = offh.length;
      for (let i = 0; i < size - 1; i += 1) {
        let dy = offh[i][0];
        let dx = 150;
        let data: any = stat.get(offh[i][1]);
        let height = offh[i + 1][0] - offh[i][0];
        let width = data.length;
        let chart = this_.svg
          .append('g')
          .attr('transform', 'translate(' + dx + ',' + dy + ')');
        data = _.map(data, (d, idx) => { return [idx, d]; });
        let x = d4.scaleLinear()
          .domain([0, width])
          .rangeRound([0, width]);
        let y = d4.scaleLinear()
          .domain([0, height])
          .rangeRound([height, 0]);
        let line = d4.line()
          .x( function (d) { return x(d[0]); })
          .y( function (d) { return y(d[1]); });
        console.log(i, y(data[0][1]));
        chart.append('circle')
          .attr('cx', 0)
          .attr('cy', y(data[0][1]))
          .attr('r', 2)
          .attr('stroke', 'steelblue')
          .attr('fill', 'steelblue');

        chart.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-opacity', 1)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('stroke-width', 1)
          .attr('d', line);
      }
    }

    private _paintRules() {
      let this_ = this;
      let size = this_.data.length;
      let rules = [0];
      let classes = [this_.data[0].cls];
      for (let i = 1; i < size; i += 1) {
        if (this_.data[i].cls !== this_.data[i - 1].cls) {
          rules.push(i);
          classes.push(this_.data[i].cls);
        }
      }

      let ctx: CanvasRenderingContext2D = this_.canvas.node().getContext('2d');
      size = rules.length;
      for (let i = 0; i < size; i += 1) {
        let y = this_.offsetH + rules[i];
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this_.offsetW + 150, y);
        ctx.stroke();

        ctx.font = '22px Arial';
        ctx.fillText(classes[i], 10, y);
      }
    }

  }

  interface IScope extends ng.IScope {
    options: any;
    data: IImgDataType;
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
      let directive = (Pip) => { return new Directive(Pip); };
      directive.$inject = ['Pip'];
      return directive;
    }

    constructor(Pip: IPipService) {
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
    .directive('imgInfo', Directive.factory());
}
