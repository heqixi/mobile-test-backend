import type { z } from 'zod';
import { type CliReportSession } from './cli-report-session';
import { type ToolDefaults } from './tool-defaults';
import type { BaseAgent, BaseDevice, IMidsceneTools, ToolCliMetadata, ToolDefinition, ToolSchema } from './types';
/**
 * Declarative description of a platform's agent init args.
 * Collapses the `extractAgentInitParam` / `sanitizeToolArgs` /
 * `getAgentInitArgSchema` trio into a single data declaration.
 */
export interface InitArgSpec<TInitParam> {
    /** Arg namespace, e.g. `android`, `ios`. */
    namespace: string;
    /** Zod shape describing the init args. Field names drive the tool schema. */
    shape: Record<string, z.ZodTypeAny>;
    /**
     * Optional CLI presentation hints. These affect `--help` output for
     * single-platform CLIs but do not alter YAML protocol keys.
     */
    cli?: {
        /** Prefer bare `--device-id`-style options in platform CLI help output. */
        preferBareKeys?: boolean;
        /** Override the displayed option name for specific init arg fields. */
        preferredNames?: Record<string, string>;
    };
    /**
     * Adapt extracted namespaced args into the concrete `TInitParam` passed to
     * `ensureAgent`. Defaults to returning the raw extracted record.
     */
    adapt?: (extracted: Record<string, unknown> | undefined) => TInitParam | undefined;
}
/**
 * Base class for platform-specific Midscene tools.
 * @typeParam TAgent - Platform-specific agent type.
 * @typeParam TInitParam - Platform-specific init parameter consumed by
 *   `ensureAgent`. Defaults to `undefined` for platforms that take no args.
 */
export declare abstract class BaseMidsceneTools<TAgent extends BaseAgent = BaseAgent, TInitParam = unknown> implements IMidsceneTools {
    protected agent?: TAgent;
    protected toolDefinitions: ToolDefinition[];
    /**
     * Default options injected into every generated tool call (e.g. forced deep
     * locate / deep think). Set from startup/CLI behavior flags before
     * `initTools()` so they are baked into the generated tool handlers.
     * See https://github.com/web-infra-dev/midscene/issues/2446.
     */
    protected toolDefaults: ToolDefaults;
    /**
     * Declarative init-arg spec. Subclasses that accept CLI init args should
     * set this once and get `extractAgentInitParam` / `sanitizeToolArgs` /
     * `getAgentInitArgSchema` auto-implemented.
     *
     * Declared with `declare` so that TS doesn't emit an `Object.defineProperty`
     * for this field on the base constructor, which would otherwise overwrite
     * a subclass field initializer under `useDefineForClassFields`.
     */
    protected readonly initArgSpec?: InitArgSpec<TInitParam>;
    /**
     * Ensure agent is initialized and ready for use.
     * Must be implemented by subclasses to create platform-specific agent.
     * @param initParam Optional initialization parameter (platform-specific, e.g., URL, device ID)
     * @returns Promise resolving to initialized agent instance
     * @throws Error if agent initialization fails
     */
    protected abstract ensureAgent(initParam?: TInitParam): Promise<TAgent>;
    private getInitArgKeys;
    /**
     * Extract a platform-specific agent init parameter from CLI tool args.
     */
    protected extractAgentInitParam(args: Record<string, unknown>): TInitParam | undefined;
    /**
     * Remove platform-specific init args before dispatching a tool payload to the action itself.
     */
    protected sanitizeToolArgs(args: Record<string, unknown>): Record<string, unknown>;
    /**
     * Expose platform-specific init args on action/common tool schemas.
     */
    protected getAgentInitArgSchema(): ToolSchema;
    /**
     * Expose CLI-only metadata for platform init args so single-platform help can
     * show ergonomic bare flags while the underlying schema stays namespaced.
     * When `preferBareKeys` is enabled, single-platform CLIs only accept the
     * bare spellings; namespaced dotted spellings remain available through the
     * YAML schema instead of the platform CLI surface.
     */
    protected getAgentInitArgCliMetadata(): ToolCliMetadata | undefined;
    /**
     * Optional: prepare platform-specific tools (e.g., device connection)
     */
    protected preparePlatformTools(): ToolDefinition[];
    protected getCliReportSessionName(): string | undefined;
    protected createNewCliReportSession(targetIdentity?: string): CliReportSession | undefined;
    protected commitCliReportSession(session?: CliReportSession): void;
    protected readCliReportFileName(): string | undefined;
    protected readCliReportAgentOptions(): {
        reportFileName: string;
        reportAttributes: Record<string, string>;
    } | undefined;
    /**
     * Must be implemented by subclasses to create a temporary device instance
     * This allows getting real actionSpace without connecting to device
     */
    protected abstract createTemporaryDevice(): BaseDevice;
    /**
     * Initialize all tools by querying actionSpace
     * Uses two-layer fallback strategy:
     * 1. Try to get actionSpace from connected agent (if available)
     * 2. Create temporary device instance to read actionSpace (always succeeds)
     */
    initTools(): Promise<void>;
    /**
     * Cleanup method - destroy agent and release resources
     */
    destroy(): Promise<void>;
    /**
     * Get tool definitions
     */
    getToolDefinitions(): ToolDefinition[];
    /**
     * Set agent for the tools manager
     */
    setAgent(agent: TAgent): void;
    /**
     * Set the default options injected into generated tool calls. Must be called
     * before `initTools()` because the values are captured into the generated
     * tool handlers. Merges with any previously set defaults.
     */
    setToolDefaults(toolDefaults: ToolDefaults): void;
    /**
     * Helper: Convert base64 screenshot to image content array
     */
    protected buildScreenshotContent(screenshot: string): {
        type: "image";
        data: string;
        mimeType: string;
    }[];
    /**
     * Helper: Build a simple text result for tool responses
     */
    protected buildTextResult(text: string): {
        content: {
            type: "text";
            text: string;
        }[];
    };
    /**
     * Create a disconnect handler for releasing platform resources
     * @param platformName Human-readable platform name for the response message
     * @returns Handler function that destroys the agent and returns appropriate response
     */
    protected createDisconnectHandler(platformName: string): () => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
