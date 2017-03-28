namespace application {
  'use strict';

  export interface IPipService {
    emitUrlChanged(msg: any): void;
    emitVlDiv(msg: any): void;
    emitModelChanged(msg: any): void;
    emitTimeChanged(msg: any): void;
    emitRecordConfigChanged(msg: any): void;
    emitLabelConfigChanged(msg: any): void;
    emitLayerConfigChanged(msg: any): void;
    emitTimeboxConfigChanged(msg: any): void;
    emitCorrelationConfigChanged(msg: any): void;
    emitShowModal(msg: any): void;
    emitSyncHorizonScale(msg: any): void;
    emitTimeMouseOver(msg: any): void;
    emitTimeMouseOut(msg: any): void;
    emitTimeMouseMove(msg: any): void;
    emitTimePicked(msg: any): void;
    emitShowTopKernel(msg: any): void;
    emitLayerOpen(msg: any): void;
    emitFlip(msg: any): void;
    emitCorrelationReady(msg: any): void;
    emitClsWidth(msg: any): void;
    emitLayerHeight(msg: any): void;
    emitRenderLabelView(msg: any): void;
    emitHoveringLayer(msg: any): void;
    emitLeavingLayer(msg: any): void;
    emitHoveringCls(msg: any): void;
    emitLeavingCls(msg: any): void;
    onUrlChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onVlDiv(scope: ng.IScope, cb: (msg: any) => void): void;
    onModelChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onTimeChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onRecordConfigChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onLabelConfigChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onLayerConfigChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onTimeboxConfigChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onCorrelationConfigChanged(scope: ng.IScope, cb: (msg: any) => void): void;
    onShowModal(scope: ng.IScope, cb: (msg: any) => void): void;
    onSyncHorizonScale(scope: ng.IScope, cb: (msg: any) => void): void;
    onTimeMouseOver(scope: ng.IScope, cb: (msg: any) => void): void;
    onTimeMouseOut(scope: ng.IScope, cb: (msg: any) => void): void;
    onTimeMouseMove(scope: ng.IScope, cb: (msg: any) => void): void;
    onTimePicked(scope: ng.IScope, cb: (msg: any) => void): void;
    onShowTopKernel(scope: ng.IScope, cb: (msg: any) => void): void;
    onLayerOpen(scope: ng.IScope, cb: (msg: any) => void): void;
    onFlip(scope: ng.IScope, cb: (msg: any) => void): void;
    onCorrelationReady(scope: ng.IScope, cb: (msg: any) => void): void;
    onClsWidth(scope: ng.IScope, cb: (msg: any) => void): void;
    onLayerHeight(scope: ng.IScope, cb: (msg: any) => void): void;
    onRenderLabelView(scope: ng.IScope, cb: (msg: any) => void): void;
    onHoveringLayer(scope: ng.IScope, cb: (msg: any) => void): void;
    onLeavingLayer(scope: ng.IScope, cb: (msg: any) => void): void;
    onHoveringCls(scope: ng.IScope, cb: (msg: any) => void): void;
    onLeavingCls(scope: ng.IScope, cb: (msg: any) => void): void;
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
      this.addEvent('layerConfigChanged');
      this.addEvent('timeboxConfigChanged');
      this.addEvent('correlationConfigChanged');
      this.addEvent('showModal');
      this.addEvent('syncHorizonScale');
      this.addEvent('timeMouseOver');
      this.addEvent('timeMouseOut');
      this.addEvent('timeMouseMove');
      this.addEvent('timePicked');
      this.addEvent('showTopKernel');
      this.addEvent('layerOpen');
      this.addEvent('flip');
      this.addEvent('correlationReady');
      this.addEvent('clsWidth');
      this.addEvent('layerHeight');
      this.addEvent('renderLabelView');
      this.addEvent('hoveringLayer');
      this.addEvent('leavingLayer');
      this.addEvent('hoveringCls');
      this.addEvent('leavingCls');
    }
  }

  angular
    .module('utils')
    .factory('Pip', Pip.factory());
}
