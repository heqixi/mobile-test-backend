"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    PUPPETEER_ENDPOINT_FILE: ()=>PUPPETEER_ENDPOINT_FILE,
    WebPuppeteerMidsceneTools: ()=>WebPuppeteerMidsceneTools,
    buildDetachedChromeArgs: ()=>buildDetachedChromeArgs
});
const external_node_child_process_namespaceObject = require("node:child_process");
const external_node_fs_namespaceObject = require("node:fs");
const promises_namespaceObject = require("node:fs/promises");
const external_node_os_namespaceObject = require("node:os");
const external_node_path_namespaceObject = require("node:path");
const core_namespaceObject = require("@midscene/core");
const agent_behavior_init_args_namespaceObject = require("@midscene/shared/agent-tools/agent-behavior-init-args");
const base_tools_namespaceObject = require("@midscene/shared/agent-tools/base-tools");
const chrome_path_namespaceObject = require("@midscene/shared/agent-tools/chrome-path");
const external_puppeteer_core_namespaceObject = require("puppeteer-core");
var external_puppeteer_core_default = /*#__PURE__*/ __webpack_require__.n(external_puppeteer_core_namespaceObject);
const external_agent_init_args_js_namespaceObject = require("./agent-init-args.js");
const viewport_js_namespaceObject = require("./common/viewport.js");
const index_js_namespaceObject = require("./puppeteer/index.js");
const external_static_index_js_namespaceObject = require("./static/index.js");
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
const ENDPOINT_FILE = (0, external_node_path_namespaceObject.join)((0, external_node_os_namespaceObject.tmpdir)(), 'midscene-puppeteer-endpoint');
const USER_DATA_DIR = (0, external_node_path_namespaceObject.join)((0, external_node_os_namespaceObject.tmpdir)(), 'midscene-puppeteer-profile');
const DETACHED_CHROME_LAUNCH_TIMEOUT_MS = 30000;
const PUPPETEER_ENDPOINT_FILE = ENDPOINT_FILE;
function buildDetachedChromeArgs(options) {
    const viewport = options.viewport ?? viewport_js_namespaceObject.defaultPuppeteerWindowViewportSize;
    return [
        '--headless=new',
        `--user-data-dir=${options.userDataDir}`,
        '--remote-debugging-port=0',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-background-networking',
        '--password-store=basic',
        '--use-mock-keychain',
        `--window-size=${viewport.width},${viewport.height}`,
        '--force-color-profile=srgb'
    ];
}
function terminateDetachedChrome(proc) {
    if (proc.killed || null !== proc.exitCode || null !== proc.signalCode) return;
    if ('win32' !== process.platform && proc.pid) try {
        process.kill(-proc.pid, 'SIGKILL');
        return;
    } catch  {}
    try {
        proc.kill('SIGKILL');
    } catch  {}
}
class PuppeteerBrowserManager {
    get endpointFile() {
        return this.persistence.endpointFile || ENDPOINT_FILE;
    }
    get userDataDir() {
        return this.persistence.userDataDir || USER_DATA_DIR;
    }
    async getOrLaunch(viewport) {
        const endpointFile = this.endpointFile;
        if ((0, external_node_fs_namespaceObject.existsSync)(endpointFile)) try {
            const endpoint = (await (0, promises_namespaceObject.readFile)(endpointFile, 'utf-8')).trim();
            const browser = await external_puppeteer_core_default().connect({
                browserWSEndpoint: endpoint,
                defaultViewport: null
            });
            return {
                browser,
                reused: true
            };
        } catch  {
            try {
                await (0, promises_namespaceObject.unlink)(endpointFile);
            } catch  {}
        }
        const wsEndpoint = await this.launchDetachedChrome(viewport);
        await (0, promises_namespaceObject.writeFile)(endpointFile, wsEndpoint);
        const browser = await external_puppeteer_core_default().connect({
            browserWSEndpoint: wsEndpoint,
            defaultViewport: null
        });
        return {
            browser,
            reused: false
        };
    }
    async closeBrowser() {
        const endpointFile = this.endpointFile;
        if (!(0, external_node_fs_namespaceObject.existsSync)(endpointFile)) return;
        try {
            const endpoint = (await (0, promises_namespaceObject.readFile)(endpointFile, 'utf-8')).trim();
            const browser = await external_puppeteer_core_default().connect({
                browserWSEndpoint: endpoint
            });
            await browser.close();
        } catch  {}
        try {
            await (0, promises_namespaceObject.unlink)(endpointFile);
        } catch  {}
    }
    disconnect() {
        if (this.activeBrowser) {
            this.activeBrowser.disconnect();
            this.activeBrowser = null;
        }
    }
    async launchDetachedChrome(viewport) {
        const chromePath = (0, chrome_path_namespaceObject.resolveChromePath)();
        const userDataDir = this.userDataDir;
        await (0, promises_namespaceObject.mkdir)(userDataDir, {
            recursive: true
        });
        const args = buildDetachedChromeArgs({
            userDataDir,
            viewport
        });
        const proc = (0, external_node_child_process_namespaceObject.spawn)(chromePath, args, {
            detached: true,
            stdio: [
                'ignore',
                'ignore',
                'pipe'
            ]
        });
        proc.unref();
        return new Promise((resolve, reject)=>{
            let output = '';
            let settled = false;
            const cleanup = ()=>{
                clearTimeout(timeout);
                proc.stderr.removeListener('data', onData);
                proc.removeListener('exit', onExit);
            };
            const resolveOnce = (value)=>{
                if (settled) return;
                settled = true;
                cleanup();
                resolve(value);
            };
            const rejectOnce = (error, terminate = false)=>{
                if (settled) return;
                settled = true;
                if (terminate) terminateDetachedChrome(proc);
                cleanup();
                reject(error);
            };
            const onData = (data)=>{
                output += data.toString();
                const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
                if (match) resolveOnce(match[1]);
            };
            proc.stderr.on('data', onData);
            const onExit = (code, signal)=>{
                rejectOnce(new Error(`Chrome exited with code ${code ?? signal} before DevTools was ready.\nChrome stderr: ${output}\nTip: if running in a container, launch Chrome with sandbox-compatible arguments.`));
            };
            proc.on('exit', onExit);
            const timeout = setTimeout(()=>rejectOnce(new Error(`Chrome launch timeout.\nChrome stderr: ${output}\nTip: if running in a container, launch Chrome with sandbox-compatible arguments.`), true), DETACHED_CHROME_LAUNCH_TIMEOUT_MS);
        });
    }
    constructor(persistence = {}){
        _define_property(this, "persistence", void 0);
        _define_property(this, "activeBrowser", void 0);
        this.persistence = persistence;
        this.activeBrowser = null;
    }
}
const defaultBrowserManager = new PuppeteerBrowserManager();
class WebPuppeteerMidsceneTools extends base_tools_namespaceObject.BaseMidsceneTools {
    getCliReportSessionName() {
        return 'midscene-web';
    }
    createTemporaryDevice() {
        return new external_static_index_js_namespaceObject.StaticPage({
            screenshot: core_namespaceObject.ScreenshotItem.create('', Date.now()),
            shotSize: this.viewport ?? viewport_js_namespaceObject.defaultStaticPageViewportSize,
            shrunkShotToLogicalRatio: 1
        });
    }
    async ensureAgent(initArgs) {
        const navigateToUrl = initArgs?.url;
        const nextSignature = (0, agent_behavior_init_args_namespaceObject.getAgentInitArgsSignature)(initArgs);
        const shouldOpenUrl = 'string' == typeof navigateToUrl;
        if (this.agent && (shouldOpenUrl || (0, agent_behavior_init_args_namespaceObject.shouldRebuildAgentForInitArgs)(this.lastInitArgsSignature, nextSignature))) {
            try {
                await this.agent?.destroy?.();
            } catch  {}
            this.agent = void 0;
        }
        if (this.agent) return this.agent;
        const { browser, reused } = await this.browserManager.getOrLaunch(this.viewport);
        this.browserManager.activeBrowser = browser;
        const pages = await browser.pages();
        let page;
        if (navigateToUrl) {
            page = await browser.newPage();
            if (this.viewport) await page.setViewport(this.viewport);
            await page.goto(navigateToUrl, {
                timeout: 30000,
                waitUntil: 'domcontentloaded'
            });
        } else {
            const webPages = pages.filter((p)=>/^https?:\/\//.test(p.url()));
            page = webPages.length > 0 ? webPages[webPages.length - 1] : pages[pages.length - 1] || await browser.newPage();
            if (reused) await page.bringToFront();
            if (this.viewport) await page.setViewport(this.viewport);
        }
        const reportOptions = this.readCliReportAgentOptions();
        this.agent = new index_js_namespaceObject.PuppeteerAgent(page, {
            ...(0, agent_behavior_init_args_namespaceObject.extractAgentBehaviorInitArgs)(initArgs) ?? {},
            ...reportOptions ?? {}
        });
        this.lastInitArgsSignature = nextSignature;
        return this.agent;
    }
    async destroy() {
        await super.destroy();
        this.browserManager.disconnect();
    }
    preparePlatformTools() {
        return [
            {
                name: 'web_connect',
                description: 'Connect to a web page. Opens a new tab with the given URL, or reuses the current page.',
                schema: this.getAgentInitArgSchema(),
                cli: this.getAgentInitArgCliMetadata(),
                handler: async (args)=>{
                    const initArgs = this.extractAgentInitParam(args);
                    const url = initArgs?.url;
                    if (this.agent) {
                        try {
                            await this.agent.destroy?.();
                        } catch  {}
                        this.agent = void 0;
                        this.lastInitArgsSignature = void 0;
                    }
                    const reportSession = this.createNewCliReportSession(url ?? 'current-page');
                    this.commitCliReportSession(reportSession);
                    this.agent = await this.ensureAgent(initArgs);
                    const screenshot = await this.agent.page?.screenshotBase64();
                    const label = url ?? 'current page';
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Connected to: ${label}`
                            },
                            ...screenshot ? this.buildScreenshotContent(screenshot) : []
                        ]
                    };
                }
            },
            {
                name: 'web_disconnect',
                description: 'Disconnect from current web page. The browser stays running for future calls.',
                schema: {},
                handler: async ()=>{
                    if (this.agent) {
                        try {
                            await this.agent.destroy?.();
                        } catch  {}
                        this.agent = void 0;
                        this.lastInitArgsSignature = void 0;
                    }
                    this.browserManager.disconnect();
                    return this.buildTextResult('Disconnected from web page (browser still running)');
                }
            },
            {
                name: 'web_close',
                description: 'Close the browser completely and release all resources.',
                schema: {},
                handler: async ()=>{
                    if (this.agent) {
                        try {
                            await this.agent.destroy?.();
                        } catch  {}
                        this.agent = void 0;
                        this.lastInitArgsSignature = void 0;
                    }
                    await this.browserManager.closeBrowser();
                    return this.buildTextResult('Browser closed');
                }
            }
        ];
    }
    constructor(viewport, options = {}){
        super(), _define_property(this, "viewport", void 0), _define_property(this, "browserManager", void 0), _define_property(this, "lastInitArgsSignature", void 0), _define_property(this, "initArgSpec", {
            namespace: 'web',
            shape: external_agent_init_args_js_namespaceObject.webAgentInitArgShape,
            cli: {
                preferBareKeys: true
            },
            adapt: external_agent_init_args_js_namespaceObject.adaptWebAgentInitArgs
        });
        this.viewport = viewport ? {
            ...viewport
        } : void 0;
        this.browserManager = options.persistence ? new PuppeteerBrowserManager(options.persistence) : defaultBrowserManager;
    }
}
exports.PUPPETEER_ENDPOINT_FILE = __webpack_exports__.PUPPETEER_ENDPOINT_FILE;
exports.WebPuppeteerMidsceneTools = __webpack_exports__.WebPuppeteerMidsceneTools;
exports.buildDetachedChromeArgs = __webpack_exports__.buildDetachedChromeArgs;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "PUPPETEER_ENDPOINT_FILE",
    "WebPuppeteerMidsceneTools",
    "buildDetachedChromeArgs"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=agent-tools-puppeteer.js.map