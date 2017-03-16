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

    public render(Pip: IPipService) {
      let this_ = this;
      this_.Pip = Pip;
      console.log('rendering', this_.data);
      let data = this_.dataConstruction(this_.data);

      // move g to the center
      let rects = this_.svg.append('g')
        .attr('transform', 'translate(' + (this_.options.width / 2) + ', 0)');

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
        .attr('height', this_.options.node.height);

      // console.log(data);
    }

    private dataConstruction(data) {
      let this_ = this;
      let nodes = [];
      nodes.push({ name: 'data', type: 'data' });
      _.each(data, d => {
        if (d.name === 'conv1') {
          let info = this_.options.layers[d.name];
          nodes.push({ name: d.name, type: 'conv', info });
          nodes.push({ type: 'other' });
        } else if (d.name === 'fc1000') {
          let info = this_.options.layers[d.name];
          nodes.push({ type: 'other' });
          nodes.push({ name: d.name, type: 'fc', info });
        }
        else {
          _.each(d.nodes, dd => {
            let tmp = dd.nodes;
            if (dd.nodes.length === 4) { tmp = dd.nodes.slice(1, 4); }
            _.each(tmp, o => {
              let info = this_.options.layers[o.name];
              nodes.push({ name: o.name, type: 'conv-right', info });
            });
            if (dd.nodes.length === 4) {
              let info = this_.options.layers[dd.nodes[0].name];
              nodes.push({ name: dd.nodes[0].name, type: 'conv-left', info });
            }
            nodes.push({ type: 'other' });
          });
        }
      });
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
          board.render(Pip);
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
