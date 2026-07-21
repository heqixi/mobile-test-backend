import type { TUserPrompt } from '../ai-model/index';
import Service from '../service/index';
import { type ActionParam, type ActionReturn, type AgentAssertOpt, type AgentOpt, type AgentProgressListener, type AgentWaitForOpt, type DeepThinkOption, type DeviceAction, ExecutionDump, type LocateOption, type LocateResultElement, type OnTaskStartTip, type RecordToReportOptions, ReportActionDump, type ScrollParam, type ServiceAction, type ServiceExtractOption, type ServiceExtractParam, type UIContext } from '../types';
import type { AbstractInterface } from '../device';
import type { TaskRunner } from '../task-runner';
import { ModelConfigManager } from '@midscene/shared/env';
import { type MidsceneUsageMetrics } from './metrics';
import { type RunGherkinScenarioOptions } from './run-gherkin-scenario';
import { TaskCache } from './task-cache';
import { TaskExecutor } from './tasks';
import { UIObserver, type UIObserverOption } from './ui-observer';
export type AiActOptions = {
    cacheable?: boolean;
    fileChooserAccept?: string | string[];
    deepThink?: DeepThinkOption;
    deepLocate?: boolean;
    abortSignal?: AbortSignal;
    context?: string;
    /**
     * Cap how many planned device actions (Tap/Input/Scroll/…) this `aiAct` may
     * execute. Planning / locate may still run as usual; once the budget is
     * spent, Midscene stops without further replanning.
     * Omit (or leave undefined) for unlimited actions (default).
     */
    maxActions?: number;
};
/**
 * Shared input option type for aiInput(), used consistently across
 * overload signatures and the implementation so fields don't drift.
 */
type AgentInputOption = LocateOption & {
    autoDismissKeyboard?: boolean;
    keyboardTypeDelay?: number;
    mode?: 'replace' | 'clear' | 'typeOnly' | 'append';
};
export declare class Agent<InterfaceType extends AbstractInterface = AbstractInterface> {
    interface: InterfaceType;
    service: Service;
    dump: ReportActionDump;
    reportFile?: string | null;
    reportFileName?: string;
    taskExecutor: TaskExecutor;
    opts: AgentOpt;
    /**
     * If true, the agent will not perform any actions
     */
    dryMode: boolean;
    onTaskStartTip?: OnTaskStartTip;
    taskCache?: TaskCache;
    private readonly metricsCollector;
    private usageCallCounter;
    private readonly countedUsageKeys;
    private dumpUpdateListeners;
    private readonly progressBus;
    get onDumpUpdate(): ((dump: string, executionDump?: ExecutionDump) => void) | undefined;
    set onDumpUpdate(callback: ((dump: string, executionDump?: ExecutionDump) => void) | undefined);
    destroyed: boolean;
    modelConfigManager: ModelConfigManager;
    /**
     * Frozen page context for consistent AI operations
     */
    private frozenUIContext?;
    /**
     * Currently active UIObserver (from startObserving). Only one observer may
     * be active at a time since frame sources are device-level singletons.
     */
    private activeObserver;
    private get aiActContext();
    private executionDumpIndexByRunner;
    private fullActionSpace;
    private reportGenerator;
    get page(): InterfaceType;
    /**
     * Fails fast for non-web interfaces when the model family is missing.
     *
     * Early Midscene web usage allowed running without `modelFamily` and falling
     * back to a default bbox parser. Non-web users do not have that compatibility
     * path, so this check helps surface configuration problems before spending a
     * model call.
     *
     * Web flows validate missing locate model family at workflow boundaries:
     * `Service.locate` throws when aiTap/aiType fallback to the default model for
     * direct locate, and generic planning throws when aiAct asks a planning model
     * to return inline locate coordinates. Those checks are intentionally placed
     * where Midscene knows which model role should provide coordinate parsing.
     */
    private assertModelFamilyForNonWebContext;
    private resolveReplanningCycleLimit;
    private resolveModelRuntime;
    constructor(interfaceInstance: InterfaceType, opts?: AgentOpt);
    getActionSpace(): Promise<DeviceAction[]>;
    private static readonly CONTEXT_RETRY_MAX;
    private static readonly CONTEXT_RETRY_DELAY_MS;
    /**
     * Override in subclasses to indicate which errors are transient and should
     * trigger an automatic retry when building the UI context.
     * Returns `false` by default (no retry).
     */
    protected isRetryableContextError(_error: unknown): boolean;
    getUIContext(action?: ServiceAction): Promise<UIContext>;
    _snapshotContext(): Promise<UIContext>;
    /**
     * Start observing the screen in the background so a later assertion can
     * judge everything that happened while other agent calls ran — including
     * transient UI (toasts, banners, transitions) that appears mid-action:
     *
     * ```ts
     * const observer = await agent.startObserving();
     * await agent.aiAct('submit the form');
     * await observer.stop();
     * await observer.aiAssert('a success toast appeared during the process');
     * ```
     *
     * Frames come from the device's continuous frame source when available
     * (scrcpy on Android, WDA MJPEG on iOS — both opt-in; CDP screencast on
     * web) and fall back to plain screenshots otherwise. Sampling is capped at
     * 5fps, the buffer is bounded and self-thinning, decoding is deferred to
     * the end, and all buffered frames (up to `maxFrames`) are sent to
     * the model at assert time. To control token cost for long windows,
     * increase `intervalMs` or decrease `maxFrames`.
     * Awaiting `startObserving()` guarantees one baseline frame is captured
     * before your next action.
     */
    startObserving(opt?: UIObserverOption): Promise<UIObserver>;
    /**
     * @deprecated Use {@link setAIActContext} instead.
     */
    setAIActionContext(prompt: string): Promise<void>;
    setAIActContext(prompt: string): Promise<void>;
    resetDump(): ReportActionDump;
    appendExecutionDump(execution: ExecutionDump, runner?: TaskRunner): void;
    /**
     * Fold any not-yet-counted task usage from an execution dump into the
     * instance metrics. Snapshots are re-emitted as tasks progress, so each
     * usage value is keyed by `${taskId}:${field}` and counted at most once.
     */
    private collectUsageMetrics;
    private consumeUsage;
    /**
     * Aggregated LLM usage accumulated by this agent since it was created.
     */
    get metrics(): MidsceneUsageMetrics;
    dumpDataString(opt?: {
        inlineScreenshots?: boolean;
    }): string;
    reportHTMLString(opt?: {
        inlineScreenshots?: boolean;
    }): string;
    private lastExecutionDump?;
    writeOutActionDumps(executionDump?: ExecutionDump): void;
    private getReportMeta;
    private callbackOnTaskStartTip;
    wrapActionInActionSpace<T extends DeviceAction>(name: string): (param: ActionParam<T>) => Promise<ActionReturn<T>>;
    callActionInActionSpace<T = any>(type: string, opt?: T): Promise<any>;
    aiTap(locatePrompt: TUserPrompt, opt?: LocateOption & {
        fileChooserAccept?: string | string[];
    }): Promise<void>;
    aiRightClick(locatePrompt: TUserPrompt, opt?: LocateOption): Promise<void>;
    aiDoubleClick(locatePrompt: TUserPrompt, opt?: LocateOption): Promise<void>;
    aiHover(locatePrompt: TUserPrompt, opt?: LocateOption): Promise<void>;
    aiInput(locatePrompt: TUserPrompt, opt: AgentInputOption & {
        value: string | number;
    }): Promise<void>;
    /**
     * @deprecated Use aiInput(locatePrompt, opt) instead where opt contains the value
     */
    aiInput(value: string | number, locatePrompt: TUserPrompt, opt?: AgentInputOption): Promise<void>;
    aiKeyboardPress(locatePrompt: TUserPrompt, opt: LocateOption & {
        keyName: string;
    }): Promise<void>;
    /**
     * @deprecated Use aiKeyboardPress(locatePrompt, opt) instead where opt contains the keyName
     */
    aiKeyboardPress(keyName: string, locatePrompt?: TUserPrompt, opt?: LocateOption): Promise<void>;
    aiScroll(locatePrompt: TUserPrompt | undefined, opt: LocateOption & ScrollParam): Promise<void>;
    /**
     * @deprecated Use aiScroll(locatePrompt, opt) instead where opt contains the scroll parameters
     */
    aiScroll(scrollParam: ScrollParam, locatePrompt?: TUserPrompt, opt?: LocateOption): Promise<void>;
    aiPinch(locatePrompt: TUserPrompt | undefined, opt: LocateOption & {
        direction: 'in' | 'out';
        distance?: number;
        duration?: number;
    }): Promise<void>;
    aiLongPress(locatePrompt: TUserPrompt, opt?: LocateOption & {
        duration?: number;
    }): Promise<void>;
    aiClearInput(locatePrompt: TUserPrompt, opt?: LocateOption): Promise<void>;
    aiAct(taskPrompt: TUserPrompt, opt?: AiActOptions): Promise<string | undefined>;
    runMarkdown(markdownPath: string, opt?: AiActOptions): Promise<string | undefined>;
    runGherkinScenario(scenarioText: string, opt?: RunGherkinScenarioOptions): Promise<void>;
    /**
     * @deprecated Use {@link Agent.aiAct} instead.
     */
    aiAction(taskPrompt: TUserPrompt, opt?: AiActOptions): Promise<string | undefined>;
    aiQuery<ReturnType = any>(demand: ServiceExtractParam, opt?: ServiceExtractOption): Promise<ReturnType>;
    aiBoolean(prompt: TUserPrompt, opt?: ServiceExtractOption): Promise<boolean>;
    private aiBooleanWithContext;
    aiNumber(prompt: TUserPrompt, opt?: ServiceExtractOption): Promise<number>;
    aiString(prompt: TUserPrompt, opt?: ServiceExtractOption): Promise<string>;
    aiAsk(prompt: TUserPrompt, opt?: ServiceExtractOption): Promise<string>;
    /**
     * Locate an element and return both its center point and an approximate rect.
     *
     * - In most locate flows, `rect` represents the matched element boundary.
     * - Some models only support point grounding instead of boundary grounding.
     *   In those cases (for example, AutoGLM), `rect` falls back to a small 8x8
     *   box centered on the located point.
     *
     * Because `rect` may vary with the underlying model capability, avoid relying
     * on it too heavily for strict boundary semantics. If you need a stable click
     * target, prefer `center`.
     */
    aiLocate(prompt: TUserPrompt, opt?: LocateOption): Promise<Pick<LocateResultElement, "rect" | "center">>;
    aiAssert(assertion: TUserPrompt, msg?: string, opt?: AgentAssertOpt & ServiceExtractOption): Promise<{
        pass: boolean;
        thought: string | undefined;
        message: string | undefined;
    } | undefined>;
    private aiAssertWithContext;
    aiWaitFor(assertion: TUserPrompt, opt?: AgentWaitForOpt): Promise<void>;
    ai(...args: Parameters<typeof this.aiAct>): Promise<string | undefined>;
    runYaml(yamlScriptContent: string): Promise<{
        result: Record<string, any>;
    }>;
    evaluateJavaScript(script: string): Promise<any>;
    /**
     * Add a dump update listener
     * @param listener Listener function
     * @returns A remove function that can be called to remove this listener
     */
    addDumpUpdateListener(listener: (dump: string, executionDump?: ExecutionDump) => void): () => void;
    /**
     * Remove a dump update listener
     * @param listener The listener function to remove
     */
    removeDumpUpdateListener(listener: (dump: string, executionDump?: ExecutionDump) => void): void;
    /**
     * Clear all dump update listeners
     */
    clearDumpUpdateListeners(): void;
    /**
     * Subscribe to the generic agent progress bus. The listener receives every
     * progress event regardless of producer; narrow by `event.scope` to handle a
     * specific producer (e.g. `'aiAct'`).
     * @param listener Listener function
     * @returns A remove function that can be called to remove this listener
     */
    addProgressListener(listener: AgentProgressListener): () => void;
    /**
     * Remove a progress listener added via {@link addProgressListener}.
     */
    removeProgressListener(listener: AgentProgressListener): void;
    /**
     * Clear all generic progress listeners.
     */
    clearProgressListeners(): void;
    private notifyDumpUpdateListeners;
    destroy(): Promise<void>;
    recordToReport(title?: string, opt?: RecordToReportOptions): Promise<void>;
    recordErrorToReport(title: string, opt: {
        error: Error;
        content?: string;
        screenshotBase64?: string;
    }): Promise<void>;
    /**
     * @deprecated Use {@link Agent.recordToReport} instead.
     */
    logScreenshot(title?: string, opt?: {
        content: string;
    }): Promise<void>;
    _unstableLogContent(): {
        groupName: string;
        groupDescription: string | undefined;
        executions: ExecutionDump[];
    };
    /**
     * Freezes the current page context to be reused in subsequent AI operations
     * This avoids recalculating page context for each operation
     */
    freezePageContext(): Promise<void>;
    /**
     * Unfreezes the page context, allowing AI operations to calculate context dynamically
     */
    unfreezePageContext(): Promise<void>;
    /**
     * Process cache configuration and return normalized cache settings
     */
    private processCacheConfig;
    private normalizeFileInput;
    /**
     * Manually flush cache to file
     * @param options - Optional configuration
     * @param options.cleanUnused - If true, removes unused cache records before flushing
     */
    flushCache(options?: {
        cleanUnused?: boolean;
    }): Promise<void>;
}
export declare const createAgent: (interfaceInstance: AbstractInterface, opts?: AgentOpt) => Agent<AbstractInterface>;
export {};
