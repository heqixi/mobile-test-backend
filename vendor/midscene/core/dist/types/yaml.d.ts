import type { TMultimodalPrompt, TUserPrompt } from './common';
import type { AndroidDeviceOpt, HarmonyDeviceOpt, IOSDeviceOpt } from './device';
import type { AgentOpt, LocateResultElement } from './types';
import type { UIContext } from './types';
export interface LocateOption extends Partial<TMultimodalPrompt> {
    prompt?: TUserPrompt;
    deepLocate?: boolean;
    /** @deprecated Use `deepLocate` instead. Kept for backward compatibility. */
    deepThink?: boolean;
    cacheable?: boolean;
    xpath?: string;
    uiContext?: UIContext;
    fileChooserAccept?: string | string[];
}
export interface ServiceExtractOption {
    domIncluded?: boolean | 'visible-only';
    screenshotIncluded?: boolean;
    [key: string]: unknown;
}
export interface DetailedLocateParam extends Omit<LocateOption, 'deepThink' | keyof TMultimodalPrompt> {
    prompt: TUserPrompt;
}
export type ScrollType = 'singleAction' | 'scrollToBottom' | 'scrollToTop' | 'scrollToRight' | 'scrollToLeft' | 'once' | 'untilBottom' | 'untilTop' | 'untilRight' | 'untilLeft';
export type ActionScrollParam = {
    direction?: 'down' | 'up' | 'right' | 'left';
    scrollType?: ScrollType;
    distance?: number | null;
    locate?: LocateResultElement;
};
export type ScrollParam = Omit<ActionScrollParam, 'locate'>;
export interface MidsceneYamlScript {
    target?: MidsceneYamlScriptWebEnv;
    page?: MidsceneYamlScriptWebEnv;
    browser?: MidsceneYamlScriptWebEnv;
    web?: MidsceneYamlScriptWebEnv;
    android?: MidsceneYamlScriptAndroidEnv;
    ios?: MidsceneYamlScriptIOSEnv;
    harmony?: MidsceneYamlScriptHarmonyEnv;
    computer?: MidsceneYamlScriptComputerEnv;
    interface?: MidsceneYamlScriptEnvGeneralInterface;
    config?: MidsceneYamlScriptConfig;
    agent?: MidsceneYamlScriptAgentOpt;
    tasks: MidsceneYamlTask[];
}
export interface MidsceneYamlTask {
    name: string;
    flow: MidsceneYamlFlowItem[];
    continueOnError?: boolean;
}
/**
 * Agent configuration options that can be specified in YAML scripts.
 *
 * This type includes serializable fields from AgentOpt, excluding non-serializable
 * fields like functions and complex objects. All fields are optional.
 *
 * @remarks
 * - testId is deprecated; prefer reportFileName and cache.id
 * - These settings apply to all platforms (Web, Android, iOS, Generic Interface)
 * - modelConfig is configured through environment variables, not in YAML
 *
 * @example
 * ```yaml
 * agent:
 *   reportFileName: "checkout-report"
 *   groupName: "E2E Test Suite"
 *   generateReport: true
 *   replanningCycleLimit: 30
 *   cache:
 *     id: "checkout-cache"
 *     strategy: "read-write"
 * ```
 */
export type MidsceneYamlScriptAgentOpt = Pick<AgentOpt, 'testId' | 'groupName' | 'groupDescription' | 'generateReport' | 'persistExecutionDump' | 'autoPrintReportMsg' | 'reportFileName' | 'replanningCycleLimit' | 'aiActContext' | 'aiActionContext' | 'cache' | 'screenshotShrinkFactor'>;
export interface MidsceneYamlScriptConfig {
    output?: string;
    unstableLogContent?: boolean | string;
}
export interface MidsceneYamlScriptEnvGeneralInterface {
    module: string;
    export?: string;
    param?: Record<string, any>;
}
export interface MidsceneYamlScriptWebEnv extends MidsceneYamlScriptConfig, MidsceneYamlScriptAgentOpt {
    mode?: 'page' | 'browser';
    serve?: string;
    url: string;
    userAgent?: string;
    acceptInsecureCerts?: boolean;
    viewportWidth?: number;
    viewportHeight?: number;
    deviceScaleFactor?: number;
    waitForNetworkIdle?: {
        timeout?: number;
        continueOnNetworkIdleError?: boolean;
    };
    cookie?: string;
    /**
     * Extra HTTP headers sent with every request (Puppeteer only, not supported
     * in bridge mode). Useful when the server validates custom request headers.
     *
     * Header values must be strings. Quote values that YAML would otherwise parse
     * as a boolean or number (e.g. `true`, `false`, `123`), such as `"true"`.
     *
     * @example
     * ```yaml
     * web:
     *   url: https://example.com
     *   extraHTTPHeaders:
     *     X-Custom-Token: my-token
     *     Accept-Language: en-US
     * ```
     */
    extraHTTPHeaders?: Record<string, string>;
    forceSameTabNavigation?: boolean;
    autoFollowNewPage?: boolean;
    /**
     * Chrome download directory (Puppeteer only, not supported in bridge mode).
     *
     * Relative paths are resolved from the current working directory.
     *
     * @example
     * ```yaml
     * web:
     *   url: https://example.com
     *   downloadPath: ./downloads
     * ```
     */
    downloadPath?: string;
    /**
     * Custom Chrome launch arguments (Puppeteer only, not supported in bridge mode).
     *
     * Allows passing custom command-line arguments to Chrome/Chromium when launching the browser.
     * This is useful for testing scenarios that require specific browser configurations.
     *
     * ⚠️ Security Warning: Some arguments (e.g., --no-sandbox, --disable-web-security) may
     * reduce browser security. Use only in controlled testing environments.
     *
     * @example
     * ```yaml
     * web:
     *   url: https://example.com
     *   chromeArgs:
     *     - '--disable-features=ThirdPartyCookiePhaseout'
     *     - '--disable-features=SameSiteByDefaultCookies'
     *     - '--window-size=1920,1080'
     * ```
     */
    chromeArgs?: string[];
    bridgeMode?: false | 'newTabWithUrl' | 'currentTab';
    closeNewTabsAfterDisconnect?: boolean;
    /**
     * CDP (Chrome DevTools Protocol) endpoint URL.
     * When specified, connects to an existing Chrome browser via CDP instead of launching a new one.
     *
     * @example
     * ```yaml
     * web:
     *   url: https://example.com
     *   cdpEndpoint: ws://localhost:9222/devtools/browser/xxxx
     * ```
     */
    cdpEndpoint?: string;
}
export interface MidsceneYamlScriptAndroidEnv extends MidsceneYamlScriptConfig, Omit<AndroidDeviceOpt, 'customActions'> {
    deviceId?: string;
    launch?: string;
}
export interface MidsceneYamlScriptIOSEnv extends MidsceneYamlScriptConfig, Omit<IOSDeviceOpt, 'customActions'> {
    launch?: string;
}
export interface MidsceneYamlScriptHarmonyEnv extends MidsceneYamlScriptConfig, Omit<HarmonyDeviceOpt, 'customActions'> {
    deviceId?: string;
    launch?: string;
    appNameMapping?: Record<string, string>;
}
export interface MidsceneYamlScriptComputerEnv extends MidsceneYamlScriptConfig {
    displayId?: string;
}
export type MidsceneYamlScriptEnv = MidsceneYamlScriptWebEnv | MidsceneYamlScriptAndroidEnv | MidsceneYamlScriptIOSEnv | MidsceneYamlScriptHarmonyEnv | MidsceneYamlScriptComputerEnv;
export interface MidsceneYamlFlowItemAIAction {
    aiAction?: TUserPrompt | null;
    ai?: TUserPrompt | null;
    aiAct?: TUserPrompt | null;
    instruction?: TUserPrompt;
    aiActionProgressTips?: string[];
    cacheable?: boolean;
    [key: string]: unknown;
}
export interface MidsceneYamlFlowItemAIAssert extends ServiceExtractOption {
    aiAssert: string;
    errorMessage?: string;
    name?: string;
}
export interface MidsceneYamlFlowItemAIWaitFor extends ServiceExtractOption {
    aiWaitFor: string;
    timeout?: number;
}
export interface MidsceneYamlFlowItemRunGherkinScenario {
    runGherkinScenario: string;
}
export interface MidsceneYamlFlowItemEvaluateJavaScript {
    javascript: string;
    name?: string;
}
export interface MidsceneYamlFlowItemSleep {
    sleep: number;
}
export interface MidsceneYamlFlowItemLogScreenshot {
    logScreenshot?: string;
    recordToReport?: string;
    content?: string;
}
export type MidsceneYamlFlowItem = MidsceneYamlFlowItemAIAction | MidsceneYamlFlowItemAIAssert | MidsceneYamlFlowItemAIWaitFor | MidsceneYamlFlowItemRunGherkinScenario | MidsceneYamlFlowItemEvaluateJavaScript | MidsceneYamlFlowItemSleep | MidsceneYamlFlowItemLogScreenshot;
export interface FreeFn {
    name: string;
    fn: () => void;
}
export interface ScriptPlayerTaskStatus extends MidsceneYamlTask {
    status: ScriptPlayerStatusValue;
    currentStep?: number;
    totalSteps: number;
    error?: Error;
}
export type ScriptPlayerStatusValue = 'init' | 'running' | 'done' | 'error';
export interface MidsceneYamlConfig {
    concurrent?: number;
    continueOnError?: boolean;
    /**
     * Number of times to retry a failed yaml file before marking it as failed.
     * A value of 2 means each failing case is re-executed up to 2 extra times
     * (3 attempts in total). Only the cases that failed in the previous attempt
     * are retried. Defaults to 0 (no retry).
     */
    retry?: number;
    summary?: string;
    shareBrowserContext?: boolean;
    /** @deprecated Use `web`, `page`, or `browser` instead. */
    target?: MidsceneYamlScriptWebEnv;
    page?: MidsceneYamlScriptWebEnv;
    browser?: MidsceneYamlScriptWebEnv;
    web?: MidsceneYamlScriptWebEnv;
    android?: MidsceneYamlScriptAndroidEnv;
    ios?: MidsceneYamlScriptIOSEnv;
    /**
     * A setup yaml file that runs before the main `files`. It shares the same
     * browser context as the main files, so authentication or other prerequisite
     * state established here is visible to every main file. A setup failure
     * aborts the whole batch and the main files are marked as not executed. Only
     * meaningful with `shareBrowserContext: true`.
     */
    setup?: string;
    files: string[];
    headed?: boolean;
    keepWindow?: boolean;
    dotenvOverride?: boolean;
    dotenvDebug?: boolean;
}
export interface MidsceneYamlConfigOutput {
    format?: 'json';
    path?: string;
}
export type MidsceneYamlConfigResultType = 'success' | 'failed' | 'partialFailed' | 'notExecuted';
export interface MidsceneYamlConfigAttempt {
    attempt: number;
    success: boolean;
    output?: string | null;
    report?: string | null;
    error?: string;
    duration?: number;
    resultType?: MidsceneYamlConfigResultType;
}
export interface MidsceneYamlConfigResult {
    file: string;
    success: boolean;
    executed: boolean;
    output?: string | null;
    report?: string | null;
    retryReport?: string | null;
    attempts?: MidsceneYamlConfigAttempt[];
    error?: string;
    duration?: number;
    /**
     * Type of result:
     * - 'success': All tasks completed successfully
     * - 'failed': Execution failed (player error)
     * - 'partialFailed': Some tasks failed but execution continued (continueOnError)
     * - 'notExecuted': Not executed due to previous failures
     */
    resultType?: MidsceneYamlConfigResultType;
}
