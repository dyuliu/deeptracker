/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

declare var d3: any;

declare var ace: any;

declare var BSON: any;

declare var numeric: any;
declare var LG: any;

// extend jquery
interface JQuery {
    ace_scroll: any;
    widget_box: any;
}

// Please define your own interface below for config
declare namespace mean {
    interface IAssets {
        client: {
            lib?: {
                css: string[],
                js: string[]
            },
            css?: string[],
            less?: string[],
            sass?: string[],
            resource?: string[],
            template?: string,
            views?: string[]
            js?: string[]
        };
        server?: {
            gulpConfig?: string,
            allJS?: string[],
            models?: string[],
            routes?: string[],
            views?: string[]
        };
    }

    interface IEnv {
        app?: {
            title?: string,
            description?: string,
            keywords?: string,
            authors?: string[]
        };
        livereload?: boolean;
        db?: {
            uri: string,
            options: {
                user: string,
                pass: string
            },
            debug: boolean
        };
        dbNameBase?: string;
        projectDir?: string;
        port?: number;
        host?: string;
        templateEngine?: string;
        favicon?: string;
        meanjs?: string;
        log?: {
            format: string,
            fileLogger?: {
                directoryPath: string,
                fileName: string,
                maxsize: number,
                maxFiles: number,
                json: boolean
            },
            options?: {}
        };
        sessionCookie?: {};
    }

    interface IGlobbedFiles {
        client: {
            js?: string[],
            css?: string[]
        };
        server: {
            models?: string[],
            routes?: string[]
        };
    }

    interface IGblobbedFolders {
        client: string[];
        server: string[];
    }

    interface IAppConfig extends IAssets, IEnv {
        files?: IGlobbedFiles;
        folders?: IGblobbedFolders;
    }

}
