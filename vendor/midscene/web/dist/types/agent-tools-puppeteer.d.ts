import { BaseMidsceneTools, type InitArgSpec } from '@midscene/shared/agent-tools/base-tools';
import type { ToolDefinition } from '@midscene/shared/agent-tools/types';
import { type WebAgentInitArgs } from './agent-init-args';
import { type ViewportSize } from './common/viewport';
import { PuppeteerAgent } from './puppeteer';
import { StaticPage } from './static';
export declare const PUPPETEER_ENDPOINT_FILE: string;
export interface PuppeteerPersistenceOptions {
    endpointFile?: string;
    userDataDir?: string;
}
export interface WebPuppeteerMidsceneToolsOptions {
    persistence?: PuppeteerPersistenceOptions;
}
export declare function buildDetachedChromeArgs(options: {
    userDataDir: string;
    viewport?: ViewportSize;
}): string[];
/**
 * Tools manager for Web Puppeteer mode.
 * Uses a persistent headless Chrome browser that survives across CLI calls.
 */
export declare class WebPuppeteerMidsceneTools extends BaseMidsceneTools<PuppeteerAgent, WebAgentInitArgs> {
    private readonly viewport?;
    private readonly browserManager;
    private lastInitArgsSignature?;
    constructor(viewport?: ViewportSize, options?: WebPuppeteerMidsceneToolsOptions);
    protected getCliReportSessionName(): string;
    protected readonly initArgSpec: InitArgSpec<WebAgentInitArgs>;
    protected createTemporaryDevice(): StaticPage;
    protected ensureAgent(initArgs?: WebAgentInitArgs): Promise<PuppeteerAgent>;
    destroy(): Promise<void>;
    protected preparePlatformTools(): ToolDefinition[];
}
