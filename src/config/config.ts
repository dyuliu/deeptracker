'use strict';

import * as _ from 'lodash';
import * as glob from 'glob';
import * as confDefault from './env/env-default';
import * as confProduction from './env/env-production';

/**
 * Get files by glob patterns
 */
let getGlobbedPaths = function (globPatterns, excludes?) {
    // URL paths regex
    let urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

    // The output array
    let output = [];

    // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
    if (_.isArray(globPatterns)) {
        globPatterns.forEach(function (globPattern) {
            output = _.union(output, getGlobbedPaths(globPattern, excludes));
        });
    } else if (_.isString(globPatterns)) {
        if (urlRegex.test(globPatterns)) {
            output.push(globPatterns);
        } else {
            let files = glob.sync(globPatterns);
            if (excludes) {
                files = files.map(function (f: any) {
                    if (_.isArray(excludes)) {
                        for (let i in excludes) {
                            if (excludes.hasOwnProperty(i)) {
                                f = f.replace(excludes[i], '');
                            }
                        }
                    } else {
                        f = f.replace(excludes, '');
                    }
                    return f;
                });
            }
            output = _.union(output, files);
        }
    }

    return output;
};

/**
 * Initialize global configuration files
 */
function initGlobalConfigFolders(assets: mean.IAppConfig): mean.IGblobbedFolders {
    // Appending files
    let folders: mean.IGblobbedFolders = {
        client: [],
        server: []
    };

    // Setting globbed client paths
    folders.client = getGlobbedPaths(
        ['src/client/*/', 'build/client/*/'],
        process.cwd().replace(new RegExp('/\\/g'), '/')
    );

    return folders;
};

/**
 * Initialize global configuration files
 */
function initGlobalConfigFiles(config: mean.IAppConfig): mean.IGlobbedFiles {
    // Appending files
    let files: mean.IGlobbedFiles = {
        server: {
            models: getGlobbedPaths(config.server.models),
            routes: getGlobbedPaths(config.server.routes)
        },
        client: {
            js: getGlobbedPaths(config.client.lib.js, 'public/')
                .concat(getGlobbedPaths(config.client.js, ['public/'])),
            css: getGlobbedPaths(config.client.lib.css, 'public/')
                .concat(getGlobbedPaths(config.client.css, ['public/']))
        }
    };

    return files;
};

/**
 * Initialize global configuration
 */
function initGlobalConfig(): mean.IAppConfig {

    let config: mean.IAppConfig;

    let customizer = function (objValue, srcValue) {
        if (_.isArray(objValue)) {
            return srcValue;
        }
    };
    config = _.merge(confDefault.assets, confDefault.env);
    if (process.env.NODE_ENV === 'production') {
        _.mergeWith(config, confProduction.assets,
            confProduction.env, customizer);
    };
    config = _.merge(config, {
        files: initGlobalConfigFiles(config),
        folders: initGlobalConfigFolders(config)
    });

    return config;
};

export = initGlobalConfig();
