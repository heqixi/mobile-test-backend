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
    WebCdpMidsceneTools: ()=>WebCdpMidsceneTools
});
const core_namespaceObject = require("@midscene/core");
const agent_behavior_init_args_namespaceObject = require("@midscene/shared/agent-tools/agent-behavior-init-args");
const base_tools_namespaceObject = require("@midscene/shared/agent-tools/base-tools");
const logger_namespaceObject = require("@midscene/shared/logger");
const external_puppeteer_core_namespaceObject = require("puppeteer-core");
var external_puppeteer_core_default = /*#__PURE__*/ __webpack_require__.n(external_puppeteer_core_namespaceObject);
const external_agent_init_args_js_namespaceObject = require("./agent-init-args.js");
const external_cdp_proxy_manager_js_namespaceObject = require("./cdp-proxy-manager.js");
const external_cdp_target_store_js_namespaceObject = require("./cdp-target-store.js");
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
const debug = (0, logger_namespaceObject.getDebug)('agent-tools:cdp');
const CDP_TARGET_DISCOVERY_DELAY_MS = 500;
function getTargetId(page) {
    return page.target()._targetId;
}
class WebCdpMidsceneTools extends base_tools_namespaceObject.BaseMidsceneTools {
    getCliReportSessionName() {
        return 'midscene-web';
    }
    createTemporaryDevice() {
        return new external_static_index_js_namespaceObject.StaticPage({
            screenshot: core_namespaceObject.ScreenshotItem.create('', Date.now()),
            shotSize: viewport_js_namespaceObject.defaultStaticPageViewportSize,
            shrunkShotToLogicalRatio: 1
        });
    }
    async ensureAgent(initArgs) {
        const navigateToUrl = initArgs?.url;
        const nextSignature = (0, agent_behavior_init_args_namespaceObject.getAgentInitArgsSignature)(initArgs);
        const shouldNavigateToUrl = 'string' == typeof navigateToUrl;
        if (this.agent && (shouldNavigateToUrl || (0, agent_behavior_init_args_namespaceObject.shouldRebuildAgentForInitArgs)(this.lastInitArgsSignature, nextSignature))) {
            try {
                await this.agent?.destroy?.();
            } catch (error) {
                console.debug('Failed to destroy agent during re-init:', error);
            }
            this.agent = void 0;
        }
        if (this.agent) return this.agent;
        if (!this.activeBrowser) {
            const endpoint = await (0, external_cdp_proxy_manager_js_namespaceObject.getProxyEndpoint)(this.cdpEndpoint);
            this.activeBrowser = await external_puppeteer_core_default().connect({
                browserWSEndpoint: endpoint,
                defaultViewport: null
            });
        }
        const browser = this.activeBrowser;
        let pages = await browser.pages();
        if (0 === pages.length) {
            await new Promise((r)=>setTimeout(r, CDP_TARGET_DISCOVERY_DELAY_MS));
            pages = await browser.pages();
        }
        const webPages = pages.filter((p)=>/^https?:\/\//.test(p.url()));
        debug('Found %d page(s), %d web page(s): %o', pages.length, webPages.length, pages.map((p)=>p.url()));
        let page;
        if (navigateToUrl) if (webPages.length > 0) {
            page = webPages[webPages.length - 1];
            await page.bringToFront();
            await page.goto(navigateToUrl, {
                timeout: 30000,
                waitUntil: 'domcontentloaded'
            });
        } else {
            page = await browser.newPage();
            await page.goto(navigateToUrl, {
                timeout: 30000,
                waitUntil: 'domcontentloaded'
            });
        }
        else {
            const savedTargetId = (0, external_cdp_target_store_js_namespaceObject.readSavedTargetId)();
            let matchedPage;
            if (savedTargetId && pages.length > 0) {
                matchedPage = pages.find((p)=>getTargetId(p) === savedTargetId);
                matchedPage ? debug('Matched saved targetId %s', savedTargetId) : debug('Saved targetId %s not found among %d pages, falling back', savedTargetId, pages.length);
            }
            page = matchedPage ? matchedPage : webPages.length > 0 ? webPages[webPages.length - 1] : pages.length > 0 ? pages[pages.length - 1] : await browser.newPage();
            await page.bringToFront();
        }
        const targetId = getTargetId(page);
        if (targetId) (0, external_cdp_target_store_js_namespaceObject.saveTargetId)(targetId);
        else debug('No targetId on page.target(); cross-command tab reuse disabled until puppeteer integration is updated.');
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
        if (this.activeBrowser) {
            this.activeBrowser.disconnect();
            this.activeBrowser = null;
        }
    }
    preparePlatformTools() {
        return [
            {
                name: 'web_connect',
                description: 'Connect to a web page via CDP. Opens a new tab with the given URL, or reuses the current page.',
                schema: this.getAgentInitArgSchema(),
                cli: this.getAgentInitArgCliMetadata(),
                handler: async (args)=>{
                    const initArgs = this.extractAgentInitParam(args);
                    const url = initArgs?.url;
                    if (this.agent) {
                        try {
                            await this.agent.destroy?.();
                        } catch (e) {
                            console.debug('Failed to destroy agent during connect:', e);
                        }
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
                                text: `Connected via CDP to: ${label}`
                            },
                            ...screenshot ? this.buildScreenshotContent(screenshot) : []
                        ]
                    };
                }
            },
            {
                name: 'web_disconnect',
                description: 'Disconnect from current web page. The browser stays running (managed externally).',
                schema: {},
                handler: async ()=>{
                    if (this.agent) {
                        try {
                            await this.agent.destroy?.();
                        } catch (e) {
                            console.debug('Failed to destroy agent during disconnect:', e);
                        }
                        this.agent = void 0;
                        this.lastInitArgsSignature = void 0;
                    }
                    if (this.activeBrowser) {
                        this.activeBrowser.disconnect();
                        this.activeBrowser = null;
                    }
                    (0, external_cdp_target_store_js_namespaceObject.cleanupTargetIdFile)();
                    return this.buildTextResult('Disconnected from web page (browser still running externally)');
                }
            }
        ];
    }
    constructor(cdpEndpoint){
        super(), _define_property(this, "cdpEndpoint", void 0), _define_property(this, "activeBrowser", null), _define_property(this, "lastInitArgsSignature", void 0), _define_property(this, "initArgSpec", {
            namespace: 'web',
            shape: external_agent_init_args_js_namespaceObject.webAgentInitArgShape,
            cli: {
                preferBareKeys: true
            },
            adapt: external_agent_init_args_js_namespaceObject.adaptWebAgentInitArgs
        });
        this.cdpEndpoint = cdpEndpoint;
    }
}
exports.WebCdpMidsceneTools = __webpack_exports__.WebCdpMidsceneTools;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "WebCdpMidsceneTools"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=agent-tools-cdp.js.map