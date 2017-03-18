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
    private rect: d4.Selection<any, any, any, any>;
    private width: number;
    private height: number;
    private offW: number;
    private offH: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any) {

      // set container - div
      let container = d4.select(ele[0])
        .style('width', options.width + 'px')
        .style('height', options.height + 'px')
        .style('position', 'relative')
        .style('background', 'white');

      // initialize svg configuration
      this.svg = container
        .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .style('width', options.width + 'px')
        .style('height', options.height + 'px');

      this.svg = this.svg.append('g')
        .attr('transform', 'translate(' + options.margin.left + ',' + options.margin.top + ')');

      // init env variables
      this.offW = options.margin.left;
      this.offH = options.margin.top;
      this.width = options.width - options.margin.left - options.margin.right;
      this.height = options.height - options.margin.top - options.margin.bottom;
    }

    public render(data: any, Pip: IPipService) {
      let this_ = this;
      this_.Pip = Pip;
      let vlHashMap = new Map();
      let fr = d4.scaleBand().range([0, this_.height]);
      let fc = d4.scaleBand().range([0, this_.width]);
      let r = [];
      data.forEach((v, k) => {
        r.push({ lid: +k, value: v });
      });
      r = _.sortBy(r, ['lid']);
      let tdr: any = _.range(r.length);
      let tdc: any = _.range(this_.options.classNum);
      fr.domain(tdr);
      fc.domain(tdc);

      this_.svg.append('rect')
        .attr('fill', 'white')
        .attr('width', this_.options.width)
        .attr('height', this_.options.height);

      let color = d4.scaleSequential(d4.interpolateBlues);
      let cols = this_.svg.selectAll('.col')
        .data(_.range(this_.options.classNum))
        .enter().append('g')
        .attr('class', d => 'col col' + d)
        .attr('transform', (d: any) => 'translate(' + fc(d) + ', 0)');

      cols.append('line')
        .attr('y2', this_.options.height)
        .style('stroke', '#feab43')
        .style('stroke-width', 0.8);

      cols.append('text')
        .attr('font-size', '12')
        .attr('text-anchor', 'start')
        .text(d => d);

      let rows = this_.svg.selectAll('.row')
        .data(r)
        .enter().append('g')
        .attr('class', 'row')
        .attr('transform', (d, i: any) => 'translate(0,' + fr(i) + ')')
        .each(row);

      rows.append('line')
        .attr('x2', this_.options.width)
        .style('stroke', '#feab43')
        .style('stroke-width', 0.8);


      function row(rowData) {
        let tmp = _.map(rowData.value, (d: any, i) => {
          return [+i, d];
        });
        let sc = computeSetEle(tmp);
        let ssf = d4.scalePoint<any>()
          .domain(_.range(sc.length))
          .range([3, fr.bandwidth() - 2])
          .padding(fr.bandwidth() / (sc.length + 1));
        console.log(sc);

        // draw horizon line
        let rg = d4.select(this).append('g').attr('class', 'layer-hor-line').selectAll('line')
          .data(_.range(sc.length))
          .enter().append('line')
          .attr('x1', 0)
          .attr('y1', d => ssf(d))
          .attr('x2', this_.options.width)
          .attr('y2', d => ssf(d))
          .style('stroke', '#464646')
          .style('stroke-width', 0.5)
          .style('opacity', 0.4);

        let sf = function (aset) {
          let tr = [];
          let ctr = [];
          for (let i = 0; i < sc.length; i += 1) {
            let intersection = Array.from(sc[i]).filter(x => aset.has(x));
            if (intersection.length === sc[i].size) {
              tr.push([ssf(i), intersection.length]);
            }
          }
          return tr;
        };
        let cell = d4.select(this).append('g').attr('class', 'row-cells').selectAll('.cell')
          .data(tmp)
          .enter().append('g')
          .attr('class', 'cell')
          .attr('transform', d => 'translate(' + fc(d[0]) + ', 0)')
          .each(function (d) { drawRect(d, sf, this); });
      };

      function computeSetEle(tdata) {
        let rowSet = new Set();
        let setArray = [];
        for (let i of tdata) {
          _.each(i[1], (d) => {
            let tmp = new Set();
            for (let k = 1; k < d.length; k += 1) { tmp.add(d[k]); }
            if (setArray.length === 0) {
              setArray.push(tmp);
            } else {
              let tmpArray = [];
              for (let j of setArray) {

                let intersection = new Set(Array.from(tmp).filter(x => j.has(x)));
                if (intersection.size > 0) {
                  let dj = new Set(Array.from(j).filter(x => !tmp.has(x)));
                  tmp = new Set(Array.from(tmp).filter(x => !j.has(x)));
                  tmpArray.push(intersection);
                  if (dj.size > 0) { tmpArray.push(dj); }
                } else {
                  tmpArray.push(j);
                }
              }
              if (tmp.size > 0) { tmpArray.push(tmp); }
              setArray = tmpArray;
            }
          });
        };
        return _.sortBy(setArray, d => -d.size);
      }

      function drawRect(rectData, sf, selection) {
        let set;
        let max = -1, maxH = fr.bandwidth() / 2;
        let tmp = _.map(rectData[1], (d: any, i) => {
          set = d.splice(0, 1)[0];
          if (d.length > max) { max = d.length; }
          return [i, d];
        });
        let arr = [];
        set.forEach(v => { arr.push(+v); });
        arr = _.sortBy(arr, d => d);
        let f = d4.scalePoint()
          .domain(arr)
          .range([0, fc.bandwidth()])
          .padding(fc.bandwidth() / (arr.length + 1));

        // vertical line
        if (!vlHashMap.has(rectData[0])) {
          vlHashMap.set(rectData[0], true);
          let cg = d4.select('.col' + rectData[0]).append('g').attr('class', 'cls-ver-line');
          cg.selectAll('line')
            .data(arr)
            .enter().append('line')
            .attr('x1', d => f(d))
            .attr('y1', 0)
            .attr('x2', d => f(d))
            .attr('y2', this_.options.height)
            .style('stroke', '#464646')
            .style('stroke-width', 0.5)
            .style('opacity', 0.2);
        }


        let rc = d4.select(selection).selectAll('.cell-rect')
          .data(tmp)
          .enter().append('g')
          .attr('transform', d => {
            let k: any = f(d[0]);
            return 'translate(' + k + ', 0)';
          })
          .each(function (d) { drawFilter(d[1], sf, this); });
      }

      function drawFilter(fData, sf, selection) {
        let newData = sf(new Set(fData));
        d4.select(selection).selectAll('.cell-rect-s')
          .data(newData)
          .enter().append('rect')
          .attr('class', 'cell-rect-s')
          .attr('x', -2.5)
          .attr('y', (d: any) => d[0] - 1.5)
          .attr('width', 5)
          .attr('height', 3)
          // .attr('r', (d: any) => Math.max(1, Math.min(d[1], 5) / 5 * 3))
          .attr('fill', (d: any) => {
            if (d[1] > 1) {
              return '#ff0a0a';
            } else {
              return '#3068a0';
            }
          })
          .attr('stroke', '#525252')
          .attr('stroke-width', 0.5)
          .append('title')
          .text(d => d[1]);
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
    .directive('cMatrix', Directive.factory());
}
