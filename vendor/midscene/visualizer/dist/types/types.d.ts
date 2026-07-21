import type { ConnectivityTestResult, DeviceAction, ModelBrief, UIContext } from '@midscene/core';
import type { TModelConfig } from '@midscene/shared/env';
import type { ComponentType, ReactNode } from 'react';
export interface ZodType {
    _def?: {
        typeName: 'ZodOptional' | 'ZodDefault' | 'ZodNullable' | 'ZodObject' | 'ZodEnum' | 'ZodNumber' | 'ZodString' | 'ZodBoolean';
        innerType?: ZodType;
        defaultValue?: () => unknown;
        _serializedDefaultValue?: unknown;
        shape?: (() => Record<string, ZodType>) | Record<string, ZodType>;
        values?: string[];
        description?: string;
    };
    description?: string;
}
export interface ZodObjectSchema extends ZodType {
    shape: Record<string, ZodType>;
    parse: (data: unknown) => unknown;
}
export interface ZodEnumSchema extends ZodType {
    _def: {
        typeName: 'ZodEnum';
        values: string[];
    };
}
export interface ZodNumberSchema extends ZodType {
    _def: {
        typeName: 'ZodNumber';
    };
}
export interface ZodBooleanSchema extends ZodType {
    _def: {
        typeName: 'ZodBoolean';
    };
}
export interface ZodRuntimeAccess extends ZodType {
    shape?: Record<string, ZodType>;
    description?: string;
    typeName?: string;
    type?: string;
}
export interface ActionSpaceItem extends Omit<DeviceAction<any>, 'paramSchema'> {
    paramSchema?: ZodObjectSchema;
}
export interface FormParams {
    [key: string]: string | number | boolean | null | undefined;
}
export declare const VALIDATION_CONSTANTS: {
    readonly ZOD_TYPES: {
        readonly OPTIONAL: "ZodOptional";
        readonly DEFAULT: "ZodDefault";
        readonly NULLABLE: "ZodNullable";
        readonly OBJECT: "ZodObject";
        readonly ENUM: "ZodEnum";
        readonly NUMBER: "ZodNumber";
        readonly STRING: "ZodString";
        readonly BOOLEAN: "ZodBoolean";
    };
    readonly DEFAULT_VALUES: {
        readonly ACTION_TYPE: "aiAct";
        readonly TIMEOUT_MS: 15000;
        readonly CHECK_INTERVAL_MS: 3000;
    };
};
export declare const isZodObjectSchema: (schema: unknown) => schema is ZodObjectSchema;
export declare const isLocateField: (field: ZodType) => boolean;
export declare const unwrapZodType: (field: ZodType) => {
    actualField: ZodType;
    isOptional: boolean;
    hasDefault: boolean;
};
export declare const extractDefaultValue: (field: ZodType) => unknown;
import type { ExecutionDump, IExecutionDump, IReportActionDump } from '@midscene/core';
import type { BeforeActionHook, ExecutionOptions, PlaygroundAgent, PlaygroundReportRef, PlaygroundRuntimeInfo } from '@midscene/playground';
export interface PlaygroundResult {
    result: any;
    dump?: ExecutionDump | IExecutionDump | IReportActionDump | null;
    reportHTML?: string | null;
    report?: PlaygroundReportRef | null;
    error: string | null;
}
export interface PlaygroundProps {
    getAgent: (forceSameTabNavigation?: boolean) => PlaygroundAgent | null;
    hideLogo?: boolean;
    showContextPreview?: boolean;
    dryMode?: boolean;
}
export interface StaticPlaygroundProps {
    context: UIContext | null;
}
export type ServiceModeType = 'Server' | 'In-Browser' | 'In-Browser-Extension';
export type DeviceType = 'web' | 'android' | 'ios' | 'harmony' | 'computer';
export type ExecutionUxHint = 'countdown-before-run';
export type RunType = 'aiAct' | 'aiQuery' | 'aiAssert' | 'aiTap' | 'aiDoubleClick' | 'aiHover' | 'aiInput' | 'aiRightClick' | 'aiKeyboardPress' | 'aiScroll' | 'aiLocate' | 'aiBoolean' | 'aiNumber' | 'aiString' | 'aiAsk' | 'aiWaitFor';
export interface ReplayScriptsInfo {
    scripts: any[];
    width?: number;
    height?: number;
    sdkVersion?: string;
    modelBriefs: ModelBrief[];
}
export interface FormValue {
    type: string;
    prompt?: string;
    params?: Record<string, unknown>;
}
export interface ExecutionReportDisplay {
    type?: string;
    prompt?: string;
}
export interface ExternalRunRequest {
    id: string;
    value: FormValue;
    displayContent?: string;
    reportDisplay?: ExecutionReportDisplay;
}
export type { ExecutionOptions };
export type ProgressCallback = (step: string, status?: 'loading' | 'completed' | 'error') => void;
export interface PlaygroundSDKLike {
    executeAction(actionType: string, value: FormValue, options: ExecutionOptions): Promise<unknown>;
    getActionSpace(context?: any): Promise<DeviceAction<unknown>[]>;
    onProgressUpdate?: (callback: ProgressCallback) => void;
    onDumpUpdate?: (callback: (dump: string, executionDump?: ExecutionDump) => void) => void;
    cancelExecution?(requestId: string): Promise<{
        dump: ExecutionDump | IExecutionDump | IReportActionDump | null;
        reportHTML: string | null;
        report?: PlaygroundReportRef | null;
    } | null>;
    getCurrentExecutionData?(): Promise<{
        dump: ExecutionDump | IExecutionDump | IReportActionDump | null;
        reportHTML: string | null;
        report?: PlaygroundReportRef | null;
    }>;
    overrideConfig?(config: any): Promise<void>;
    runConnectivityTest?(config: TModelConfig): Promise<ConnectivityTestResult>;
    checkStatus?(): Promise<boolean>;
    getServiceMode?(): 'In-Browser-Extension' | 'Server';
    getRuntimeInfo?(): Promise<PlaygroundRuntimeInfo | null>;
    setBeforeActionHook?(hook?: BeforeActionHook): void;
    id?: string;
}
export interface ExecutionUxConfig {
    hints?: ExecutionUxHint[];
    countdownSeconds?: number;
}
export interface StorageProvider {
    saveMessages?(messages: InfoListItem[]): Promise<void>;
    loadMessages?(): Promise<InfoListItem[]>;
    clearMessages?(): Promise<void>;
    saveResult?(id: string, result: InfoListItem): Promise<void>;
}
export interface ContextProvider {
    getUIContext?(): Promise<UIContext>;
    refreshContext?(): Promise<UIContext>;
}
export interface InfoListItem {
    id: string;
    type: 'user' | 'system' | 'result' | 'progress';
    content: string;
    timestamp: Date;
    result?: PlaygroundResult | null;
    loading?: boolean;
    replayScriptsInfo?: ReplayScriptsInfo | null;
    replayCounter?: number;
    loadingProgressText?: string;
    verticalMode?: boolean;
    actionType?: string;
    /**
     * Identifier for the ExecutionTask that produced this progress item —
     * `task.subType || task.type`, e.g. `'Planning'`, `'Locate'`, `'Tap'`,
     * `'Input'`, `'Scroll'`, `'RunAdbShell'`. Hosts can use this with
     * {@link PromptInputChromeConfig.resolveProgressActionIcon} to render
     * a domain-specific icon in the progress pill.
     */
    actionKind?: string;
}
export interface ReportDownloadRequest {
    content: string;
    defaultFileName: string;
}
export type ReportDownloadHandler = (request: ReportDownloadRequest) => void | Promise<void>;
export interface PlaygroundExecutionStatus {
    running: boolean;
    stoppable: boolean;
    stop: () => void | Promise<void>;
}
export interface UniversalPlaygroundConfig {
    showContextPreview?: boolean;
    storageNamespace?: string;
    /**
     * Whether playground conversation/execution messages are persisted.
     * Defaults to `true`. Host shells can set this to `false` when each mounted
     * playground panel should start from a fresh conversation.
     */
    persistMessages?: boolean;
    layout?: 'vertical' | 'horizontal';
    showVersionInfo?: boolean;
    enableScrollToBottom?: boolean;
    serverMode?: boolean;
    showEnvConfigReminder?: boolean;
    /**
     * Whether automatic SDK config sync failures should show a toast.
     * Defaults to `true`. Embedded hosts that already handle config application
     * can set this to `false` to avoid duplicate background warnings.
     */
    suppressConfigErrorToast?: boolean;
    deviceType?: DeviceType;
    executionUx?: ExecutionUxConfig;
    promptInputChrome?: PromptInputChromeConfig;
    /**
     * Where the prompt composer is composed relative to the timeline. Hosts
     * with a dedicated prompt panel can render it before the execution area.
     */
    promptInputPlacement?: 'before-timeline' | 'after-timeline';
    /**
     * When true, render only the execution/conversation area and omit the
     * prompt composer. Hosts can use this for replay views that execute an
     * externally supplied request instead of accepting free-form input.
     */
    hidePromptInput?: boolean;
    externalRunRequest?: ExternalRunRequest | null;
    /**
     * Whether to clear all previous execution messages before starting a new
     * run. Defaults to `false` so conversation-style playgrounds retain their
     * existing history behaviour.
     */
    clearTimelineBeforeRun?: boolean;
    /**
     * Whether to render the "clear conversation" button that appears above the
     * message list once there is more than one item. Defaults to `true`.
     * Embedding hosts whose own shell exposes a clear affordance can set this
     * to `false`.
     */
    showClearButton?: boolean;
    /**
     * Whether each system message renders its header (branding icon + title).
     * Defaults to `true`. Compact embeddings may set this to `false` to let the
     * host shell own the branding.
     */
    showSystemMessageHeader?: boolean;
    /**
     * Optional host-provided content rendered when the conversation has no
     * user-visible chat messages yet. The internal welcome message stays in
     * state, but compact hosts can replace its default text block visually.
     */
    emptyState?: ReactNode;
    /**
     * Marks the current execution scope. When this value changes, any in-flight
     * execution is cancelled so work from a previous target does not keep
     * calling the backend after the host switches platform/device/session.
     */
    executionScopeKey?: string | null;
    /**
     * Called immediately before a new execution is started. Embedded hosts can
     * use this to stop an existing execution in a sibling playground instance
     * before the backend receives the new request.
     */
    onBeforeExecutionStart?: () => Promise<void> | void;
    onExecutionStatusChange?: (status: PlaygroundExecutionStatus) => void;
    /**
     * Optional host-provided header rendered above the execution message list.
     * Compact hosts can use this to align the execution timeline chrome with
     * surrounding panels without changing the execution flow itself.
     */
    timelineHeader?: ReactNode;
    /**
     * Optional host-provided wrapper around the execution message area.
     * This lets embedded hosts reuse their own timeline panel chrome while
     * keeping the playground execution flow unchanged.
     */
    timelineWrapper?: (content: ReactNode, state: {
        empty: boolean;
        headerAction?: ReactNode;
    }) => ReactNode;
    /**
     * Opt-in controls for how consecutive progress items render in the
     * conversation log. Defaults flatten every progress step inline (no
     * grouping, no connector) so existing hosts keep their behaviour.
     */
    executionFlow?: ExecutionFlowConfig;
    /**
     * Optional host-provided report download hook.
     * Defaults to the browser Blob download flow when omitted.
     */
    onDownloadReport?: ReportDownloadHandler;
}
export interface ExecutionFlowConfig {
    /**
     * When `true`, consecutive progress items are wrapped under a single
     * collapsible "Execution Flow" header. A "run" is bounded by the first
     * non-progress item before and after it.
     */
    collapsible?: boolean;
    /**
     * Label shown on the collapsible header. Defaults to `'Execution Flow'`.
     */
    label?: string;
    /**
     * Resolve a domain-specific icon for each progress step. Called with
     * `InfoListItem.actionKind` (e.g. `'Planning'`, `'Locate'`, `'Tap'`,
     * `'Input'`, `'RunAdbShell'`). Returning a React node renders it to
     * the left of the status glyph inside the pill; returning `undefined`
     * falls back to the default mapping shipped by the visualiser, and
     * returning `null` hides the icon slot entirely.
     */
    resolveActionIcon?: (kind: string) => ReactNode | null | undefined;
}
/**
 * Optional visual chrome overrides for the embedded prompt input.
 * - `default` renders the full-featured prompt input (type radio row,
 *   history button, full send/stop controls).
 * - `minimal` renders a compact toolbar with only inline params, an action
 *   dropdown, send/stop — intended for embedded hosts (e.g. Studio) whose
 *   outer shell already owns the type selection affordance.
 */
export interface PromptInputChromeConfig {
    variant?: 'default' | 'minimal';
    placeholder?: string;
    /**
     * Label shown on the primary action button. When provided, overrides the
     * auto-derived label (`actionNameForType(type)`). If omitted, the action
     * name derived from the current type is used, falling back to "Action".
     */
    primaryActionLabel?: string;
    icons?: {
        action?: string;
        actionChevron?: string;
        history?: string;
        settings?: string;
    };
    /**
     * Controls where the run configuration trigger is rendered.
     * Defaults to `toolbar` for the classic prompt chrome.
     */
    settingsPlacement?: 'toolbar' | 'input' | 'hidden';
    inputActions?: ReactNode;
}
export interface PlaygroundBranding {
    title?: string;
    icon?: ComponentType<any>;
    version?: string;
    targetName?: string;
}
export interface UniversalPlaygroundProps {
    playgroundSDK: PlaygroundSDKLike | null;
    storage?: StorageProvider;
    contextProvider?: ContextProvider;
    config?: UniversalPlaygroundConfig;
    branding?: PlaygroundBranding;
    className?: string;
    dryMode?: boolean;
    showContextPreview?: boolean;
}
