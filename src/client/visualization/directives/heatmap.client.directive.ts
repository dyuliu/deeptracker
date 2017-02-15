namespace application {
  'use strict';

  // define your interfaces here
  export interface ICanvasData {
    iter: number;
    value: number[];
  }

  export interface ICanvasRange {
    iter: number;
    value: number;
  }

  export interface IHeatMapData {
    data: ICanvasData[];
    max: ICanvasRange[];
    min: ICanvasRange[];
  }

  class HeatMapCanvas {
    public ele: d4.Selection<any, any, any, any>;
    public width = 1004;
    public height = 800;
    public margin = { top: 10, right: 10, bottom: 10, left: 10 };
    private _data: IHeatMapData;

    constructor(element: d4.Selection<any, any, any, any>) {
      element
        .style('width', this.width + 'px')
        .style('height', this.height + 'px');

      this.ele = element.append('table')
        .style('width', '100%')
        .style('height', '100%')
        .style('margin', '20px')
        .attr('cellspacing', '0')
        .attr('cellpadding', '0')
        .append('tbody');
    }

    public render(data: IHeatMapData) {
      console.log('rendering');
      this._data = data;
      let that = this;

      let [min, max] = [
        d4.min(data.min, (o: any) => o.value),
        d4.max(data.max, (o: any) => o.value)
      ];

      let fy = d4.scaleLinear()
        .domain([min, max])
        .range([this.height, 0]);

      let fHeight = (id: number): number => {
        return fy(data.min[id].value) - fy(data.max[id].value);
      };

      let color = this.color([0, 1]);

      let stripeWidth = this.width / data.data.length;

      let stripeCanvas = this.ele.append('tr')
        .selectAll('.stripe_canvas')
        .data(_.range(data.data.length));
        // .data(_.range(100));
      stripeCanvas.exit().remove();
      stripeCanvas.enter()
        .append('td')
         .attr('align', 'center')
        .append('canvas')
         .classed('stripe_canvas', true)
         .attr('width', stripeWidth)
         .attr('height', (id) => fHeight(id))
         .each( function(id) {
          //  let ctx = <CanvasRenderingContext2D>this.getContext('2d');
          //  let stripeHeight = fHeight(id) / data.data[id].value.length;
          //  for (let subId = 0; subId < data.data[id].value.length; subId += 1) {
          //    let image = ctx.createImageData(stripeWidth, stripeHeight);
          //    let cr = color(data.data[id].value[subId]);
          //   //  let cr = color(Math.random());
          //    for (let i = 0; i < image.data.length; i += 4) {
          //      image.data[i + 0] = cr.r;
          //      image.data[i + 1] = cr.g;
          //      image.data[i + 2] = cr.b;
          //      image.data[i + 3] = 255;
          //    }
          //    ctx.putImageData(image, 0, stripeHeight * subId);
          //  };
         });
    }

    public color(domain?: [number, number]): (v: number) => d4.RGBColor {
      if (!domain) { domain = [0, 1]; }
      let dict: d4.RGBColor[] = [];
      let cnts = 100;
      let min = domain[0];
      let max = domain[1];
      let scale = d4.scaleLinear<any, any>()
        .domain(domain)
        .range([d4.rgb('#89e989'), d4.rgb('#f00')])
        .interpolate(d4.interpolateRgb);

      for (let i = 0; i <= cnts; i++) {
        dict.push(d4.rgb(scale(i / cnts)));
      }
      let ret = v => {
        return dict[Math.floor((v - min) / (max - min) * 100)];
      };
      return ret;
    }
  }

  class HeatMapDirective {

    public link: (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) => void;
    public restrict = 'EA';
    public template = '<div id="spectrum"></div>';
    public scope = {};

    public static factory() {
      let directive = (sPip) => {
        return new HeatMapDirective(sPip);
      };

      directive.$inject = ['Pip'];

      return directive;
    }

    constructor(Pip) {
      HeatMapDirective.prototype.link = function (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) {

        // bind element to d4.selection


        // when receiving data, then start render
        Pip.onHeatmapDataLoaded(scope, (data: IHeatMapData) => {
          element.find('#spectrum').empty();
          let canvas = new HeatMapCanvas(d4.select(element.find('#spectrum')[0]));
          canvas.render(data);
        });

      };
    }
  }

  angular
    .module('vis')
    .directive('heatmap', HeatMapDirective.factory());
}
