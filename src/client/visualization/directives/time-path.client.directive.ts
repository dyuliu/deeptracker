namespace application {
  'use strict';

  interface ITimePathDirectiveScope extends ng.IScope {
    options: any;
    data: ITimePathDataEle[];
  }


  class TimePathSvg {
    private svg: d4.Selection<any, any, any, any>;
    private rawSvg: d4.Selection<any, any, any, any>;
    private data: ITimePathDataEle[];
    private width: number;
    private height: number;
    private fx: d4.ScaleLinear<number, number>;
    private fy: d4.ScaleLinear<number, number>;

    constructor(ele: ng.IAugmentedJQuery, public options: any) {
      // initialize svg configuration
      this.rawSvg = d4.select(ele[0]);
      this.svg = this.rawSvg
        .style('width', options.width ? options.width + 'px' : '100%')
        .style('height', options.height ? options.height + 'px' : '500px')
       .append('g')
        .attr('transform', 'translate(' + options.margin.left + ',' + options.margin.top + ')');
      this.width = ele.width() - options.margin.left - options.margin.right;
      this.height = ele.height() - options.margin.top - options.margin.bottom;
    }

    public render(data: ITimePathDataEle[]) {
      let that = this;
      // bind data to this class
      that.data = data;

      // calculate x & y scale
      that.calcXYScale();

      that.svg.append('g').call(s => { that.axis(s, that); });

      that.svg.append('g').call(s => { that.timeCurve(s, that); });
    }

    private calcXYScale() {
      let that = this;
      that.fx = d4.scaleLinear().range([0, that.width]);
      that.fy = d4.scaleLinear().range([that.height, 0]);

      // calc domain
      that.fx.domain(d4.extent(that.data, o => o.values.x));
      that.fy.domain(d4.extent(that.data, o => o.values.y));
    }

    private axis(g: d4.Selection<any, any, any, any>, that: TimePathSvg) {

      let xAxis = d4.axisBottom(that.fx);

      let yAxis = d4.axisLeft(that.fy);

      g.append('g')
        .attr('class', 'time-axis')
        .attr('transform', 'translate(0,' + that.height + ')')
        .call(xAxis)
        .append('text')
        .attr('transform', 'translate(' + that.width + '0)')
        .attr('y', -6)
        .style('text-anchor', 'end')
        .text('valueX');

      g.append('g')
        .attr('class', 'time-axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('valueY');
    }

    private timeCurve(g: d4.Selection<any, any, any, any>, that: TimePathSvg) {

      let color = d4.scaleLinear<any>()
        .range(['steelblue', 'gray', 'red'])
        .interpolate(d4.interpolateRgb)
        .domain([0, 0.5, 1]);

      let line = d4.line<ITimePathDataEle>()
        .curve(d4.curveCardinal)
        .x(d => that.fx(d.values.x))
        .y(d => that.fy(d.values.y));
      // let line = d4.svg.line<ITimePathDataEle>()
      //   .interpolate('basis')

      // this.rawSvg
      //   .append('defs')
      //   .append('linearGradient')
      //   .attr('id', 'time-gradient')
      //   .selectAll('stop')
      //   .data([
      //     { offset: '0%', color: 'steelblue' },
      //     { offset: '50%', color: 'gray' },
      //     { offset: '100%', color: 'red' }
      //   ])
      //   .enter().append('stop')
      //   .attr('offset', function (d) { return d.offset; })
      //   .attr('stop-color', function (d) { return d.color; });

      let paths = g.append('path')
        .datum(that.data)
        .attr('class', 'line')
        .attr('d', line);

      paths.remove();
      g
        .selectAll('path')
        .data(quads(samples(paths.node(), 8)))
        .enter().append('path')
        .style('fill', 'none')
        .style('stroke', (d: any) => color(d.t))
        .style('stroke-width', '1px')
        .attr('d', (d: any) => lineJoin(d[0], d[1], d[2], d[3], 1));


      // Sample the SVG path uniformly with the specified precision.
      function samples(path, precision) {
        let n = path.getTotalLength(), t = [0], i = 0, dt = precision;
        while ((i += dt) < n) { t.push(i); };
        t.push(n);
        return t.map(function (o) {
          let p = path.getPointAtLength(o), a: any = [p.x, p.y];
          a.t = o / n;
          return a;
        });
      }

      // Compute quads of adjacent points [p0, p1, p2, p3].
      function quads(points) {
        return d4.range(points.length - 1).map(function (i) {
          let a: any = [points[i - 1], points[i], points[i + 1], points[i + 2]];
          a.t = (points[i].t + points[i + 1].t) / 2;
          return a;
        });
      }

      // Compute stroke outline for segment p12.
      function lineJoin(p0, p1, p2, p3, width) {
        let u12 = perp(p1, p2),
          r = width / 2,
          a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
          b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
          c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
          d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];

        if (p0) { // clip ad and dc using average of u01 and u12
          let u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
          a = lineIntersect(p1, e, a, b);
          d = lineIntersect(p1, e, d, c);
        }

        if (p3) { // clip ab and dc using average of u12 and u23
          let u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
          b = lineIntersect(p2, e, a, b);
          c = lineIntersect(p2, e, d, c);
        }

        return 'M' + a + 'L' + b + ' ' + c + ' ' + d + 'Z';
      }

      // Compute intersection of two infinite lines ab and cd.
      function lineIntersect(a, b, c, d) {
        let x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
          y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
          ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
        return [x1 + ua * x21, y1 + ua * y21];
      }

      // Compute unit vector perpendicular to p01.
      function perp(p0, p1) {
        let u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
          u01d = Math.sqrt(u01x * u01x + u01y * u01y);
        return [u01x / u01d, u01y / u01d];
      }
    }
  }

  class TimePathDirective {

    public link: (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) => void;
    public restrict = 'E';
    public template = '<svg id="timepathID"></svg>';
    public scope = {
      options: '=',
      data: '='
    };

    public static factory() {
      let directive = () => { return new TimePathDirective(); };
      directive.$inject = [];
      return directive;
    }

    constructor() {
      TimePathDirective.prototype.link = function (scope: ITimePathDirectiveScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) {

        let start = () => {
          let ele = element.find('svg').empty();
          let svg = new TimePathSvg(ele, scope.options);
          svg.render(scope.data);
        };

        scope.$watch('data', (n, o) => { if (n !== o) { start(); } }, true);
        scope.$watch('options', (n, o) => { if (n !== o) { start(); } }, true);

      };
    }
  }

  angular
    .module('vis')
    .directive('timePath', TimePathDirective.factory());
}
