"use strict";
var __webpack_require__ = {};
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
    WebMidsceneTools: ()=>WebMidsceneTools
});
const core_namespaceObject = require("@midscene/core");
const agent_behavior_init_args_namespaceObject = require("@midscene/shared/agent-tools/agent-behavior-init-args");
const base_tools_namespaceObject = require("@midscene/shared/agent-tools/base-tools");
const external_agent_init_args_js_namespaceObject = require("./agent-init-args.js");
const index_js_namespaceObject = require("./bridge-mode/index.js");
const viewport_js_namespaceObject = require("./common/viewport.js");
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
class WebMidsceneTools extends base_tools_namespaceObject.BaseMidsceneTools {
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
        const nextSignature = (0, agent_behavior_init_args_namespaceObject.getAgentInitArgsSignature)(initArgs);
        const shouldOpenUrl = 'string' == typeof initArgs?.url;
        if (this.agent && (shouldOpenUrl || (0, agent_behavior_init_args_namespaceObject.shouldRebuildAgentForInitArgs)(this.lastInitArgsSignature, nextSignature))) {
            try {
                await this.agent?.destroy?.();
            } catch (error) {
                console.debug('Failed to destroy agent during re-init:', error);
            }
            this.agent = void 0;
        }
        if (this.agent) return this.agent;
        this.agent = await this.initBridgeModeAgent(initArgs);
        this.lastInitArgsSignature = nextSignature;
        return this.agent;
    }
    async initBridgeModeAgent(initArgs) {
        const url = initArgs?.url;
        const reportOptions = this.readCliReportAgentOptions();
        const agent = new index_js_namespaceObject.AgentOverChromeBridge({
            closeConflictServer: true,
            ...(0, agent_behavior_init_args_namespaceObject.extractAgentBehaviorInitArgs)(initArgs) ?? {},
            ...reportOptions ?? {}
        });
        if (url) await agent.connectNewTabWithUrl(url);
        else await agent.connectCurrentTab();
        return agent;
    }
    preparePlatformTools() {
        return [
            {
                name: 'web_connect',
                description: 'Connect to web page. If URL provided, opens new tab; otherwise connects to current tab.',
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
                    const reportSession = this.createNewCliReportSession(url ?? 'current-tab');
                    this.commitCliReportSession(reportSession);
                    this.agent = await this.ensureAgent(initArgs);
                    const screenshot = await this.agent.page?.screenshotBase64();
                    const label = url ?? 'current tab';
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
                description: 'Disconnect from current web page and release browser resources',
                schema: {},
                handler: async ()=>{
                    if (!this.agent) return this.buildTextResult('No active connection to disconnect');
                    try {
                        await this.agent.destroy?.();
                    } catch  {}
                    this.agent = void 0;
                    this.lastInitArgsSignature = void 0;
                    return this.buildTextResult('Disconnected from web page');
                }
            }
        ];
    }
    constructor(...args){
        super(...args), _define_property(this, "lastInitArgsSignature", void 0), _define_property(this, "initArgSpec", {
            namespace: 'web',
            shape: external_agent_init_args_js_namespaceObject.webAgentInitArgShape,
            cli: {
                preferBareKeys: true
            },
            adapt: external_agent_init_args_js_namespaceObject.adaptWebAgentInitArgs
        });
    }
}
exports.WebMidsceneTools = __webpack_exports__.WebMidsceneTools;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "WebMidsceneTools"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=agent-tools.js.map