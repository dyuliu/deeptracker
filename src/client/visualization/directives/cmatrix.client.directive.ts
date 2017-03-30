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

    public render(data: any, Pip: IPipService, scope: any) {
      let this_ = this;
      this_.Pip = Pip;
      let threshold = this_.options.threshold;
      let r2: any;
      let ch, cch, cw = 0;
      [r2, ch, cch] = this_._preprocessData(data, computeSetEle, countSet);

      let maxWeight = -1;
      // compute position for hr lines
      let positionHr = Array(r2.length), positionVl = Array(this_.options.rec.length);
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

      _.each(this_.options.rec, d => { cw = Math.max(cw, d.size); });
      let fw = d4.scaleLinear()
        .range([this_.options.minWidth, this_.options.minWidth + cw * this_.options.w])
        .domain([0, cw]);

      let rowHrLines = this_.svg.append('g').attr('class', 'row-hr-line');
      let colVlLines = this_.svg.append('g').attr('class', 'col-vl-line');
      let colClsName = this_.svg.append('g').attr('class', 'col-cls-name');
      let countH = 0, countW = 0;

      for (let j = 0; j < this_.options.classNum; j += 1) {
        let d = this_.options.rec[j].size;
        countW += fw(d);
      }
      for (let i = 0; i < r2.length; i += 1) {
        let d = r2[i];
        countH += (d.miniSet.length - 1) * this_.options.space + (this_.options.h * d.filterNum) + this_.options.minHeight;
      }
      let newWidth = countW, newHeight = countH;
      this_.container
        .style('width', this_.options.margin.left + this_.options.margin.right + newWidth + 'px')
        .style('height', this_.options.margin.top + this_.options.margin.bottom + newHeight + 'px');
      this_.rawSvg
        .style('width', this_.options.margin.left + this_.options.margin.right + newWidth + 'px')
        .style('height', this_.options.margin.top + this_.options.margin.bottom + newHeight + 'px');
      this_.rect = this_.svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', newWidth)
        .attr('height', newHeight);
      this_.options.width = newWidth;
      this_.options.height = newHeight;

      countW = 0;
      countH = this_.options.minHeight / 2;
      let wPosition = [], hPosition = [];
      let colWidths = [], rowHeights = [];
      // draw col vl line
      for (let j = 0; j < this_.options.classNum; j += 1) {
        wPosition.push(countW);
        let d = this_.options.rec[j].size;
        let colClass = 'cmatrix-col cmatrix-col-' + this_.options.class[j].name;
        if (j > 0) { colClass += ' cmatrix-col-' + this_.options.class[j - 1].name; }
        colVlLines.append('line')
          .attr('class', colClass)
          .attr('x1', countW)
          .attr('y1', 0)
          .attr('x2', countW)
          .attr('y2', this_.options.height)
          .style('stroke', '#f7a659')
          .style('stroke-width', 1)
          .style('opacity', 0);
        let tmpWidth = fw(d);
        colWidths.push(tmpWidth);
        countW += tmpWidth;
      }
      // draw row hr line
      for (let i = 0; i < r2.length; i += 1) {
        let d = r2[i];
        r2[i].y = countH;
        hPosition.push(countH);
        r2[i].x = wPosition;
        let rowClass = 'cmatrix-row cmatrix-row-' + this_.options.lidtoName[r2[i].lid];
        if (i > 0) { rowClass += ' cmatrix-row-' + this_.options.lidtoName[r2[i - 1].lid]; }
        rowHrLines.append('line')
          .attr('class', rowClass)
          .attr('x1', 0)
          .attr('y1', countH)
          .attr('x2', this_.options.width)
          .attr('y2', countH)
          .style('stroke', '#f7a659')
          .style('stroke-width', 1)
          .style('opacity', 0);
        let tmpHeight = (d.miniSet.length - 1) * this_.options.space + (this_.options.h * d.filterNum) + this_.options.minHeight;
        rowHeights.push(tmpHeight);
        countH += tmpHeight;
      }

      // this_.rect
        // .on('mouseover', rectMouseOverHandler)
        // .on('mouseout', rectMouseOutHandler)
        // .on('mousemove', rectMouseMoveHandler);
      function rectMouseMoveHandler() {
        let point = d4.mouse(this);
        let colIdx;
        for (colIdx = 0; colIdx < this_.options.classNum; colIdx += 1) {
          if (wPosition[colIdx] > point[0]) { break; }
        }
        colIdx -= 1;
        $('.cmatrix-col').css('opacity', 0);
        $('.cls-name').css('color', 'black');
        $('.clsbox')
          .css('border', '0px solid');
        Pip.emitHoveringCls(this_.options.class[colIdx].name);
        // $('.cmatrix-col-' + this_.options.class[colIdx].name).css('opacity', 1);
        let rowIdx;
        for (rowIdx = 0; rowIdx < r2.length; rowIdx += 1) {
          if (hPosition[rowIdx] > point[1]) { break; }
        }
        rowIdx -= 1;
        $('.cmatrix-row').css('opacity', 0);
        $('.layerbox')
          .css('border', '0px solid');
        Pip.emitHoveringLayer(this_.options.lidtoName[r2[rowIdx].lid]);
        // $('.cmatrix-row-' + this_.options.lidtoName[r2[rowIdx].lid]).css('opacity', 1);
      };
      function rectMouseOutHandler() {
        $('.cmatrix-col').css('opacity', 0);
        $('.cmatrix-row').css('opacity', 0);
      }

      function onHoveringLayer(name) {
        $('.cmatrix-row-' + name).css('opacity', 1);
      }
      function onLeavingLayer(name) {
        $('.cmatrix-row-' + name).css('opacity', 0);
      }
      function onHoveringCls(name) {
        $('.cmatrix-col-' + name).css('opacity', 1);
      }
      function onLeavingCls(name) {
        $('.cmatrix-col-' + name).css('opacity', 0);
      }

      Pip.onHoveringLayer(scope, name => {
        onHoveringLayer(name);
      });
      Pip.onLeavingLayer(scope, name => {
        onLeavingLayer(name);
      });
      Pip.onHoveringCls(scope, name => {
        onHoveringCls(name);
      });
      Pip.onLeavingCls(scope, name => {
        onLeavingCls(name);
      });


      Pip.emitClsWidth(colWidths);
      Pip.emitLayerHeight(
        _.map(r2, (d: any, i) => {
          return [d.lid, this_.options.lidtoName[d.lid], d.miniSet, rowHeights[i], this_.options];
        })
      );
      // }[rowHeights, r2, data, this_.options]);

      let rowInsideHrLines = this_.svg.append('g').attr('class', 'row-hr-inside-line');
      let colInsideVlLines = this_.svg.append('g').attr('class', 'col-vl-inside-line');
      let fWeight = d4.scaleLinear<any>().domain([threshold, maxWeight]).range([0.05, 0.5]);
      let fWeightStroke = d4.scaleLinear<any>().domain([threshold, maxWeight]).range([0.5, this_.options.h - 1]);
      let fCls = [];
      for (let i = 0; i < this_.options.rec.length; i += 1) {
        let arr: any = Array.from(this_.options.rec[i]);
        arr = _.sortBy(arr, d => d);
        let f = d4.scalePoint()
          .domain(arr)
          .range([0, this_.options.minWidth + arr.length * this_.options.w])
          .padding(this_.options.w);
        fCls.push(f);
      }
      let miniPositions = Array(positionHr.length);
      // draw inside (relation) line
      for (let i = 0; i < positionHr.length; i += 1) {
        let miniPosition = [];
        let curH = this_.options.minHeight / 2;
        for (let j = 0; j < r2[i].miniSet.length; j += 1) {
          let nowH = r2[i].miniSet[j].size * this_.options.h;
          miniPosition.push(curH + nowH / 2);
          curH += nowH + this_.options.space;
        }
        miniPositions[i] = miniPosition;
        for (let j = 0; j < positionHr[i].length; j += 1) {
          let st = [positionHr[i][j][0], positionHr[i][j][1]],
            ed = [positionHr[i][j][2], positionHr[i][j][3]],
            weight = positionHr[i][j][4];

          rowInsideHrLines.append('line')
            .attr('x1', wPosition[st[0]] + fCls[st[0]](st[1]))
            .attr('y1', hPosition[i] + miniPosition[j])
            .attr('x2', wPosition[ed[0]] + fCls[ed[0]](ed[1]))
            .attr('y2', hPosition[i] + miniPosition[j])
            .style('stroke', '#363535')
            .style('stroke-width', Math.max(r2[i].miniSet[j].size * this_.options.h - 3, 0.5))
            // .style('stroke-width', fWeightStroke(weight))
            .style('opacity', fWeight(weight))
            .on('click', function () {
              let layerName = this_.options.lidtoName[r2[i].lid];
              let layerIterSet = new Set();
              let ms = r2[i].miniSet[j];
              let colNames = new Set();
              _.each(r2[i].data, co => {
                _.each(co[1], (coo, ck) => {
                  let aset = new Set(coo);
                  let intersection = Array.from(ms).filter(x => aset.has(x));
                  if (intersection.length === ms.size) {
                    colNames.add(this_.options.class[co[0]].name);
                    layerIterSet.add(ck);
                  }
                });
              });
              Pip.emitHoveringLayer(layerName);
              colNames.forEach(v => { Pip.emitHoveringCls(v); });
              Pip.emitTimePicked(Array.from(layerIterSet));
              // console.log(layerName, colNames, layerIterSet);
              //  let iterSet
            });
          // .style('opacity', 0.6);
        }
      }

      for (let i = 0; i < positionVl.length; i += 1) {
        _.each(positionVl[i], (d, iter) => {
          colInsideVlLines.append('line')
            .attr('x1', wPosition[i] + fCls[i](+iter))
            .attr('y1', hPosition[d[0]] + miniPositions[d[0]][d[1]])
            .attr('x2', wPosition[i] + fCls[i](+iter))
            .attr('y2', hPosition[d[2]] + miniPositions[d[2]][d[3]])
            .style('stroke', '#464646')
            .style('stroke-width', 0.5)
            .style('opacity', 0.5);
        });
      }

      let rows = this_.svg.append('g').attr('class', 'matrix-rows').selectAll('.matrix-row')
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
              tr.push([miniPositions[ri][i], intersection.length, ri]);
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
          .each(function (d) { drawFilter(d, rectData[0], sf, this); });
      }

      function drawFilter(fData, cid, sf, selection) {
        let newData = sf(new Set(fData[1]));
        d4.select(selection).selectAll('.cell-rect-s')
          .data(newData)
          .enter().append('rect')
          .attr('class', 'cell-rect-s')
          .attr('x', -this_.options.w / 2)
          .attr('y', (d: any) => d[0] - this_.options.h * d[1] / 2)
          .attr('width', this_.options.w)
          .attr('height', (d: any) => this_.options.h * d[1])
          .attr('fill', (d: any) => {
            // if (d[1] > 1) {
            //   return '#ff0a0a';
            // } else {
            return '#3879ba';
            // }
          })
          // .attr('stroke', '#525252')
          // .attr('stroke-width', 0.5)
          .on('click', d => {
            let layerName = this_.options.lidtoName[r2[d[2]].lid];
            let colName = this_.options.class[cid].name;
            console.log('click', fData, layerName, colName);
            Pip.emitHoveringCls(colName);
            Pip.emitHoveringLayer(layerName);
            // onHoveringCls(colName);
            // onHoveringLayer(layerName);
          })
          .append('title')
          .text(d => d[1]);
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

    private _preprocessData(rawData: any[], computeSetEle, countSet) {
      let this_ = this;
      let r = [], res = [];
      let ch = 0, cch = 0;
      rawData.forEach((v, k) => {
        r.push({ lid: +k, value: v });
      });
      r = _.sortBy(r, d => {
        return _.findIndex(this_.options.allLayers, (dd: any) => {
          return dd.name === this_.options.lidtoName[d.lid];
        });
      });
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
        res[i].miniSet = _.filter(res[i].miniSet, (d: any, key) => pa[key] * d.size >= this_.options.threshold);
        // res[i].miniSet = _.filter(res[i].miniSet, (d: any, key) => pa[key] * d.size >= 2);
        for (let j of res[i].miniSet) { tmpsum += j.size; }
        // ch = Math.max(ch, tmpsum);
        ch = Math.max(ch, res[i].miniSet.length);
        cch = Math.max(ch, tmpsum);
        res[i].filterNum = tmpsum;
        if (res[i].miniSet.length === 0) {
          res.splice(i, 1);
          i -= 1;
        }
      }
      return [res, ch, cch];
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
          board.render(scope.data, Pip, scope);
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
