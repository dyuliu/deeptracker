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
    private rawSvg: d4.Selection<any, any, any, any>;
    private container: d4.Selection<any, any, any, any>;
    private width: number;
    private height: number;
    private offW: number;
    private offH: number;

    constructor(ele: ng.IAugmentedJQuery, public options: any) {

      // set container - div
      this.container = d4.select(ele[0])
        .style('width', options.width + 'px')
        .style('height', options.height + 'px')
        .style('position', 'relative')
        .style('background', 'white');

      // initialize svg configuration
      this.rawSvg = this.container
        .append('svg')
        .style('position', 'absolute')
        .style('left', 0)
        .style('top', 0)
        .style('width', options.width + 'px')
        .style('height', options.height + 'px');

      this.svg = this.rawSvg.append('g')
        .attr('transform', 'translate(' + options.margin.left + ',' + options.margin.top + ')');

      // init env variables
      this.offW = options.margin.left;
      this.offH = options.margin.top;
      this.width = options.width - options.margin.left - options.margin.right;
      this.height = options.height - options.margin.top - options.margin.bottom;
    }

    public render(data: any, Pip: IPipService) {
      console.log(data);
      let self = this;
      self.Pip = Pip;
      let clsLine = new Map();
      let lineVl = new Map(), lineHr = new Map();
      let fr = d4.scaleBand().range([0, self.height]);
      let fc = d4.scaleBand().range([0, self.width]);
      let threshold = self.options.threshold;

      let ch = 0, cw = 0;

      let r2 = preprocessData(data);
      function preprocessData(rawdata): any[] {
        let r = [], res = [];
        rawdata.forEach((v, k) => {
          r.push({ lid: +k, value: v });
        });
        r = _.sortBy(r, ['lid']);
        for (let i = 0; i < r.length; i += 1) {
          let tmp: any = _.map(r[i].value, (d: any, j) => {
            return [+j, d];
          });
          let sc = computeSetEle(tmp);
          tmp = { lid: r[i].lid, data: tmp, miniSet: sc };
          res.push(tmp);
        }

        // pre filter noisy set
        for (let i = 0; i < res.length; i += 1) {
          let dt = res[i].data;
          let pa = Array(res[i].miniSet.length).fill(0);
          _.each(dt, dtt => {
            let tmp = _.map(dtt[1], (d: any, j) => {
              // d.splice(0, 1);
              return d.slice(1, d.length);
            });
            _.each(tmp, (t, ti) => {
              let tf = countSet(new Set(t), res[i].miniSet, pa);
            });
          });
          // console.log(pa);
          let tmpsum = 0;
          res[i].miniSet = _.filter(res[i].miniSet, (d: any, key) => pa[key] * d.size >= threshold);
          // res[i].miniSet = _.filter(res[i].miniSet, (d: any, key) => pa[key] * d.size >= 2);
          for (let j of res[i].miniSet) { tmpsum += j.size; }
          ch = Math.max(ch, tmpsum);
          res[i].filterNum = tmpsum;
          if (res[i].miniSet.length === 0) {
            res.splice(i, 1);
            i -= 1;
          }
        }
        return res;
      };

      let maxWeight = -1;
      // compute position for hr lines
      let positionHr = Array(r2.length), positionVl = Array(self.options.rec.length);
      for (let i = 0; i < positionVl.length; i += 1) { positionVl[i] = {}; }
      for (let i = 0; i < r2.length; i += 1) {
        let dt = r2[i].data;
        let pa = Array(r2[i].miniSet.length).fill(0);
        positionHr[i] = Array(r2[i].miniSet.length).fill(false);
        _.each(dt, dtt => {
          let tmp = _.map(dtt[1], (d: any, j) => {
            return [+j, d.slice(1, d.length)];
          });
          tmp = _.sortBy(tmp, tmpd => tmpd[0]);
          _.each(tmp, (t) => {
            let tf = countSet(new Set(t[1]), r2[i].miniSet, pa);
            let maxtj = -1;
            for (let tj = 0; tj < tf.length; tj += 1) {
              if (tf[tj] === true) {
                maxtj = tj;
                if (!positionHr[i][tj]) { positionHr[i][tj] = [dtt[0], t[0], dtt[0], t[0]]; }
                positionHr[i][tj][2] = dtt[0];
                positionHr[i][tj][3] = t[0];
              }
            }
            if (maxtj > -1) {
              if (!positionVl[dtt[0]][t[0]]) {
                positionVl[dtt[0]][t[0]] = [i, maxtj, i, maxtj];
              }
              positionVl[dtt[0]][t[0]][2] = i;
              positionVl[dtt[0]][t[0]][3] = maxtj;
            }
          });
        });
        _.each(r2[i].miniSet, (d: any, key) => {
          maxWeight = Math.max(maxWeight, pa[key] * d.size);
          positionHr[i][key].push(pa[key] * d.size);
        });
      }

      function countSet(aset, miniSet, pa) {
        let tf = [];
        for (let i = 0; i < miniSet.length; i += 1) {
          let intersection = Array.from(miniSet[i]).filter(x => aset.has(x));
          tf.push(false);
          if (intersection.length === miniSet[i].size) {
            pa[i] += 1;
            tf[i] = true;
          }
        }
        return tf;
      }

      _.each(self.options.rec, d => { cw = Math.max(cw, d.size); });
      let fh = d4.scaleLinear()
        .range([self.options.minHeight, self.options.minHeight + ch * self.options.h])
        .domain([0, ch]);
      let fw = d4.scaleLinear()
        .range([self.options.minWidth, self.options.minWidth + cw * self.options.w])
        .domain([0, cw]);

      let rowHrLines = self.svg.append('g').attr('class', 'row-hr-line');
      let colVlLines = self.svg.append('g').attr('class', 'col-vl-line');
      let colClsName = self.svg.append('g').attr('class', 'col-cls-name');
      let countH = 0, countW = 0;

      for (let j = 0; j < self.options.classNum; j += 1) {
        let d = self.options.rec[j].size;
        countW += fw(d);
      }
      for (let i = 0; i < r2.length; i += 1) {
        let d = r2[i];
        countH += fh(d.filterNum);
      }
      let newWidth = countW, newHeight = countH;
      self.container
        .style('width', self.options.margin.left + self.options.margin.right + newWidth + 'px')
        .style('height', self.options.margin.top + self.options.margin.bottom + newHeight + 'px');
      self.rawSvg
        .style('width', self.options.margin.left + self.options.margin.right + newWidth + 'px')
        .style('height', self.options.margin.top + self.options.margin.bottom + newHeight + 'px');
      self.options.width = newWidth;
      self.options.height = newHeight;

      countH = 0;
      countW = 0;
      let wPosition = [];
      // draw col vl line
      for (let j = 0; j < self.options.classNum; j += 1) {
        wPosition.push(countW);
        let d = self.options.rec[j].size;
        // colVlLines.append('line')
        //   .attr('x1', countW)
        //   .attr('y1', 0)
        //   .attr('x2', countW)
        //   .attr('y2', self.options.height)
        //   .style('stroke', '#f7a659')
        //   .style('stroke-width', 1)
        //   .style('opacity', 0.4);
        colClsName.append('text')
          .attr('x', countW)
          .attr('y', 0)
          .attr('font-size', '10')
          .attr('text-anchor', 'start')
          .text(j);
        countW += fw(d);
      }

      let hPosition = [];
      // draw row hr line
      for (let i = 0; i < r2.length; i += 1) {
        let d = r2[i];
        r2[i].y = countH;
        hPosition.push(countH);
        r2[i].x = wPosition;
        // rowHrLines.append('line')
        //   .attr('x1', 0)
        //   .attr('y1', countH)
        //   .attr('x2', self.options.width)
        //   .attr('y2', countH)
        //   .style('stroke', '#f7a659')
        //   .style('stroke-width', 1)
        //   .style('opacity', 0.8);
        countH += fh(d.filterNum);
      }

      let rowInsideHrLines = self.svg.append('g').attr('class', 'row-hr-inside-line');
      let colInsideVlLines = self.svg.append('g').attr('class', 'col-vl-inside-line');
      let fWeight = d4.scaleLinear<any>().domain([threshold, maxWeight]).range([0.1, 1]);
      let fWeightStroke = d4.scaleLinear<any>().domain([threshold, maxWeight]).range([0.5, self.options.h - 1]);
      let fCls = [];
      for (let i = 0; i < self.options.rec.length; i += 1) {
        let arr: any = Array.from(self.options.rec[i]);
        arr = _.sortBy(arr, d => d);
        let f = d4.scalePoint()
          .domain(arr)
          .range([0, self.options.minWidth + arr.length * self.options.w])
          .padding(self.options.w);
        fCls.push(f);
      }
      let miniPositions = Array(positionHr.length);
      // draw inside (relation) line
      for (let i = 0; i < positionHr.length; i += 1) {
        let miniPosition = [];
        let curH = self.options.minHeight / 2;
        for (let j = 0; j < r2[i].miniSet.length; j += 1) {
          let nowH = r2[i].miniSet[j].size * self.options.h;
          miniPosition.push(curH + nowH / 2);
          curH += nowH;
        }
        miniPositions[i] = miniPosition;

        for (let j = 0; j < positionHr[i].length; j += 1) {
          let st = [positionHr[i][j][0], positionHr[i][j][1]],
            ed = [positionHr[i][j][2], positionHr[i][j][3]],
            weight = positionHr[i][j][4];

          let strokeWidth = weight > 10 ? fWeightStroke(weight) : 0;
          rowInsideHrLines.append('line')
            .attr('x1', wPosition[st[0]] + fCls[st[0]](st[1]))
            .attr('y1', hPosition[i] + miniPosition[j])
            .attr('x2', wPosition[ed[0]] + fCls[ed[0]](ed[1]))
            .attr('y2', hPosition[i] + miniPosition[j])
            .style('stroke', '#363535')
            // .style('stroke-width', fWeightStroke(weight))
            // .style('stroke-width', strokeWidth)
            .style('stroke-width', Math.max(r2[i].miniSet[j].size * self.options.h - 2.5, 0.5))
            // .style('opacity', fWeight(weight));
            .style('opacity', 0.4);
        }
      }

      for (let i = 0; i < positionVl.length; i += 1) {
        _.each(positionVl[i], (d, iter) => {
          colInsideVlLines.append('line')
            .attr('x1', wPosition[i] + fCls[i](+iter))
            .attr('y1', hPosition[d[0]] + miniPositions[d[0]][d[1]])
            .attr('x2', wPosition[i] + fCls[i](+iter))
            .attr('y2', hPosition[d[2]] + miniPositions[d[2]][d[3]])
            .style('stroke', '#363535')
            .style('stroke-width', 0.5)
            .style('opacity', 0.4);
        });
      }

      let rows = self.svg.append('g').attr('class', 'matrix-rows').selectAll('.matrix-row')
        .data(r2)
        .enter().append('g')
        .attr('class', 'matrix-row')
        .attr('transform', d => 'translate(0,' + d.y + ')')
        .each(function (d, i) { row(d, i, this); });

      function row(rowData, ri, selection) {

        let sf = function (aset) {
          let tr = [];
          let ctr = [];
          for (let i = 0; i < rowData.miniSet.length; i += 1) {
            let intersection = Array.from(rowData.miniSet[i]).filter(x => aset.has(x));
            if (intersection.length === rowData.miniSet[i].size) {
              tr.push([miniPositions[ri][i], intersection.length]);
            }
          }
          return tr;
        };

        let cell = d4.select(selection).append('g').attr('class', 'matrix-row-cell').selectAll('.cell')
          .data(rowData.data)
          .enter().append('g')
          .attr('class', 'cell')
          .attr('transform', d => 'translate(' + rowData.x[d[0]] + ', 0)')
          .each(function (d) { drawRect(d, sf, this); });
      };

      function drawRect(rectData, sf, selection) {
        let tmp = _.map(rectData[1], (d: any, i) => {
          return [i, d.slice(1, d.length)];
        });

        d4.select(selection).append('g').attr('class', 'cell-rect-g').selectAll('.cell-rect')
          .data(tmp)
          .enter().append('g')
          .attr('transform', d => {
            let k: any = fCls[rectData[0]](d[0]);
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
          .attr('x', -self.options.w / 2)
          .attr('y', (d: any) => d[0] - self.options.h * d[1] / 2 + 0.5)
          .attr('width', self.options.w)
          .attr('height', (d: any) => self.options.h * d[1] - 1)
          .attr('fill', (d: any) => {
            // if (d[1] > 1) {
            //   return '#ff0a0a';
            // } else {
            return '#3068a0';
            // }
          })
          // .attr('stroke', '#525252')
          // .attr('stroke-width', 0.5)
          .append('title')
          .text(d => d[1]);

        // d4.select(selection).selectAll('line')
        //   .data(newData)
        //   .enter().append('line')
        //   .attr('x1', -self.options.w / 2)
        //   .attr('y1', (d: any) => d[0] + self.options.h * d[1] / 2)
        //   .attr('x2', self.options.w / 2)
        //   .attr('y2', (d: any) => self.options.h * d[1])
        //   .attr('fill', (d: any) => {
        //     // if (d[1] > 1) {
        //     //   return '#ff0a0a';
        //     // } else {
        //       return '#3068a0';
        //     // }
        //   })
        //   // .attr('stroke', '#525252')
        //   // .attr('stroke-width', 0.5)
        //   .append('title')
        //   .text(d => d[1]);
      }

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


    }

    public renderSimpleVersion(data: any, Pip: IPipService) {
      let self = this;
      self.Pip = Pip;

      let mapIter = data.values();
      let colNum = _.keys(mapIter.next().value).length;
      let rowNum = data.size;
      // let [cw, ch] = [self.width / colNum, self.height / rowNum];
      let [cw, ch] = [20, 20];

      // compute cell value
      let r = [];
      let max = 0;
      data.forEach((value, key) => {
        r.push({ lid: key, data: [] });
        let last = _.last(r);
        last.data = new Array(self.options.class.length);
        _.fill(last.data, 0);
        _.each(value, (d, clsKey) => {
          let set = new Set();
          _.each(d, dd => {
            for (let i = 1; i < dd.length; i++) { set.add(dd[i]); }
          });
          last.data[+clsKey] = set.size;
          max = max < set.size ? set.size : max;
        });
      })
      let matrixData = _.sortBy(r, ['lid']);
      console.log(matrixData);

      let color = d4.scaleSequential(d4.interpolateBlues);
      let fv = d4.scaleLinear().range([0, 1]).domain([0, max]);

      //   rowLabel = ['1759080_s_at', '1759302_s_at', '1759502_s_at', '1759540_s_at', '1759781_s_at', '1759828_s_at', '1759829_s_at', '1759906_s_at', '1760088_s_at', '1760164_s_at', '1760453_s_at', '1760516_s_at', '1760594_s_at', '1760894_s_at', '1760951_s_at', '1761030_s_at', '1761128_at', '1761145_s_at', '1761160_s_at', '1761189_s_at', '1761222_s_at', '1761245_s_at', '1761277_s_at', '1761434_s_at', '1761553_s_at', '1761620_s_at', '1761873_s_at', '1761884_s_at', '1761944_s_at', '1762105_s_at', '1762118_s_at', '1762151_s_at', '1762388_s_at', '1762401_s_at', '1762633_s_at', '1762701_s_at', '1762787_s_at', '1762819_s_at', '1762880_s_at', '1762945_s_at', '1762983_s_at', '1763132_s_at', '1763138_s_at', '1763146_s_at', '1763198_s_at', '1763383_at', '1763410_s_at', '1763426_s_at', '1763490_s_at', '1763491_s_at'], // change to gene name or probe id
      //   colLabel = ['con1027', 'con1028', 'con1029', 'con103', 'con1030', 'con1031', 'con1032', 'con1033', 'con1034', 'con1035', 'con1036', 'con1037', 'con1038', 'con1039', 'con1040', 'con1041', 'con108', 'con109', 'con110', 'con111', 'con112', 'con125', 'con126', 'con127', 'con128', 'con129', 'con130', 'con131', 'con132', 'con133', 'con134', 'con135', 'con136', 'con137', 'con138', 'con139', 'con14', 'con15', 'con150', 'con151', 'con152', 'con153', 'con16', 'con17', 'con174', 'con184', 'con185', 'con186', 'con187', 'con188', 'con189', 'con191', 'con192', 'con193', 'con194', 'con199', 'con2', 'con200', 'con201', 'con21']; // change to contrast name


      // use self.options.lidtoName to get row label data
      let rowLabels = self.svg.append('g')
        .selectAll('.rowLabellg')
        .data(matrixData)
        .enter()
        .append('text')
        .text(function (d) { return self.options.lidtoName[d.lid]; })
        .attr('x', 0)
        .attr('y', function (d, i) { return (i) * ch; })
        .style('text-anchor', 'end')
        .attr('transform', 'translate(-6,' + ch / 1.5 + ')')
        .attr('class', function (d, i) { return 'rowLabel mono r' + i; })
        .on('mouseover', function (d) { d3.select(this).classed('text-hover', true); })
        .on('mouseout', function (d) { d3.select(this).classed('text-hover', false); });

      // use self.options.class to get column label data
      let colLabels = self.svg.append('g')
        .selectAll('.colLabelg')
        .data(self.options.class)
        .enter()
        .append('text')
        .text(function (d: any) { return d.name; })
        .attr('x', 0)
        .attr('y', function (d, i) { return (i) * cw; })
        .style('text-anchor', 'left')
        .attr('transform', 'translate(' + cw / 2 + ',-6) rotate (-90)')
        // .attr('transform', 'translate(' + cw / 2 + ',-6) rotate (-90)')
        .attr('class', function (d, i) { return 'colLabel mono c' + i; })
        .on('mouseover', function (d) { d3.select(this).classed('text-hover', true); })
        .on('mouseout', function (d) { d3.select(this).classed('text-hover', false); });

      let heatMap = self.svg.append('g');
      for (let i = 0; i < matrixData.length; i++) {
        heatMap.append('g')
          .attr('class', 'row-rect')
          .selectAll('.cell')
          .data(matrixData[i].data)
          .enter().append('rect')
          .attr('x', function (d, j) { return (j) * cw; })
          .attr('y', function (d) { return (i) * ch; })
          .attr('class', function (d) { return 'cell cell-border'; })
          .attr('width', cw)
          .attr('height', ch)
          .style('fill', function (d: number) { return color(fv(d)); })
          .append('title')
          .text((d: any) => d);
      }

      // .on('mouseover', function (d) {
      //   //highlight text
      //   d3.select(this).classed('cell-hover', true);
      //   d3.selectAll('.rowLabel').classed('text-highlight', function (r, ri) { return ri == (d.row - 1); });
      //   d3.selectAll('.colLabel').classed('text-highlight', function (c, ci) { return ci == (d.col - 1); });

      //   //Update the tooltip position and value
      //   d3.select('#tooltip')
      //     .style('left', (d3.event.pageX + 10) + 'px')
      //     .style('top', (d3.event.pageY - 10) + 'px')
      //     .select('#value')
      //     .text('lables:' + rowLabel[d.row - 1] + ',' + colLabel[d.col - 1] + '\ndata:' + d.value + '\nrow-col-idx:' + d.col + ',' + d.row + '\ncell-xy ' + this.x.baseVal.value + ', ' + this.y.baseVal.value);
      //   //Show the tooltip
      //   d3.select('#tooltip').classed('hidden', false);
      // })
      // .on('mouseout', function () {
      //   d3.select(this).classed('cell-hover', false);
      //   d3.selectAll('.rowLabel').classed('text-highlight', false);
      //   d3.selectAll('.colLabel').classed('text-highlight', false);
      //   d3.select('#tooltip').classed('hidden', true);
      // });

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
          // board.render(scope.data, Pip);
          board.renderSimpleVersion(scope.data, Pip);
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
