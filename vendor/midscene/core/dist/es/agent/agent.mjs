import { getModelRuntime } from "../ai-model/models/index.mjs";
import { INTERNAL_CALL_ID_FIELD } from "../ai-model/service-caller/index.mjs";
import js_yaml from "js-yaml";
import { ScreenshotItem } from "../screenshot-item.mjs";
import service from "../service/index.mjs";
import { ExecutionDump, ReportActionDump } from "../types.mjs";
import { ReportGenerator, assertReportGenerationOptions } from "../report-generator.mjs";
import { getVersion, processCacheConfig, reportHTMLContent } from "../utils.mjs";
import { ScriptPlayer, buildDetailedLocateParam, parseYamlScript } from "../yaml/index.mjs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { MIDSCENE_REPLANNING_CYCLE_LIMIT, ModelConfigManager, globalConfigManager, globalModelConfigManager } from "@midscene/shared/env";
import { getDebug } from "@midscene/shared/logger";
import { assert, ifInBrowser, uuid } from "@midscene/shared/utils";
import { defineActionSleep } from "../device/index.mjs";
import { validateAgentCacheInput } from "./cache-config.mjs";
import { MetricsCollector } from "./metrics.mjs";
import { AgentProgressBus } from "./progress/index.mjs";
import { buildPromptWithContext } from "./prompt-context.mjs";
import { normalizeRecordToReportScreenshot } from "./record-to-report.mjs";
import { runGherkinScenario } from "./run-gherkin-scenario.mjs";
import { markdownToAiActPrompt } from "./run-markdown.mjs";
import { TaskCache } from "./task-cache.mjs";
import { TaskExecutionError, TaskExecutor, locatePlanForLocate, withFileChooser } from "./tasks.mjs";
import { UIObserver } from "./ui-observer.mjs";
import { locateParamStr, paramStr, taskTitleStr, typeStr } from "./ui-utils.mjs";
import { commonContextParser, getReportFileName, normalizeFilePaths, normalizeScrollType, parsePrompt } from "./utils.mjs";
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
const debug = getDebug('agent');
const warn = getDebug('agent', {
    console: true
});
const defaultServiceExtractOption = {
    domIncluded: false,
    screenshotIncluded: true
};
class Agent {
    get onDumpUpdate() {
        return this.dumpUpdateListeners[0];
    }
    set onDumpUpdate(callback) {
        this.dumpUpdateListeners = [];
        if (callback) this.dumpUpdateListeners.push(callback);
    }
    get aiActContext() {
        return this.opts.aiActContext ?? this.opts.aiActionContext;
    }
    get page() {
        return this.interface;
    }
    assertModelFamilyForNonWebContext() {
        if ('puppeteer' !== this.interface.interfaceType && 'playwright' !== this.interface.interfaceType && 'static' !== this.interface.interfaceType && 'chrome-extension-proxy' !== this.interface.interfaceType && 'page-over-chrome-extension-bridge' !== this.interface.interfaceType) this.modelConfigManager.throwErrorIfNonVLModel();
    }
    resolveReplanningCycleLimit(planningModel) {
        return this.opts.replanningCycleLimit ?? globalConfigManager.getEnvConfigValueAsNumber(MIDSCENE_REPLANNING_CYCLE_LIMIT) ?? planningModel.adapter.planning.defaultReplanningCycleLimit;
    }
    resolveModelRuntime(intent) {
        const runtime = getModelRuntime(this.modelConfigManager.getModelConfig(intent));
        return {
            ...runtime,
            onUsage: (usage)=>{
                this.usageCallCounter += 1;
                const enriched = usage.intent ? usage : {
                    ...usage,
                    intent: usage.slot
                };
                this.consumeUsage(enriched, `callai:${usage.request_id ?? this.usageCallCounter}`);
            }
        };
    }
    async getActionSpace() {
        return this.fullActionSpace;
    }
    isRetryableContextError(_error) {
        return false;
    }
    async getUIContext(action) {
        this.assertModelFamilyForNonWebContext();
        if (this.frozenUIContext) {
            debug('Using frozen page context for action:', action);
            return this.frozenUIContext;
        }
        const maxRetries = Agent.CONTEXT_RETRY_MAX;
        for(let attempt = 0;; attempt++)try {
            return await commonContextParser(this.interface, {
                uploadServerUrl: this.modelConfigManager.getUploadTestServerUrl(),
                screenshotShrinkFactor: this.opts.screenshotShrinkFactor
            });
        } catch (error) {
            if (attempt < maxRetries && this.isRetryableContextError(error)) {
                debug(`retryable context error (attempt ${attempt + 1}/${maxRetries}), retrying in ${Agent.CONTEXT_RETRY_DELAY_MS}ms: ${error}`);
                await new Promise((resolve)=>setTimeout(resolve, Agent.CONTEXT_RETRY_DELAY_MS));
                continue;
            }
            throw error;
        }
    }
    async _snapshotContext() {
        return await this.getUIContext('locate');
    }
    async startObserving(opt) {
        assert(!this.frozenUIContext, 'startObserving() cannot be used while the UI context is frozen (call unfreezePageContext() first)');
        assert(!this.activeObserver, "An observation window is already active on this agent. Stop the existing observer first (await observer.stop()) before starting a new one.");
        const observer = new UIObserver({
            openFrameSource: async ()=>await this.interface.openFrameSource?.() ?? void 0,
            screenshot: ()=>this.interface.screenshotBase64(),
            captureRepresentative: ()=>this.getUIContext('assert'),
            runAssert: (assertion, uiContext, msg, assertOpt)=>this.aiAssertWithContext(assertion, uiContext, msg, assertOpt),
            runBoolean: (prompt, uiContext, boolOpt)=>this.aiBooleanWithContext(prompt, uiContext, boolOpt),
            onStopped: ()=>{
                this.activeObserver = null;
            },
            screenshotShrinkFactor: this.opts.screenshotShrinkFactor
        }, opt);
        this.activeObserver = observer;
        try {
            await observer.start();
        } catch (error) {
            this.activeObserver = null;
            throw error;
        }
        return observer;
    }
    async setAIActionContext(prompt) {
        await this.setAIActContext(prompt);
    }
    async setAIActContext(prompt) {
        if (this.aiActContext) console.warn('aiActContext is already set, and it is called again, will override the previous setting');
        this.opts.aiActContext = prompt;
        this.opts.aiActionContext = prompt;
    }
    resetDump() {
        this.dump = new ReportActionDump({
            sdkVersion: getVersion(),
            groupName: this.opts.groupName,
            groupDescription: this.opts.groupDescription,
            executions: [],
            modelBriefs: [],
            deviceType: this.interface.interfaceType
        });
        this.executionDumpIndexByRunner = new WeakMap();
        return this.dump;
    }
    appendExecutionDump(execution, runner) {
        const currentDump = this.dump;
        if (runner) {
            const existingIndex = this.executionDumpIndexByRunner.get(runner);
            if (void 0 !== existingIndex) {
                currentDump.executions[existingIndex] = execution;
                return;
            }
            currentDump.executions.push(execution);
            this.executionDumpIndexByRunner.set(runner, currentDump.executions.length - 1);
            return;
        }
        currentDump.executions.push(execution);
    }
    collectUsageMetrics(execution) {
        for (const task of execution.tasks){
            this.consumeUsage(task.usage, `${task.taskId}:usage`);
            this.consumeUsage(task.searchAreaUsage, `${task.taskId}:searchAreaUsage`);
        }
    }
    consumeUsage(usage, key) {
        if (!usage) return;
        let dedupKey;
        dedupKey = usage.request_id ? `req:${usage.request_id}` : usage[INTERNAL_CALL_ID_FIELD] ? `int:${usage[INTERNAL_CALL_ID_FIELD]}` : key;
        if (this.countedUsageKeys.has(dedupKey)) return;
        this.countedUsageKeys.add(dedupKey);
        this.metricsCollector.add(usage);
        if (this.opts.onLLMUsage) try {
            this.opts.onLLMUsage(usage);
        } catch (error) {
            warn(`onLLMUsage listener threw, ignoring: ${error}`);
        }
    }
    get metrics() {
        return this.metricsCollector.snapshot();
    }
    dumpDataString(opt) {
        this.dump.groupName = this.opts.groupName;
        this.dump.groupDescription = this.opts.groupDescription;
        if (ifInBrowser || opt?.inlineScreenshots) return this.dump.serializeWithInlineScreenshots();
        return this.dump.serialize();
    }
    reportHTMLString(opt) {
        return reportHTMLContent(this.dumpDataString(opt));
    }
    writeOutActionDumps(executionDump) {
        const exec = executionDump || this.lastExecutionDump;
        if (exec) {
            this.lastExecutionDump = exec;
            this.reportGenerator.onExecutionUpdate(exec, this.getReportMeta(), this.opts.reportAttributes);
        }
        this.reportFile = this.reportGenerator.getReportPath();
    }
    getReportMeta() {
        return {
            groupName: this.dump.groupName,
            groupDescription: this.dump.groupDescription,
            sdkVersion: this.dump.sdkVersion,
            modelBriefs: this.dump.modelBriefs,
            deviceType: this.dump.deviceType
        };
    }
    async callbackOnTaskStartTip(task) {
        const param = paramStr(task);
        const tip = param ? `${typeStr(task)} - ${param}` : typeStr(task);
        if (this.onTaskStartTip) await this.onTaskStartTip(tip);
    }
    wrapActionInActionSpace(name) {
        return async (param)=>await this.callActionInActionSpace(name, param);
    }
    async callActionInActionSpace(type, opt) {
        debug('callActionInActionSpace', type, ',', opt);
        const actionPlan = {
            type: type,
            param: opt || {},
            thought: ''
        };
        debug('actionPlan', actionPlan);
        const plans = [
            actionPlan
        ].filter(Boolean);
        const title = taskTitleStr(type, locateParamStr(opt?.locate || {}));
        const defaultModel = this.resolveModelRuntime('default');
        const planningModel = this.resolveModelRuntime('planning');
        const { output } = await this.taskExecutor.runPlans(title, plans, planningModel, defaultModel);
        return output;
    }
    async aiTap(locatePrompt, opt) {
        assert(locatePrompt, 'missing locate prompt for tap');
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt, opt);
        const fileChooserAccept = opt?.fileChooserAccept ? this.normalizeFileInput(opt.fileChooserAccept) : void 0;
        await withFileChooser(this.interface, fileChooserAccept, async ()=>{
            await this.callActionInActionSpace('Tap', {
                locate: detailedLocateParam
            });
        });
    }
    async aiRightClick(locatePrompt, opt) {
        assert(locatePrompt, 'missing locate prompt for right click');
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt, opt);
        await this.callActionInActionSpace('RightClick', {
            locate: detailedLocateParam
        });
    }
    async aiDoubleClick(locatePrompt, opt) {
        assert(locatePrompt, 'missing locate prompt for double click');
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt, opt);
        await this.callActionInActionSpace('DoubleClick', {
            locate: detailedLocateParam
        });
    }
    async aiHover(locatePrompt, opt) {
        assert(locatePrompt, 'missing locate prompt for hover');
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt, opt);
        await this.callActionInActionSpace('Hover', {
            locate: detailedLocateParam
        });
    }
    async aiInput(locatePromptOrValue, locatePromptOrOpt, optOrUndefined) {
        let value;
        let locatePrompt;
        let opt;
        if ('object' == typeof locatePromptOrOpt && null !== locatePromptOrOpt && 'value' in locatePromptOrOpt) {
            locatePrompt = locatePromptOrValue;
            const optWithValue = locatePromptOrOpt;
            value = optWithValue.value;
            opt = optWithValue;
        } else {
            value = locatePromptOrValue;
            locatePrompt = locatePromptOrOpt;
            opt = {
                ...optOrUndefined,
                value
            };
        }
        assert('string' == typeof value || 'number' == typeof value, 'input value must be a string or number, use empty string if you want to clear the input');
        assert(locatePrompt, 'missing locate prompt for input');
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt, opt);
        const stringValue = 'number' == typeof value ? String(value) : value;
        const mode = opt?.mode === 'append' ? 'typeOnly' : opt?.mode;
        await this.callActionInActionSpace('Input', {
            ...opt || {},
            value: stringValue,
            locate: detailedLocateParam,
            mode
        });
    }
    async aiKeyboardPress(locatePromptOrKeyName, locatePromptOrOpt, optOrUndefined) {
        let keyName;
        let locatePrompt;
        let opt;
        if ('object' == typeof locatePromptOrOpt && null !== locatePromptOrOpt && 'keyName' in locatePromptOrOpt) {
            locatePrompt = locatePromptOrKeyName;
            opt = locatePromptOrOpt;
        } else {
            keyName = locatePromptOrKeyName;
            locatePrompt = locatePromptOrOpt;
            opt = {
                ...optOrUndefined || {},
                keyName
            };
        }
        assert(opt?.keyName, 'missing keyName for keyboard press');
        const detailedLocateParam = locatePrompt ? buildDetailedLocateParam(locatePrompt, opt) : void 0;
        await this.callActionInActionSpace('KeyboardPress', {
            ...opt || {},
            locate: detailedLocateParam
        });
    }
    async aiScroll(locatePromptOrScrollParam, locatePromptOrOpt, optOrUndefined) {
        let scrollParam;
        let locatePrompt;
        let opt;
        const isLocatePromptLike = (value)=>{
            if ('string' == typeof value || null == value) return true;
            return 'object' == typeof value && null !== value && 'prompt' in value;
        };
        if (isLocatePromptLike(locatePromptOrScrollParam) && 'object' == typeof locatePromptOrOpt && null !== locatePromptOrOpt) {
            locatePrompt = locatePromptOrScrollParam;
            opt = locatePromptOrOpt;
        } else {
            scrollParam = locatePromptOrScrollParam;
            locatePrompt = locatePromptOrOpt;
            opt = {
                ...optOrUndefined || {},
                ...scrollParam || {}
            };
        }
        if (opt) {
            const normalizedScrollType = normalizeScrollType(opt.scrollType);
            if (normalizedScrollType !== opt.scrollType) opt = {
                ...opt || {},
                scrollType: normalizedScrollType
            };
        }
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt || '', opt);
        await this.callActionInActionSpace('Scroll', {
            ...opt || {},
            locate: detailedLocateParam
        });
    }
    async aiPinch(locatePrompt, opt) {
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt || '', opt);
        await this.callActionInActionSpace('Pinch', {
            ...opt,
            locate: detailedLocateParam
        });
    }
    async aiLongPress(locatePrompt, opt) {
        assert(locatePrompt, 'missing locate prompt for long press');
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt, opt);
        await this.callActionInActionSpace('LongPress', {
            ...opt || {},
            locate: detailedLocateParam
        });
    }
    async aiClearInput(locatePrompt, opt) {
        assert(locatePrompt, 'missing locate prompt for clear input');
        const detailedLocateParam = buildDetailedLocateParam(locatePrompt, opt);
        await this.callActionInActionSpace('ClearInput', {
            locate: detailedLocateParam
        });
    }
    async aiAct(taskPrompt, opt) {
        const internalReportDisplay = opt?._internalReportDisplay;
        const taskPromptText = 'string' == typeof taskPrompt ? taskPrompt : taskPrompt.prompt;
        const reportPrompt = internalReportDisplay?.prompt || taskPromptText;
        const fileChooserAccept = opt?.fileChooserAccept ? this.normalizeFileInput(opt.fileChooserAccept) : void 0;
        const abortSignal = opt?.abortSignal;
        if (abortSignal?.aborted) throw new Error(`aiAct aborted: ${abortSignal.reason || 'signal already aborted'}`);
        const runAiAct = async ()=>{
            const planningModel = this.resolveModelRuntime('planning');
            const defaultModel = this.resolveModelRuntime('default');
            const aiActContext = opt?.context !== void 0 ? opt.context : this.aiActContext;
            const cachePrompt = buildPromptWithContext(taskPrompt, aiActContext);
            let deepThink = opt?.deepThink === true;
            if (deepThink && 'custom' === planningModel.adapter.planning.kind) {
                warn(`The "deepThink" option is not supported for aiAct with custom planning adapters (modelFamily: ${planningModel.config.modelFamily ?? 'unknown'}). It will be ignored.`);
                deepThink = false;
            }
            let deepLocate = opt?.deepLocate;
            if (deepLocate && !planningModel.adapter.planning.supportsActionDeepLocate) {
                warn(`The "deepLocate" option is not supported for aiAct with the current planning adapter (modelFamily: ${planningModel.config.modelFamily ?? 'unknown'}). It will be ignored.`);
                deepLocate = false;
            }
            const noIndividualLocateModel = 'default' === planningModel.config.slot;
            const includeLocateInPlanning = !deepThink && noIndividualLocateModel;
            debug('setting includeLocateInPlanning to', includeLocateInPlanning, {
                deepThink,
                noIndividualLocateModel
            });
            const cacheable = opt?.cacheable;
            const replanningCycleLimit = this.resolveReplanningCycleLimit(planningModel);
            const planCacheEnabled = planningModel.adapter.planning.cacheEnabled;
            const matchedCache = planCacheEnabled && false !== cacheable ? this.taskCache?.matchPlanCache(cachePrompt) : void 0;
            let cachedYamlFailed = false;
            if (matchedCache?.cacheUsable && this.taskCache?.isCacheResultUsed && matchedCache.cacheContent?.yamlWorkflow?.trim()) {
                const yaml = matchedCache.cacheContent.yamlWorkflow;
                try {
                    await this.taskExecutor.loadYamlFlowAsPlanning(taskPrompt, yaml, internalReportDisplay);
                    debug('matched cache, will call .runYaml to run the action');
                    await this.runYaml(yaml);
                    return;
                } catch (error) {
                    cachedYamlFailed = true;
                    warn(`cached aiAct plan failed, will replan and disable the stale cache: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            const imagesIncludeCount = deepThink ? 2 : 1;
            const { output: actionOutput } = await this.taskExecutor.action(taskPrompt, planningModel, defaultModel, includeLocateInPlanning, aiActContext, cacheable, replanningCycleLimit, imagesIncludeCount, deepThink, fileChooserAccept, deepLocate, abortSignal, internalReportDisplay, opt?.maxActions);
            if (this.taskCache && false !== cacheable) {
                const yamlFlow = cachedYamlFailed ? [] : actionOutput?.yamlFlow;
                if (!cachedYamlFailed && !yamlFlow?.length) return actionOutput?.output;
                const yamlFlowToCache = yamlFlow ?? [];
                const yamlContent = {
                    tasks: [
                        {
                            name: reportPrompt,
                            flow: yamlFlowToCache
                        }
                    ]
                };
                const yamlFlowStr = js_yaml.dump(yamlContent);
                this.taskCache.updateOrAppendCacheRecord({
                    type: 'plan',
                    prompt: cachePrompt,
                    yamlWorkflow: yamlFlowStr
                }, matchedCache);
            }
            return actionOutput?.output;
        };
        return await runAiAct();
    }
    async runMarkdown(markdownPath, opt) {
        const markdown = await readFile(markdownPath, 'utf-8');
        const { prompt } = await markdownToAiActPrompt(markdown, markdownPath);
        return this.aiAct(prompt, {
            ...opt,
            _internalReportDisplay: {
                type: 'Markdown',
                prompt: basename(markdownPath)
            }
        });
    }
    async runGherkinScenario(scenarioText, opt) {
        return runGherkinScenario(this, scenarioText, opt);
    }
    async aiAction(taskPrompt, opt) {
        return this.aiAct(taskPrompt, opt);
    }
    async aiQuery(demand, opt = defaultServiceExtractOption) {
        const modelRuntime = this.resolveModelRuntime('insight');
        const { output } = await this.taskExecutor.createTypeQueryExecution('Query', demand, modelRuntime, opt);
        return output;
    }
    async aiBoolean(prompt, opt = defaultServiceExtractOption) {
        return this.aiBooleanWithContext(prompt, void 0, opt);
    }
    async aiBooleanWithContext(prompt, uiContext, opt = defaultServiceExtractOption) {
        const modelRuntime = this.resolveModelRuntime('insight');
        const { textPrompt, multimodalPrompt } = parsePrompt(prompt);
        const { output } = await this.taskExecutor.createTypeQueryExecution('Boolean', textPrompt, modelRuntime, opt, multimodalPrompt, uiContext ? {
            uiContext
        } : void 0);
        return output;
    }
    async aiNumber(prompt, opt = defaultServiceExtractOption) {
        const modelRuntime = this.resolveModelRuntime('insight');
        const { textPrompt, multimodalPrompt } = parsePrompt(prompt);
        const { output } = await this.taskExecutor.createTypeQueryExecution('Number', textPrompt, modelRuntime, opt, multimodalPrompt);
        return output;
    }
    async aiString(prompt, opt = defaultServiceExtractOption) {
        const modelRuntime = this.resolveModelRuntime('insight');
        const { textPrompt, multimodalPrompt } = parsePrompt(prompt);
        const { output } = await this.taskExecutor.createTypeQueryExecution('String', textPrompt, modelRuntime, opt, multimodalPrompt);
        return output;
    }
    async aiAsk(prompt, opt = defaultServiceExtractOption) {
        return this.aiString(prompt, opt);
    }
    async aiLocate(prompt, opt) {
        const locateParam = buildDetailedLocateParam(prompt, opt);
        assert(locateParam, 'cannot get locate param for aiLocate');
        const locatePlan = locatePlanForLocate(locateParam);
        const plans = [
            locatePlan
        ];
        const defaultModel = this.resolveModelRuntime('default');
        const planningModel = this.resolveModelRuntime('planning');
        const { output } = await this.taskExecutor.runPlans(taskTitleStr('Locate', locateParamStr(locateParam)), plans, planningModel, defaultModel, opt?.uiContext ? {
            uiContext: opt.uiContext
        } : void 0);
        const { element } = output;
        return {
            rect: element?.rect,
            center: element?.center,
            dpr: element?.dpr
        };
    }
    async aiAssert(assertion, msg, opt) {
        return this.aiAssertWithContext(assertion, void 0, msg, opt);
    }
    async aiAssertWithContext(assertion, uiContext, msg, opt) {
        const modelRuntime = this.resolveModelRuntime('insight');
        const serviceOpt = {
            domIncluded: opt?.domIncluded ?? defaultServiceExtractOption.domIncluded,
            screenshotIncluded: opt?.screenshotIncluded ?? defaultServiceExtractOption.screenshotIncluded
        };
        const assertionWithContext = buildPromptWithContext(assertion, opt?.context);
        const { textPrompt, multimodalPrompt } = parsePrompt(assertionWithContext);
        const assertionText = 'string' == typeof assertion ? assertion : assertion.prompt;
        const executionOptions = {
            abortSignal: opt?.abortSignal,
            ...uiContext ? {
                uiContext
            } : {}
        };
        try {
            const { output, thought } = await this.taskExecutor.createTypeQueryExecution('Assert', textPrompt, modelRuntime, serviceOpt, multimodalPrompt, executionOptions);
            const pass = Boolean(output);
            const message = pass ? void 0 : `Assertion failed: ${msg || assertionText}\nReason: ${thought || '(no_reason)'}`;
            if (opt?.keepRawResponse) return {
                pass,
                thought,
                message
            };
            if (!pass) throw new Error(message);
        } catch (error) {
            if (error instanceof TaskExecutionError) {
                const errorTask = error.errorTask;
                const thought = errorTask?.thought;
                const rawError = errorTask?.error;
                const rawMessage = errorTask?.errorMessage || (rawError instanceof Error ? rawError.message : rawError ? String(rawError) : void 0);
                const reason = thought || rawMessage || '(no_reason)';
                const message = `Assertion failed: ${msg || assertionText}\nReason: ${reason}`;
                if (opt?.keepRawResponse) return {
                    pass: false,
                    thought,
                    message
                };
                throw new Error(message, {
                    cause: rawError ?? error
                });
            }
            throw error;
        }
    }
    async aiWaitFor(assertion, opt) {
        const modelRuntime = this.resolveModelRuntime('insight');
        await this.taskExecutor.waitFor(assertion, {
            ...opt,
            timeoutMs: opt?.timeoutMs || 15000,
            checkIntervalMs: opt?.checkIntervalMs || 3000
        }, modelRuntime);
    }
    async ai(...args) {
        return this.aiAct(...args);
    }
    async runYaml(yamlScriptContent) {
        const script = parseYamlScript(yamlScriptContent, 'yaml');
        const player = new ScriptPlayer(script, async ()=>({
                agent: this,
                freeFn: []
            }));
        await player.run();
        if ('error' === player.status) {
            const errors = player.taskStatusList.filter((task)=>'error' === task.status).map((task)=>`task - ${task.name}: ${task.error?.message}`).join('\n');
            throw new Error(`Error(s) occurred in running yaml script:\n${errors}`);
        }
        return {
            result: player.result
        };
    }
    async evaluateJavaScript(script) {
        assert(this.interface.evaluateJavaScript, 'evaluateJavaScript is not supported in current agent');
        return this.interface.evaluateJavaScript(script);
    }
    addDumpUpdateListener(listener) {
        this.dumpUpdateListeners.push(listener);
        return ()=>{
            this.removeDumpUpdateListener(listener);
        };
    }
    removeDumpUpdateListener(listener) {
        const index = this.dumpUpdateListeners.indexOf(listener);
        if (index > -1) this.dumpUpdateListeners.splice(index, 1);
    }
    clearDumpUpdateListeners() {
        this.dumpUpdateListeners = [];
    }
    addProgressListener(listener) {
        return this.progressBus.subscribe(listener);
    }
    removeProgressListener(listener) {
        this.progressBus.unsubscribe(listener);
    }
    clearProgressListeners() {
        this.progressBus.clear();
    }
    notifyDumpUpdateListeners(executionDump) {
        const dumpString = this.dumpDataString();
        for (const listener of this.dumpUpdateListeners)try {
            listener(dumpString, executionDump);
        } catch (error) {
            console.error('Error in onDumpUpdate listener', error);
        }
    }
    async destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        if (this.activeObserver) {
            try {
                await this.activeObserver.stop();
            } catch (error) {
                debug(`error stopping active observer during destroy: ${error}`);
            }
            this.activeObserver = null;
        }
        let interfaceDestroyError;
        try {
            await this.interface.destroy?.();
        } catch (error) {
            interfaceDestroyError = error;
        }
        await this.reportGenerator.flush();
        const finalPath = await this.reportGenerator.finalize();
        this.reportFile = finalPath;
        this.resetDump();
        if (interfaceDestroyError) throw interfaceDestroyError;
    }
    async recordToReport(title, opt) {
        const now = Date.now();
        const screenshots = opt?.screenshots;
        const screenshotBase64 = opt?.screenshotBase64;
        const hasScreenshots = void 0 !== screenshots;
        const hasScreenshotBase64 = void 0 !== screenshotBase64;
        if (hasScreenshots && !Array.isArray(screenshots)) throw new Error('recordToReport: screenshots must be an array');
        if (hasScreenshotBase64 && 'string' != typeof screenshotBase64) throw new Error('recordToReport: screenshotBase64 must be a string');
        if (hasScreenshots && hasScreenshotBase64) throw new Error('recordToReport: provide only one of screenshots or screenshotBase64');
        if (opt && 'subType' in opt) throw new Error('recordToReport: subType is not supported');
        const customScreenshots = hasScreenshots ? screenshots : void 0;
        if (customScreenshots && 0 === customScreenshots.length) throw new Error('recordToReport: screenshots cannot be empty');
        const screenshotInputs = customScreenshots ?? (hasScreenshotBase64 ? [
            {
                base64: screenshotBase64
            }
        ] : [
            {
                base64: await this.interface.screenshotBase64()
            }
        ]);
        const recorder = screenshotInputs.map((screenshotInput, index)=>{
            const normalizedScreenshotInput = normalizeRecordToReportScreenshot(screenshotInput, index);
            const ts = now + index;
            return {
                type: 'screenshot',
                ts,
                screenshot: ScreenshotItem.create(normalizedScreenshotInput.base64, ts),
                description: normalizedScreenshotInput.description
            };
        });
        const task = {
            taskId: uuid(),
            type: 'Log',
            subType: 'Screenshot',
            status: 'finished',
            recorder,
            timing: {
                start: now,
                end: now,
                cost: 0
            },
            param: {
                content: opt?.content || ''
            },
            executor: async ()=>{}
        };
        const executionDump = new ExecutionDump({
            id: uuid(),
            logTime: now,
            name: `Log - ${title || 'untitled'}`,
            description: opt?.content || '',
            tasks: [
                task
            ]
        });
        this.appendExecutionDump(executionDump);
        this.writeOutActionDumps(executionDump);
        await this.reportGenerator.flush();
        this.notifyDumpUpdateListeners(executionDump);
    }
    async recordErrorToReport(title, opt) {
        const now = Date.now();
        const recorder = [];
        const base64 = opt.screenshotBase64 ?? await this.interface.screenshotBase64();
        if (base64) recorder.push({
            type: 'screenshot',
            ts: now,
            screenshot: ScreenshotItem.create(base64, now)
        });
        const task = {
            taskId: uuid(),
            type: 'Log',
            subType: 'Error',
            status: 'failed',
            recorder,
            timing: {
                start: now,
                end: now,
                cost: 0
            },
            param: {
                content: opt.content || ''
            },
            error: opt.error,
            errorMessage: opt.error.message,
            errorStack: opt.error.stack,
            executor: async ()=>{}
        };
        const executionDump = new ExecutionDump({
            id: uuid(),
            logTime: now,
            name: title,
            description: opt.content || opt.error.message,
            tasks: [
                task
            ]
        });
        this.appendExecutionDump(executionDump);
        this.writeOutActionDumps(executionDump);
        await this.reportGenerator.flush();
        this.notifyDumpUpdateListeners(executionDump);
    }
    async logScreenshot(title, opt) {
        await this.recordToReport(title, opt);
    }
    _unstableLogContent() {
        const { groupName, groupDescription, executions } = this.dump;
        return {
            groupName,
            groupDescription,
            executions: executions || []
        };
    }
    async freezePageContext() {
        debug('Freezing page context');
        const context = await this._snapshotContext();
        context._isFrozen = true;
        this.frozenUIContext = context;
        debug('Page context frozen successfully');
    }
    async unfreezePageContext() {
        debug('Unfreezing page context');
        this.frozenUIContext = void 0;
        debug('Page context unfrozen successfully');
    }
    processCacheConfig(opts) {
        validateAgentCacheInput(opts.cache);
        const cacheConfig = processCacheConfig(opts.cache, opts.cacheId || 'default');
        if (!cacheConfig) return null;
        if ('object' == typeof cacheConfig && null !== cacheConfig) {
            const id = cacheConfig.id;
            const strategyValue = cacheConfig.strategy ?? 'read-write';
            const isReadOnly = 'read-only' === strategyValue;
            const isWriteOnly = 'write-only' === strategyValue;
            return {
                id,
                enabled: !isWriteOnly,
                readOnly: isReadOnly,
                writeOnly: isWriteOnly,
                cacheDir: cacheConfig.cacheDir?.trim()
            };
        }
        return null;
    }
    normalizeFileInput(files) {
        const filesArray = Array.isArray(files) ? files : [
            files
        ];
        return normalizeFilePaths(filesArray);
    }
    async flushCache(options) {
        if (!this.taskCache) throw new Error('Cache is not configured');
        this.taskCache.flushCacheToFile(options);
    }
    constructor(interfaceInstance, opts){
        _define_property(this, "interface", void 0);
        _define_property(this, "service", void 0);
        _define_property(this, "dump", void 0);
        _define_property(this, "reportFile", void 0);
        _define_property(this, "reportFileName", void 0);
        _define_property(this, "taskExecutor", void 0);
        _define_property(this, "opts", void 0);
        _define_property(this, "dryMode", false);
        _define_property(this, "onTaskStartTip", void 0);
        _define_property(this, "taskCache", void 0);
        _define_property(this, "metricsCollector", new MetricsCollector());
        _define_property(this, "usageCallCounter", 0);
        _define_property(this, "countedUsageKeys", new Set());
        _define_property(this, "dumpUpdateListeners", []);
        _define_property(this, "progressBus", new AgentProgressBus());
        _define_property(this, "destroyed", false);
        _define_property(this, "modelConfigManager", void 0);
        _define_property(this, "frozenUIContext", void 0);
        _define_property(this, "activeObserver", null);
        _define_property(this, "executionDumpIndexByRunner", new WeakMap());
        _define_property(this, "fullActionSpace", void 0);
        _define_property(this, "reportGenerator", void 0);
        _define_property(this, "lastExecutionDump", void 0);
        this.interface = interfaceInstance;
        this.opts = Object.assign({
            generateReport: true,
            persistExecutionDump: false,
            autoPrintReportMsg: true,
            groupName: 'Midscene Report',
            groupDescription: ''
        }, opts || {});
        assertReportGenerationOptions(this.opts);
        const resolvedAiActContext = this.opts.aiActContext ?? this.opts.aiActionContext;
        if (void 0 !== resolvedAiActContext) {
            this.opts.aiActContext = resolvedAiActContext;
            this.opts.aiActionContext ??= resolvedAiActContext;
        }
        if (opts?.modelConfig && ('object' != typeof opts?.modelConfig || Array.isArray(opts.modelConfig))) throw new Error(`opts.modelConfig must be a plain object map of env keys to values, but got ${typeof opts?.modelConfig}`);
        const hasCustomConfig = opts?.modelConfig || opts?.createOpenAIClient;
        this.modelConfigManager = hasCustomConfig ? new ModelConfigManager(opts?.modelConfig, opts?.createOpenAIClient) : globalModelConfigManager;
        this.onTaskStartTip = this.opts.onTaskStartTip;
        this.service = new service(async ()=>this.getUIContext());
        const cacheConfigObj = this.processCacheConfig(opts || {});
        if (cacheConfigObj) this.taskCache = new TaskCache(cacheConfigObj.id, cacheConfigObj.enabled, void 0, {
            readOnly: cacheConfigObj.readOnly,
            writeOnly: cacheConfigObj.writeOnly,
            cacheDir: cacheConfigObj.cacheDir
        });
        const baseActionSpace = this.interface.actionSpace();
        this.fullActionSpace = [
            ...baseActionSpace,
            defineActionSleep()
        ];
        this.taskExecutor = new TaskExecutor(this.interface, this.service, {
            taskCache: this.taskCache,
            onTaskStart: this.callbackOnTaskStartTip.bind(this),
            replanningCycleLimit: this.opts.replanningCycleLimit,
            waitAfterAction: this.opts.waitAfterAction,
            useDeviceTime: this.opts.useDeviceTime,
            actionSpace: this.fullActionSpace,
            hooks: {
                onSnapshotChange: async (runner)=>{
                    const executionDump = runner.dump();
                    this.appendExecutionDump(executionDump, runner);
                    this.collectUsageMetrics(executionDump);
                    this.writeOutActionDumps(executionDump);
                    await this.reportGenerator.flush();
                    const dumpString = this.dumpDataString();
                    for (const listener of this.dumpUpdateListeners)try {
                        listener(dumpString, executionDump);
                    } catch (error) {
                        console.error('Error in onDumpUpdate listener', error);
                    }
                },
                onProgress: this.progressBus.publish
            }
        });
        this.dump = this.resetDump();
        this.reportFileName = opts?.reportFileName ?? getReportFileName(opts?.testId || this.interface.interfaceType || 'web');
        this.reportGenerator = ReportGenerator.create(this.reportFileName, {
            generateReport: this.opts.generateReport,
            persistExecutionDump: this.opts.persistExecutionDump,
            outputFormat: this.opts.outputFormat,
            autoPrintReportMsg: this.opts.autoPrintReportMsg,
            reuseExistingReport: this.opts.reportAttributes?.['data-group-id'] === this.reportFileName
        });
    }
}
_define_property(Agent, "CONTEXT_RETRY_MAX", 3);
_define_property(Agent, "CONTEXT_RETRY_DELAY_MS", 1500);
const createAgent = (interfaceInstance, opts)=>new Agent(interfaceInstance, opts);
export { Agent, createAgent };

//# sourceMappingURL=agent.mjs.map