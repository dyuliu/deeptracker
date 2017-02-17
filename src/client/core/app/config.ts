'use strict';

namespace application {
    export let applicationName = 'cnn_ts_mean';

    export let applicationVendorDependencies = [
        'ngSanitize',
        'ngResource',
        'ngAnimate',
        'ui.router',
        'nvd3',
        'mgcrea.ngStrap'
    ];

    export function registerModule(moduleName: string, dependencies?: string[]) {
        // Create angular module
        angular.module(moduleName, dependencies || []);

        // Add the module to the AngularJS configuration file
        angular
            .module(applicationName)
            .requires.push(moduleName);
    }
}
