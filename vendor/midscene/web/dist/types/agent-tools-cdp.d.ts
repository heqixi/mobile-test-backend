import { BaseMidsceneTools, type InitArgSpec } from '@midscene/shared/agent-tools/base-tools';
import type { ToolDefinition } from '@midscene/shared/agent-tools/types';
import { type WebAgentInitArgs } from './agent-init-args';
import { PuppeteerAgent } from './puppeteer';
import { StaticPage } from './static';
/**
 * Tools manager for Web CDP mode.
 * Connects to an existing Chrome browser via CDP (Chrome DevTools Protocol) endpoint.
 * Unlike WebPuppeteerMidsceneTools which launches its own Chrome, this connects
 * to a browser that is already running with remote debugging enabled.
 *
 * Uses a persistent WebSocket proxy to avoid repeated Chrome permission popups
 * when Chrome's settings-based remote debugging is used.
 */
export declare class WebCdpMidsceneTools extends BaseMidsceneTools<PuppeteerAgent, WebAgentInitArgs> {
    protected getCliReportSessionName(): string;
    private cdpEndpoint;
    private activeBrowser;
    private lastInitArgsSignature?;
    constructor(cdpEndpoint: string);
    protected readonly initArgSpec: InitArgSpec<WebAgentInitArgs>;
    protected createTemporaryDevice(): StaticPage;
    protected ensureAgent(initArgs?: WebAgentInitArgs): Promise<PuppeteerAgent>;
    destroy(): Promise<void>;
    protected preparePlatformTools(): ToolDefinition[];
}
