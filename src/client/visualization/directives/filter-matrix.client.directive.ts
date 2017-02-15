namespace application {
  'use strict';

  interface ISingleMatrixOptions {
    width: number; // px
    height: number; // px
    kernelSize: number;
    data: Array<number>;
    domain: [number, number];
    cellSpacing: number; // space between cells
  }

  class SingleMatrix {
    public cellWidth: number;
    public cellHeight: number;

    constructor(svgEle: d4.Selection<any, any, any, any>, public options: ISingleMatrixOptions) {
      let this_ = this;
      let interpolateMap = {
        'HSL': d4.interpolateHsl,
        'HCL': d4.interpolateHcl,
        'Lab': d4.interpolateLab,
        'RGB': d4.interpolateRgb
      };
      let color = d4.scaleLinear<any, any>()
        .range(['black', 'white'])
        .interpolate(interpolateMap.HSL)
        .domain(this_.options.domain);

      let w = d4.scaleBand<number>()
          .domain(d4.range(options.kernelSize))
          .range([0, options.width]);

      let h = d4.scaleBand<number>()
          .domain(d4.range(options.kernelSize))
          .range([0, options.height]);

      this.cellWidth = w.bandwidth();
      this.cellHeight = h.bandwidth();

      let cells = svgEle.selectAll('rect')
        .data(options.data)
        .enter().append('rect')
        .attr('width', this.cellWidth - options.cellSpacing)
        .attr('height', this.cellHeight - options.cellSpacing)
        .attr('x', (d: number, idx: number) => w(this_.column(idx)))
        .attr('y', (d: number, idx: number) => h(this_.row(idx)))
        .attr('fill', (d: number) => color(d));
    }

    private row(idx: number) {
      return Math.floor(idx / this.options.kernelSize);
    };

    private column(idx: number) {
      return Math.floor(idx % this.options.kernelSize);
    };

  }

  class FilterMatrixSvg {
    private svg: d4.Selection<any, any, any, any>;
    private data: IFilterMatrixDataEle[];
    private width: number;
    private height: number;
    private fx: d4.ScaleLinear<number, number>;
    private fy: d4.ScaleLinear<number, number>;

    constructor(ele: ng.IAugmentedJQuery, public options: any) {

      // initialize svg configuration
      this.svg = d4.select(ele[0])
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '500px')
       .append('g')
        .attr('transform', 'translate(' + options.margin.left +
        ',' + options.margin.top + ')');

      this.width = ele.width() - options.margin.left - options.margin.right;
      this.height = ele.height() - options.margin.top - options.margin.bottom;
    }

    public render(data: IFilterMatrixDataEle[]) {

      let this_ = this;
      let groupHeight = Math.ceil(_.size(data[0].points) /
        this_.options.columnNum) * (this_.options.matrixSize +
          this_.options.matrixSpacing + this_.options.groupSpacing);

      let row = function (idx: number) {
        return Math.floor(idx / this_.options.columnNum);
      };

      let column = function (idx: number) {
        return Math.floor(idx % this_.options.columnNum);
      };

      let dx = function (idx: number) {
        return column(idx) * (this_.options.matrixSize +
          this_.options.matrixSpacing);
      };

      let dy = function (idx: number) {
        return row(idx) * (this_.options.matrixSize +
          this_.options.matrixSpacing);
      };

      _.each(data, (d: IFilterMatrixDataEle, idx) => {
        let group = this_.svg.append('g')
          .attr('transform', 'translate(0,' + groupHeight * idx + ')');
        let oidx = 0;
        for (let o of _.values<any>(d.points)) {
          let rectGroup = group.append('g')
            .attr('transform', 'translate(' + dx(oidx) + ',' + dy(oidx) + ')');
          let drawingParameters: ISingleMatrixOptions = {
            width: this_.options.matrixSize,
            height: this_.options.matrixSize,
            kernelSize: 7,
            data: o.coord,
            domain: d4.extent(o.coord),
            cellSpacing: 0.5
          };
          new SingleMatrix(rectGroup, drawingParameters);
          oidx += 1;
        }
      });
    }

  }

  interface IFilterMatrixDirectiveScope extends ng.IScope {
    options: any;
    data: IFilterMatrixDataEle[];
  }

  class FilterMatrixDirective {

    public link: (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) => void;
    public restrict = 'E';
    public template = '<svg id="filtermatrix"></svg>';
    public scope = {
      options: '=',
      data: '='
    };

    public static factory() {
      let directive = () => { return new FilterMatrixDirective(); };
      directive.$inject = [];
      return directive;
    }

    constructor() {
      this.link = function (scope: IFilterMatrixDirectiveScope,
        element: ng.IAugmentedJQuery, attrs: ng.IAttributes) {

        let start = () => {
          let ele = element.find('#filtermatrix').empty();
          let svg = new FilterMatrixSvg(ele, scope.options);
          svg.render(scope.data);
        };

        scope.$watch('data', (n, o) => { if (n !== o) { start(); } }, true);
        scope.$watch('options', (n, o) => { if (n !== o) { start(); } }, true);

      };
    }
  }

  angular
    .module('vis')
    .directive('filterMatrix', FilterMatrixDirective.factory());
}
