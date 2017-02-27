namespace application {
  'use strict';

  export interface IPipService {
    emitUrlChanged(msg: any): void;
    emitVlDiv(msg: any): void;
    emitModelChanged(msg: any): void;
    emitTimeChanged(msg: any): void;
    emitRecordConfigChanged(msg: any): void;
    emitLabelConfigChanged(msg: any): void;
    onUrlChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onVlDiv(scope: ng.IScope, cb: (msg: any) => void): void;
    onModelChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onTimeChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onRecordConfigChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onLabelConfigChanged(scope: ng.IScope, cb: (msg: any) => void): void;
  }

  export class Pip {

    public exports: any;
    private addEvent: (eventName: string) => void;
    private transName: (originName: string) => string;

    public static factory() {
      let service = ($rootScope: ng.IRootScopeService) => {
        return new Pip($rootScope).exports;
      };
      service.$inject = ['$rootScope'];
      return service;
    }

    constructor($rootScope: ng.IRootScopeService) {
      // initialize
      this.exports = {};

      // private methods
      this.transName = (nm) => {
        return nm[0].toUpperCase() + nm.slice(1);
      };

      // public methods
      this.addEvent = function (evtName) {
        let name = this.transName(evtName);
        this.exports['emit' + name] = (msg) => {
          // console.log('emit', name);
          $rootScope.$broadcast(evtName, msg);
        };
        this.exports['on' + name] = (scope, cb) => {
          // console.log('receive', name);
          scope.$on(evtName, (event, msg) => { cb(msg); });
        };
      };

      // adding events one by one
      this.addEvent('urlChanged');
      this.addEvent('vlDiv');
      this.addEvent('modelChanged');
      this.addEvent('timeChanged');
      this.addEvent('recordConfigChanged');
      this.addEvent('labelConfigChanged');
    }
  }

  angular
    .module('utils')
    .factory('Pip', Pip.factory());
}
