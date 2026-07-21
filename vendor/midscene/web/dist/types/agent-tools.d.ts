import { BaseMidsceneTools, type InitArgSpec } from '@midscene/shared/agent-tools/base-tools';
import type { ToolDefinition } from '@midscene/shared/agent-tools/types';
import { type WebAgentInitArgs } from './agent-init-args';
import { AgentOverChromeBridge } from './bridge-mode';
import { StaticPage } from './static';
/**
 * Tools manager for Web bridge mode.
 */
export declare class WebMidsceneTools extends BaseMidsceneTools<AgentOverChromeBridge, WebAgentInitArgs> {
    private lastInitArgsSignature?;
    protected getCliReportSessionName(): string;
    protected readonly initArgSpec: InitArgSpec<WebAgentInitArgs>;
    protected createTemporaryDevice(): StaticPage;
    protected ensureAgent(initArgs?: WebAgentInitArgs): Promise<AgentOverChromeBridge>;
    private initBridgeModeAgent;
    protected preparePlatformTools(): ToolDefinition[];
}
