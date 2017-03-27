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

    constructor(ele: ng.IAugmentedJQuery, public options: any, public data: any) {

      // set container - div
      let container = d4.select(ele[0])
        .style('width', options.width + 'px')
        .style('height', options.height + 'px')
        // .style('position', 'relative')
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

    public render(Pip: IPipService, scope: any) {
      let this_ = this;
      this_.Pip = Pip;
      this_.options.sOpen = {};
      let data = this_.nodesDataConstruction(this_.data);

      // move g to the center
      let rects = this_.svg.append('g')
        .attr('class', 'node-group')
        .attr('transform', 'translate(' + (this_.options.width / 3) + ', 0)');

      let fy = [0];
      for (let i = 1; i < data.length; i += 1) {
        if (data[i].type === 'conv-left') {
          fy.push(fy[i - 1]);
        } else {
          fy.push(fy[i - 1] + this_.options.node.height + this_.options.space);
        }
      }

      rects.selectAll('.layer')
        .data(data)
        .enter().append('rect')
        .attr('class', d => 'layer ' + d.type)
        .attr('x', d => {
          if (d.type === 'conv-right') { return 15; }
          if (d.type === 'conv-left') { return -15 - this_.options.node.width; }
          return -this_.options.node.width / 2;
        })
        .attr('y', (d, i) => fy[i])
        .attr('width', this_.options.node.width)
        .attr('height', this_.options.node.height)
        .on('click', function (d) {
          Pip.emitFlip(d.name);
        })
        .on('mouseover', d => { layerMouseOver(d.name); })
        .on('mouseout', d => { layerMouseOut(d.name); })
        .append('title')
        .text(d => {
          if (d.type !== 'data' && d.type !== 'other') {
            return d.name + ':\n ' + d.info.kernelWidth + ' x ' + d.info.kernelHeight;
          }
          return '';
        });

      let links = this_.svg.append('g')
        .attr('class', 'link-group')
        .attr('transform', 'translate(' + (this_.options.width / 3) + ', 0)');

      let line = d4.line()
        .x(d => d[0])
        .y(d => d[1]);

      links.selectAll('.layer')
        .data(data)
        .enter().append('path')
        .attr('d', (d, i) => {
          let pd = [];
          if (d.type === 'other' && d.edgeType) {
            // do nothing
            let st;
            let ti = +i + 1;
            st = [15 + this_.options.node.width / 2, fy[ti]];
            pd.push(st);

            pd.push([0, fy[i] + this_.options.node.height]);

            if (d.edgeType === 1) {
              pd.push([-15 - this_.options.node.width / 2, fy[ti]]);
            } else {
              pd.push([-15, fy[ti]]);
              pd.push([-15, fy[i + 3] + this_.options.node.height]);
            }

            let ed;
            ti = +i + 4;
            if (d.edgeType === 1) {
              ed = [-15 - this_.options.node.width / 2, fy[ti]];
            } else {
              ed = [0, fy[ti]];
            }
            pd.push(ed);
          } else {
            let st;
            if (d.type === 'conv-right') {
              st = [15 + this_.options.node.width / 2, fy[i] + this_.options.node.height];
            } else if (d.type === 'conv-left') {
              st = [-15 - this_.options.node.width / 2, fy[i] + this_.options.node.height];
            } else {
              st = [0, fy[i] + this_.options.node.height];
            }
            pd.push(st);

            let ed;
            let ti = +i + 1;
            if (ti < data.length && data[ti].type === 'conv-left') { ti += 1; }
            if (ti < data.length) {
              if (data[ti].type === 'conv-right') {
                ed = [15 + this_.options.node.width / 2, fy[ti]];
              } else if (data[ti].type === 'conv-left') {
                ed = [-15 - this_.options.node.width / 2, fy[ti]];
              } else {
                ed = [0, fy[ti]];
              }
            } else {
              return '';
            }
            pd.push(ed);
          }

          return line(pd);
        })
        .attr('fill', 'none')
        .style('stroke', '#85b5e3')
        .style('stroke-width', 1);


      // get bar data
      let location = {};
      for (let i = 0; i < data.length; i += 1) {
        if (data[i].type !== 'other' && data[i].type !== 'data') {
          location[data[i].name] = fy[i];
        }
      }
      let barData = this_.barDataConstruction(this_.data, location);
      let barEdgeColor = {};
      _.each(barData, d => {
        barEdgeColor[d.name] = { color: '#2089ed' };
      });
      let stretchData = this_.stretchData(this_.data);
      let levelLinkData = this_.levelLinkDataConstruction(this_.data);
      let bars = this_.svg.append('g')
        .attr('transform', 'translate(' + (this_.options.width / 3) + ', 0)');

      bars.selectAll('.bar')
        .data(barData)
        .enter().append('rect')
        .attr('class', d => 'bar ' + d.level + ' bar-' + d.name)
        .attr('x', d => {
          let t;
          if (d.level === 'level1') { t = 15 + this_.options.node.width + 20; }
          if (d.level === 'level2') { t = 15 + this_.options.node.width + 12; }
          if (d.level === 'level3' && !d.left) {
            t = 15 + this_.options.node.width + 4;
          } else if (d.level === 'level3' && d.left) {
            t = -11;
          }
          return t;
        })
        .attr('y', d => d.st)
        .attr('width', 5)
        .attr('height', d => d.ed - d.st)
        .attr('fill', '#3093f2')
        .style('opacity', d => {
          if (stretchData[d.name].parent && !this_.options.sOpen[stretchData[d.name].parent.name]) {
            return 0.2;
          }
          if (!this_.options.sOpen[d.name]) { return 1; }
          return 0.2;
        })
        .on('click', clickHandler);

      let barEdges = this_.svg.append('g')
        .attr('transform', 'translate(' + (this_.options.width / 3) + ', 0)');

      let barEdgeNodes = this_.svg.append('g')
        .attr('transform', 'translate(' + (this_.options.width / 3) + ', 0)');

      let levelNodeEdges = this_.svg.append('g')
        .attr('transform', 'translate(' + (this_.options.width / 3) + ', 0)');

      let lineCurve = d4.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d4.curveBasis);
      setTimeout(function () {
        barEdges.selectAll('.bar-edge')
          .data(barData)
          .enter().append('path')
          .attr('class', d => 'bar-edge ' + d.level + ' bar-edge-' + d.name)
          .attr('d', d => {
            let pd = [];

            let t;
            if (d.level === 'level1') { t = 15 + this_.options.node.width + 20; }
            if (d.level === 'level2') { t = 15 + this_.options.node.width + 12; }
            if (d.level === 'level3' && !d.left) {
              t = 15 + this_.options.node.width + 4;
            } else if (d.level === 'level3' && d.left) {
              t = -11;
            }

            let st = [t + 5, d.st + (d.ed - d.st) / 2];
            let ed;
            let e = $('#' + d.name);
            if (e.position()) {
              ed = [2 * this_.options.width / 3, $('#' + d.name).position().top - 18];
            } else {
              ed = st;
            }
            let ml = [st[0] + 1 / 3 * (ed[0] - st[0]), st[1]],
              mr = [st[0] + 2 / 3 * (ed[0] - st[0]), ed[1]];
            pd.push(st, ml, mr, ed);
            return lineCurve(pd);
          })
          .style('fill', 'none')
          // .style('stroke', '#3093f2')
          .style('stroke', d => barEdgeColor[d.name].color)
          .style('stroke-width', 1)
          .style('opacity', d => {
            if (stretchData[d.name].parent && !this_.options.sOpen[stretchData[d.name].parent.name]) {
              return 0;
            }
            if (!this_.options.sOpen[d.name]) { return 0.6; }
            return 0;
          });

        // barEdgeNodes.selectAll('.bar-edge-node')
        //   .data(barData)
        //   .enter().append('circle')
        //   .attr('class', d => 'bar-edge-node ' + d.level + ' bar-edge-node-' + d.name)
        //   .attr('cx', 2 * this_.options.width / 3 - 12)
        //   .attr('cy', (d: any) => {
        //     let ed;
        //     let e = $('#' + d.name);
        //     if (e.position()) {
        //       return $('#' + d.name).position().top;
        //     }
        //   })
        //   .attr('r', 2)
        //   .style('fill', '#2089ed')
        //   .style('opacity', d => {
        //     let e = $('#' + d.name);
        //     if (e.position()) {
        //       return 1;
        //     }
        //     return 0;
        //   });

        // levelNodeEdges.selectAll('.level-node-edge')
        //   .data(levelLinkData)
        //   .enter().append('line')
        //   .attr('class', 'level-node-edge')
        //   .attr('x1', 2 * this_.options.width / 3 - 12)
        //   .attr('y1', (d: any) => {
        //     return $('.bar-edge-node-' + d[0].name).attr('cy');
        //   })
        //   .attr('x2', 2 * this_.options.width / 3 - 12)
        //   .attr('y2', (d: any) => {
        //     return $('.bar-edge-node-' + d[1].name).attr('cy');
        //   })
        //   .style('stroke', '#2089ed')
        //   .style('stroke-width', 1)
        //   .style('opacity', 0.6);
      }, 2000);
      updateEdge();

      function layerMouseOver(layerName) {
        $('.bar').attr('fill', '#3093f2');
        $('.bar-' + layerName).attr('fill', '#f9a814');
        _.each(barEdgeColor, (d: any) => {
          d.color = '#2089ed';
        });
        barEdgeColor[layerName].color = '#f9a814';
      }

      function layerMouseOut(layerName) {
        $('.bar').attr('fill', '#3093f2');
        _.each(barEdgeColor, (d: any) => {
          d.color = '#2089ed';
        });
      }

      Pip.onHoveringLayer(scope, layerName => {
        layerMouseOver(layerName);
      });

      Pip.onLeavingLayer(scope, layerName => {
        layerMouseOut(layerName);
      });

      function clickHandler(d) {
        let open = !this_.options.sOpen[d.name];
        if (open && stretchData[d.name].nodes) {
          let p = stretchData[d.name].parent;
          if (!(p && !this_.options.sOpen[p.name])) {
            $(this).css('opacity', 0.1);
            this_.options.sOpen[d.name] = true;
            for (let o of stretchData[d.name].nodes) {
              $('.bar-' + o.name).css('opacity', 1);
            }
          }
        } else if (!open && stretchData[d.name].nodes) {
          $(this).css('opacity', 1);
          this_.options.sOpen[d.name] = false;
          for (let o of stretchData[d.name].nodes) {
            $('.bar-' + o.name).css('opacity', 0.1);
            this_.options.sOpen[o.name] = false;
            if (o.nodes) {
              for (let oo of o.nodes) {
                $('.bar-' + oo.name).css('opacity', 0.1);
                this_.options.sOpen[oo.name] = false;
              }
            }
          }
        }
        Pip.emitLayerOpen(null);
      }

      function updateEdge() {
        setTimeout(function () {
          bars.selectAll('.bar')
            .style('opacity', (d: any) => {
              let e = $('#' + d.name);
              if (!e.position()) {
                return 0.2;
              }
              if (stretchData[d.name].parent && !this_.options.sOpen[stretchData[d.name].parent.name]) {
                return 0.2;
              }
              if (!this_.options.sOpen[d.name]) { return 1; }
              return 0.2;
            });
          barEdges.selectAll('.bar-edge')
            .attr('d', (o: any) => {
              let pd = [];

              let t;
              if (o.level === 'level1') { t = 15 + this_.options.node.width + 20; }
              if (o.level === 'level2') { t = 15 + this_.options.node.width + 12; }
              if (o.level === 'level3' && !o.left) {
                t = 15 + this_.options.node.width + 4;
              } else if (o.level === 'level3' && o.left) {
                t = -11;
              }

              let st = [t + 5, o.st + (o.ed - o.st) / 2];
              let ed;
              let e = $('#' + o.name);
              if (e.position()) {
                ed = [2 * this_.options.width / 3, $('#' + o.name).position().top - 18];
              } else {
                ed = st;
              }

              if (o.level === 'level3' && o.left) {
                let tm = 15 + this_.options.node.width + 16;
                let tmpArray = [];
                st[1] += 3;
                tmpArray.push(st);
                tmpArray.push([tm, st[1]]);
                let pathStr = line(tmpArray);

                st[0] = tm;
                let ml = [st[0] + 1 / 3 * (ed[0] - st[0]), st[1]],
                  mr = [st[0] + 2 / 3 * (ed[0] - st[0]), ed[1]];
                pd.push(st, ml, mr, ed);
                return pathStr + ' ' + lineCurve(pd);
              } else {
                let ml = [st[0] + 1 / 3 * (ed[0] - st[0]), st[1]],
                  mr = [st[0] + 2 / 3 * (ed[0] - st[0]), ed[1]];
                pd.push(st, ml, mr, ed);
                return lineCurve(pd);
              }

            })
            .style('fill', 'none')
            .style('stroke', (d: any) => barEdgeColor[d.name].color)
            .style('stroke-width', 1)
            .style('opacity', (o: any) => {
              if (stretchData[o.name].parent && !this_.options.sOpen[stretchData[o.name].parent.name]) {
                return 0;
              }
              if (!this_.options.sOpen[o.name]) { return 0.6; }
              return 0;
            });

          updateEdge();
        }, 500);
      }
      // console.log(data);
    }

    private barDataConstruction(data, location) {
      let this_ = this;
      let r = [];
      for (let d of data) {
        let dst, ded;
        if (!d.nodes) {
          dst = location[d.name]; ded = dst + this_.options.node.height;
          r.push({ name: d.name, level: 'level1', st: dst, ed: ded });
          this_.options.sOpen[d.name] = false;
        } else if (d.nodes) {
          this_.options.sOpen[d.name] = true;
          dst = location[d.nodes[0].nodes[0].name];
          let tmp: any = _.last(d.nodes);
          tmp = _.last(tmp.nodes);
          ded = location[tmp.name] + this_.options.node.height;
          r.push({ name: d.name, level: 'level1', st: dst, ed: ded });
          for (let dd of d.nodes) {
            this_.options.sOpen[dd.name] = true;
            let ddst, dded;
            ddst = location[dd.nodes[0].name];
            let tmp2: any = _.last(dd.nodes);
            dded = location[tmp2.name] + this_.options.node.height;
            r.push({ name: dd.name, level: 'level2', st: ddst, ed: dded });
            for (let ddd of dd.nodes) {
              this_.options.sOpen[ddd.name] = false;
              let dddst, ddded;
              dddst = location[ddd.name];
              ddded = dddst + this_.options.node.height;
              r.push({ name: ddd.name, level: 'level3', st: dddst, ed: ddded });
            }
            let lr: any = _.last(r);
            if (dd.nodes.length === 4) { lr.left = true; }
          }
        }
      }
      return r;
    }

    private levelLinkDataConstruction(data) {
      let this_ = this;
      let r = [];
      for (let d of data) {
        if (d.nodes) {
          let la: any = _.last(d.nodes);
          let laa: any = _.last(la.nodes);
          r.push([d.nodes[0], la, -1]);
          r.push([d.nodes[0], laa, -1]);
          r.push([d.nodes[0].nodes[0], la, -1]);
          r.push([d.nodes[0].nodes[0], laa, -1]);
          for (let dd of d.nodes) {
            r.push([dd.nodes[0], _.last(dd.nodes), -2]);
          }
        }
      }
      return r;
    }

    private stretchData(data) {
      let this_ = this;
      let r = {};
      for (let d of data) {
        r[d.name] = d;
        if (d.nodes) {
          for (let dd of d.nodes) {
            r[dd.name] = dd;
            for (let ddd of dd.nodes) {
              r[ddd.name] = ddd;
            }
          }
        }
      }
      return r;
    }

    private nodesDataConstruction(data) {
      let this_ = this;
      let nodes = [];
      nodes.push({ name: 'data', type: 'data' });
      _.each(data, (d, di) => {
        if (d.name === 'conv1') {
          let info = this_.options.layers[d.name];
          nodes.push({ name: d.name, type: 'conv', info });
          nodes.push({ type: 'other', edgeType: 1 });
        } else if (d.name === 'fc1000') {
          let info = this_.options.layers[d.name];
          nodes.push({ type: 'other' });
          nodes.push({ name: d.name, type: 'fc', info });
        }
        else {
          _.each(d.nodes, (dd, ddi) => {
            let tmp = dd.nodes;
            if (dd.nodes.length === 4) { tmp = dd.nodes.slice(0, 3); }
            _.each(tmp, o => {
              let info = this_.options.layers[o.name];
              nodes.push({ name: o.name, type: 'conv-right', info });
            });
            if (dd.nodes.length === 4) {
              let info = this_.options.layers[dd.nodes[3].name];
              nodes.push({ name: dd.nodes[3].name, type: 'conv-left', info });
            }
            if (+ddi === d.nodes.length - 1) {
              nodes.push({ type: 'other', edgeType: 1 });
            } else {
              nodes.push({ type: 'other', edgeType: 2 });
            }
          });
        }
      });
      delete nodes[nodes.length - 3].edgeType;
      return nodes;
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
          let board = new Painter(element, scope.options, scope.data);
          board.render(Pip, scope);
        };
        if (!_.isUndefined(scope.data)) { start(); };
        scope.$watch('data', (n, o) => { if (n !== o && n) { start(); } }, false);

      };
    }
  }

  angular
    .module('vis')
    .directive('layerGraph', Directive.factory());
}
