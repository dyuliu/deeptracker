namespace application {
  'use strict';

  export interface ISeqDataEle {
    key: string; // layer id
    name: string;
    size: number; // number of neurons in this layer
    domain: number[];
    values: Array<number[]>;
  }

  export interface ISeqDataType extends Array<ISeqDataEle> {
    ratios?: any;
  };

  class RatioMatrix {

    constructor(ele: d4.Selection<any, any, any, any>, public options: any) {
      let this_ = this;
      let color = this_.options.color;
      let h = (mul: number) => this_.options.gHeight * mul;

      let ctx: CanvasRenderingContext2D = ele.node().getContext('2d');
      let offset = 0, lastH = this_.options.gHeight, nowH = 0;
      _.each(this_.options.data, (d: any, key: string) => {
        nowH = h(d);
        ctx.fillStyle = color[key];
        ctx.fillRect(
          options.x,
          options.y + offset,
          options.cellWidth,
          lastH - nowH
        );
        offset += lastH - nowH;
        lastH = nowH;
      });

      // append last one
      ctx.fillStyle = _.last<any>(color);
      ctx.fillRect(options.x, options.y + offset, options.cellWidth, lastH);
    }

  }

  class SeqPainter {
    private svg: d4.Selection<any, any, any, any>;
    private canvas: d4.Selection<any, any, any, any>;
    private data: ISeqDataType;
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
        .attr('height', options.height ? options.height + 'px' : '500px');

      // initialize svg configuration
      this.svg = d4.select(ele[0])
       .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '500px')
       .append('g')
        .attr('transform', 'translate(' + options.margin.left + ',' +
        options.margin.top + ')');
      // init env variables
      this.offsetW = options.margin.left;
      this.offsetH = options.margin.top;
      this.width = ele.width() - options.margin.left - options.margin.right;
      this.height = ele.height() - options.margin.top - options.margin.bottom;
    }

    public render(data: ISeqDataType) {
      // console.time('render');

      let this_ = this;
      this_.data = data;

      let color = this_.buildColorMap(this_.options.ratio.length + 1);
      this_.drawLegends(color);
      let hOffSet = 50, wOffSet = 150, copy_hOffset = 50, copy_wOffset = 150;
      let gHeight = (this_.options.groupMaxHeight + this_.options.groupMinHeight) / 2;
      // append ratio matrix for each layer
      _.each(data, (d: ISeqDataEle, idx: string) => {
        wOffSet = 150;
        hOffSet += gHeight + this_.options.groupSpacing;
        this_.svg.append('text')
          .attr('x', wOffSet)
          .attr('y', hOffSet)
          .attr('dy', -8)
          .style('text-anchor', 'end')
          .text(d.name);
        for (let o of d.values) {
          let params = _.merge(
            {'data': o, color, gHeight},
            {'x': wOffSet + 40, 'y': hOffSet},
            this_.options
          );
          new RatioMatrix(this_.canvas, params);
          wOffSet += this_.options.cellWidth + this_.options.cellSpacing;
        };
      });

      this_.drawAxis({
        height: hOffSet + gHeight,
        width: wOffSet - this_.options.cellSpacing - copy_wOffset,
        wOffset: copy_wOffset + 20,
        hOffset: copy_hOffset - 15
      });

      console.timeEnd('render');

    }

    private drawAxis({height = 0, width = 0, wOffset = 0, hOffset = 0} = {}) {
      let this_ = this;
      console.log();
      // let w = d4.scaleBand<number>()
      //     .domain(this_.data[0].domain)
      //     .range([0, width]);
      let x = d4.scaleLinear<number, number>()
        .range([0, width]);
      let axis = d4.axisTop(x).ticks(10);
      let xDomain = d4.extent(this_.data[0].domain);
      // let lineData = [0, 400, 32000, 48000, 64000, xDomain[1]];
      // let axis = d4.axisTop(x).tickValues(lineData);
      // calc the domain of x
      console.log(xDomain);
      x.domain(xDomain);

      this_.svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + wOffset + ',' + hOffset + ')' )
        .call(axis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '-.55em');
      // this_.svg.append('g')
      //   .attr('class', 'div-line')
      //   .attr('transform', 'translate(' + wOffset + ',' + hOffset + ')' )
      //   .selectAll('line').data(lineData)
      //  .enter().append('line')
      //   .attr('x1', d => d / xDomain[1] * width)
      //   .attr('y1', 0)
      //   .attr('x2', d => d / xDomain[1] * width)
      //   .attr('y2', height)
      //   .style('stroke', '#3d3d3d')
      //   .style('stroke-width', 1);
    }
    /* draw colored legends */
    private drawLegends(colors: string[]) {
      let this_ = this;
      let ratios = _.cloneDeep(this_.options.ratio);
      ratios.push({label: '0'});
      this_.svg.append('g')
        .selectAll('rect')
        .data(colors)
       .enter().append('rect')
        .attr('width', 30)
        .attr('height', 30)
        .attr('x', (d, i) => i * 32)
        .attr('y', 0)
        .attr('fill', (d: string) => d)
       .append('title')
        .text((d, i) => {
          if (i > 0) { return ratios[i].label + ' to ' + ratios[i - 1].label; };
          return '>' + ratios[0].label;
        });
    };

    private buildColorMap(index: number) {
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

  interface IScope extends ng.IScope {
    options: any;
    data: ISeqDataType;
  }

  class Directive {

    public link: (scope: ng.IScope, element: ng.IAugmentedJQuery,
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
      this.link = function (scope: IScope,
        element: ng.IAugmentedJQuery, attrs: ng.IAttributes) {

        let start = () => {
          let ele = element.empty();
          let board = new SeqPainter(ele, scope.options);
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
    .directive('seq', Directive.factory());
}
