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
