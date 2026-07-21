import { ScreenshotItem } from "@midscene/core";
import { extractAgentBehaviorInitArgs, getAgentInitArgsSignature, shouldRebuildAgentForInitArgs } from "@midscene/shared/agent-tools/agent-behavior-init-args";
import { BaseMidsceneTools } from "@midscene/shared/agent-tools/base-tools";
import { adaptWebAgentInitArgs, webAgentInitArgShape } from "./agent-init-args.mjs";
import { AgentOverChromeBridge } from "./bridge-mode/index.mjs";
import { defaultStaticPageViewportSize } from "./common/viewport.mjs";
import { StaticPage } from "./static/index.mjs";
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
class WebMidsceneTools extends BaseMidsceneTools {
    getCliReportSessionName() {
        return 'midscene-web';
    }
    createTemporaryDevice() {
        return new StaticPage({
            screenshot: ScreenshotItem.create('', Date.now()),
            shotSize: defaultStaticPageViewportSize,
            shrunkShotToLogicalRatio: 1
        });
    }
    async ensureAgent(initArgs) {
        const nextSignature = getAgentInitArgsSignature(initArgs);
        const shouldOpenUrl = 'string' == typeof initArgs?.url;
        if (this.agent && (shouldOpenUrl || shouldRebuildAgentForInitArgs(this.lastInitArgsSignature, nextSignature))) {
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
        const agent = new AgentOverChromeBridge({
            closeConflictServer: true,
            ...extractAgentBehaviorInitArgs(initArgs) ?? {},
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
            shape: webAgentInitArgShape,
            cli: {
                preferBareKeys: true
            },
            adapt: adaptWebAgentInitArgs
        });
    }
}
export { WebMidsceneTools };

//# sourceMappingURL=agent-tools.mjs.map