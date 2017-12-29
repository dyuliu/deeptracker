namespace application {
  'use strict';

  export interface StackedAreaChartEle {
    key: string;
    values: Array<[number, number]>;
  }

  export interface StackedAreaChartDataType extends Array<StackedAreaChartEle> {};

  export interface IDataProcessorService {
    stackedAreaChart(rawData: ILayerEle[]): StackedAreaChartDataType;
  };

  class DataProcessor implements IDataProcessorService {
    public static $inject = [];

    constructor() {
      // do somethings here
    }

    public stackedAreaChart(rawData: ILayerEle[]): StackedAreaChartDataType {
      let res: StackedAreaChartDataType;

      // make sure the order is right
      rawData = _.sortBy(rawData, ['iter']);

      _.each(rawData, (d: ILayerEle) => {
        if (res) {
          _.each(res, (dd: StackedAreaChartEle) => {
            dd.values.push([d.iter, (d.value[dd.key])]);
          });
        } else {
          // init
          res = [];
          _.each(d.value, (dd: number, dkey: string) => {
            res.push({key: dkey, values: [[d.iter, (dd)]]});
          });
        }
      });
      return res;
      // let result: any = { key: conf.dbName + '_' + conf.recType };
      // data = _.sortBy(data, 'iter');

      // let colors = d3.scale.category10().range();
      // result.color = colors[conf.count % 10];
      // result.values = _.map(data, (o: IRecordEle) => {
      //   return [o.iter, o.value];
      // });
    };
  }

  angular
    .module('utils')
    .service('DataProcessor', DataProcessor);
}
