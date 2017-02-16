'use strict';

namespace application {

  interface IScope extends ng.IScope {
    dbList: IInfoDBDataType;
    selectedDB: IInfoDBEle;
    typeList: string[];
    selectedType: { value: string };
    chartTypeList: string[];
    selectedChartType?: { value: string };
    dataLr: IRecordDataType;  // nvd3 chart data
    dataError: IRecordDataType;  // nvd3 chart data
    dataLoss: IRecordDataType;  // nvd3 chart data
    options: any;  // nvd3 chart config
    config?: any;
    api?: any;
    render(): void; // button for adding data to chart
  }

  class Controller {
    public static $inject: string[] = ['$scope', 'DataManager', 'Global', '$q'];

    constructor(
      public $scope: IScope,
      DataManager: IDataManagerService,
      public Global: IGlobalService,
      $q: ng.IQService
    ) {
      let this_ = this;
      $('.dd').nestable();

      $('.dd-handle a').on('mousedown', function (e) {
        e.stopPropagation();
      });

      $('[data-rel="tooltip"]').tooltip();

    }

  }

  angular
    .module('vis')
    .controller('LayerController', Controller);
}


