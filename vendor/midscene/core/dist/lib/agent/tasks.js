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
    locatePlanForLocate: ()=>external_task_builder_js_namespaceObject.locatePlanForLocate,
    recordAndReleaseScreenshotSequence: ()=>recordAndReleaseScreenshotSequence,
    TaskExecutionError: ()=>external_task_runner_js_namespaceObject.TaskExecutionError,
    TaskExecutor: ()=>TaskExecutor,
    withFileChooser: ()=>withFileChooser
});
const index_js_namespaceObject = require("../ai-model/index.js");
const extraction_js_namespaceObject = require("../ai-model/prompt/extraction.js");
const planning_index_js_namespaceObject = require("../ai-model/workflows/planning/index.js");
const external_common_js_namespaceObject = require("../common.js");
const external_task_runner_js_namespaceObject = require("../task-runner.js");
const external_types_js_namespaceObject = require("../types.js");
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const external_execution_session_js_namespaceObject = require("./execution-session.js");
const external_progress_index_js_namespaceObject = require("./progress/index.js");
const external_task_builder_js_namespaceObject = require("./task-builder.js");
const external_task_timing_js_namespaceObject = require("../task-timing.js");
const extractor_namespaceObject = require("@midscene/shared/extractor");
const external_ui_utils_js_namespaceObject = require("./ui-utils.js");
const external_usage_intent_js_namespaceObject = require("./usage-intent.js");
const external_utils_js_namespaceObject = require("./utils.js");
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
const debug = (0, logger_namespaceObject.getDebug)('device-task-executor');
const warnLog = (0, logger_namespaceObject.getDebug)('device-task-executor', {
    console: true
});
const maxErrorCountAllowedInOnePlanningLoop = 5;
const maxPlanningFeedbackLength = 500;
function truncatePlanningFeedback(feedback) {
    if (feedback.length <= maxPlanningFeedbackLength) return feedback;
    return `${feedback.slice(0, maxPlanningFeedbackLength)}
...[truncated, ${feedback.length - maxPlanningFeedbackLength} more characters]`;
}
class TaskExecutor {
    get page() {
        return this.interface;
    }
    createExecutionSession(title, options) {
        return new external_execution_session_js_namespaceObject.ExecutionSession(title, ()=>options?.uiContext ? Promise.resolve(options.uiContext) : Promise.resolve(this.service.contextRetrieverFn()), {
            onTaskStart: this.onTaskStartCallback,
            tasks: options?.tasks,
            onSnapshotChange: async (runner, error)=>{
                await this.hooks?.onSnapshotChange?.(runner, error);
                await options?.onSnapshotChange?.(runner, error);
            },
            ...options?.onTaskEvent ? {
                onTaskEvent: options.onTaskEvent
            } : {}
        });
    }
    getActionSpace() {
        return this.providedActionSpace;
    }
    async emitProgress(scope, phase, data) {
        await this.hooks?.onProgress?.(scope, phase, data);
    }
    emitAiActProgress(phase, data) {
        return this.emitProgress(external_types_js_namespaceObject.aiActProgressScope, phase, data);
    }
    setPendingFeedbackMessage(conversationHistory, timeString, body) {
        conversationHistory.pendingFeedbackMessage = body ? `Time: ${timeString}, ${body}` : `Current time: ${timeString}`;
    }
    collectPlanningFeedback(tasks) {
        const feedbackMessages = tasks.flatMap(({ planningFeedback })=>planningFeedback ? [
                truncatePlanningFeedback(planningFeedback)
            ] : []);
        return feedbackMessages.length > 0 ? feedbackMessages.join('\n\n') : void 0;
    }
    async getTimeString(format) {
        if (this.useDeviceTime) if (this.interface.getDeviceLocalTimeString) try {
            return await this.interface.getDeviceLocalTimeString(format);
        } catch (error) {
            warnLog(`Failed to get device time string, falling back to runtime time: ${error}`);
        }
        else warnLog('useDeviceTime is enabled but getDeviceLocalTimeString is not implemented, falling back to runtime time.');
        return (0, external_common_js_namespaceObject.getReadableTimeString)(format);
    }
    async convertPlanToExecutable(plans, planningModel, defaultModel, options) {
        return this.taskBuilder.build(plans, planningModel, defaultModel, options);
    }
    async loadYamlFlowAsPlanning(userInstruction, yamlString, reportOptions) {
        const session = this.createExecutionSession((0, external_ui_utils_js_namespaceObject.taskTitleStr)(reportOptions?.type || 'Act', reportOptions?.prompt || (0, external_common_js_namespaceObject.userPromptToString)(userInstruction)));
        const task = {
            type: 'Planning',
            subType: 'LoadYaml',
            param: {
                userInstruction,
                ...reportOptions?.prompt ? {
                    userInstructionDisplay: reportOptions.prompt
                } : {}
            },
            executor: async (param, executorContext)=>{
                const { uiContext } = executorContext;
                (0, utils_namespaceObject.assert)(uiContext, 'uiContext is required for Planning task');
                return {
                    output: {
                        actions: [],
                        shouldContinuePlanning: false,
                        log: '',
                        yamlString
                    },
                    cache: {
                        hit: true
                    },
                    hitBy: {
                        from: 'Cache',
                        context: {
                            yamlString
                        }
                    }
                };
            }
        };
        const runner = session.getRunner();
        await session.appendAndRun(task);
        return {
            runner
        };
    }
    async runPlans(title, plans, planningModel, defaultModel, options) {
        const session = this.createExecutionSession(title, options);
        const { tasks } = await this.convertPlanToExecutable(plans, planningModel, defaultModel);
        const runner = session.getRunner();
        const result = await session.appendAndRun(tasks);
        const { output } = result ?? {};
        return {
            output,
            runner
        };
    }
    async action(userPrompt, planningModel, defaultModel, includeLocateInPlanning, aiActContext, cacheable, replanningCycleLimitOverride, imagesIncludeCount, deepThink, fileChooserAccept, deepLocate, abortSignal, reportOptions, maxActions) {
        return withFileChooser(this.interface, fileChooserAccept, async ()=>this.runAction(userPrompt, planningModel, defaultModel, includeLocateInPlanning, aiActContext, cacheable, replanningCycleLimitOverride, imagesIncludeCount, deepThink, deepLocate, abortSignal, reportOptions, maxActions));
    }
    invalidateFailedCacheHitLocates(runner, fromIndex) {
        if (!this.taskCache) return;
        for(let i = fromIndex; i < runner.tasks.length; i++){
            const task = runner.tasks[i];
            if ('Planning' === task.type && 'Locate' === task.subType && task.hitBy?.from === 'Cache') {
                const prompt = task.param?.prompt;
                if (prompt) this.taskCache.markLocateCacheStale(prompt);
            }
        }
    }
    async runAction(userPrompt, planningModel, defaultModel, includeLocateInPlanning, aiActContext, cacheable, replanningCycleLimitOverride, imagesIncludeCount, deepThink, deepLocate, abortSignal, reportOptions, maxActions) {
        const conversationHistory = new index_js_namespaceObject.ConversationHistory();
        const promptDisplay = reportOptions?.prompt || (0, external_common_js_namespaceObject.userPromptToString)(userPrompt);
        const actionBudget = 'number' == typeof maxActions && Number.isFinite(maxActions) && maxActions >= 0 ? Math.floor(maxActions) : void 0;
        let totalActionsExecuted = 0;
        let activeActionReporter;
        const session = this.createExecutionSession((0, external_ui_utils_js_namespaceObject.taskTitleStr)(reportOptions?.type || 'Act', promptDisplay), {
            onTaskEvent: async (event)=>{
                await activeActionReporter?.(event);
            }
        });
        const runner = session.getRunner();
        let replanCount = 0;
        const yamlFlow = [];
        const replanningCycleLimit = replanningCycleLimitOverride ?? this.replanningCycleLimit;
        if (void 0 === replanningCycleLimit) throw new Error('replanningCycleLimit is required for TaskExecutor.action');
        await this.emitAiActProgress('start', {
            prompt: promptDisplay,
            planLimit: replanningCycleLimit
        });
        const appendFailedPlan = async (errorMsg, planIndex)=>{
            await this.emitAiActProgress('failed', {
                ...planIndex ? {
                    planIndex
                } : {},
                planLimit: replanningCycleLimit,
                error: errorMsg
            });
            return session.appendErrorPlan(errorMsg);
        };
        let errorCountInOnePlanningLoop = 0;
        let outputString;
        let latestPlanResult;
        let latestPlanIndex = 0;
        if (abortSignal?.aborted) return appendFailedPlan(`Task aborted: ${abortSignal.reason || 'abort signal received'}`);
        const referenceImageMessages = await (0, external_common_js_namespaceObject.multimodalPromptToChatMessages)((0, external_common_js_namespaceObject.userPromptToMultimodalPrompt)(userPrompt));
        while(true){
            const planIndex = replanCount + 1;
            latestPlanIndex = planIndex;
            if (abortSignal?.aborted) return appendFailedPlan(`Task aborted: ${abortSignal.reason || 'abort signal received'}`, planIndex);
            const subGoalStatus = conversationHistory.subGoalsToText() || void 0;
            const memoriesStatus = conversationHistory.memoriesToText() || void 0;
            const result = await session.appendAndRun({
                type: 'Planning',
                subType: 'Plan',
                param: {
                    userInstruction: userPrompt,
                    ...reportOptions?.prompt ? {
                        userInstructionDisplay: reportOptions.prompt
                    } : {},
                    replanningCycleLimit,
                    aiActContext,
                    imagesIncludeCount,
                    deepThink,
                    ...subGoalStatus ? {
                        subGoalStatus
                    } : {},
                    ...memoriesStatus ? {
                        memoriesStatus
                    } : {}
                },
                executor: async (param, executorContext)=>{
                    const { uiContext } = executorContext;
                    (0, utils_namespaceObject.assert)(uiContext, 'uiContext is required for Planning task');
                    const planningUiContext = uiContext;
                    const timing = executorContext.task.timing;
                    await this.emitAiActProgress('plan_thinking', {
                        planIndex,
                        planLimit: replanningCycleLimit,
                        screenshot: planningUiContext.screenshot
                    });
                    const actionSpace = this.getActionSpace();
                    debug('actionSpace for this interface is:', actionSpace.map((action)=>action.name).join(', '));
                    (0, utils_namespaceObject.assert)(Array.isArray(actionSpace), 'actionSpace must be an array');
                    if (0 === actionSpace.length) console.warn(`ActionSpace for ${this.interface.interfaceType} is empty. This may lead to unexpected behavior.`);
                    const planImpl = 'custom' === planningModel.adapter.planning.kind ? planningModel.adapter.planning.planFn : planning_index_js_namespaceObject.genericXmlPlan;
                    let planResult;
                    try {
                        (0, external_task_timing_js_namespaceObject.setTimingFieldOnce)(timing, 'callAiStart');
                        planResult = await planImpl(param.userInstruction, {
                            context: planningUiContext,
                            actionContext: param.aiActContext,
                            actionSpace,
                            modelRuntime: planningModel,
                            conversationHistory,
                            includeLocateInPlanning,
                            imagesIncludeCount,
                            deepThink,
                            referenceImageMessages,
                            abortSignal
                        });
                    } catch (planError) {
                        if (planError instanceof index_js_namespaceObject.AIResponseParseError) {
                            executorContext.task.usage = (0, external_usage_intent_js_namespaceObject.withUsageIntent)(planError.usage, 'planning');
                            executorContext.task.log = {
                                ...executorContext.task.log || {},
                                rawResponse: planError.rawResponse,
                                rawChoiceMessage: planError.rawChoiceMessage
                            };
                        }
                        await this.emitAiActProgress('plan_failed', {
                            planIndex,
                            planLimit: replanningCycleLimit,
                            error: (0, external_progress_index_js_namespaceObject.errorMessageForAiAct)(planError)
                        });
                        throw planError;
                    } finally{
                        (0, external_task_timing_js_namespaceObject.setTimingFieldOnce)(timing, 'callAiEnd');
                    }
                    debug('planResult', JSON.stringify(planResult, null, 2));
                    const { actions, thought, log, memory, error, usage, rawResponse, rawChoiceMessage, reasoning_content, finalizeSuccess, finalizeMessage, updateSubGoals, markFinishedIndexes } = planResult;
                    outputString = finalizeMessage;
                    executorContext.task.log = {
                        ...executorContext.task.log || {},
                        rawResponse,
                        rawChoiceMessage
                    };
                    executorContext.task.usage = (0, external_usage_intent_js_namespaceObject.withUsageIntent)(usage, 'planning');
                    executorContext.task.reasoning_content = reasoning_content;
                    executorContext.task.output = {
                        actions: actions || [],
                        log,
                        thought,
                        memory,
                        yamlFlow: planResult.yamlFlow,
                        output: finalizeMessage,
                        shouldContinuePlanning: planResult.shouldContinuePlanning,
                        updateSubGoals,
                        markFinishedIndexes
                    };
                    executorContext.uiContext = planningUiContext;
                    if (log || thought) await this.emitAiActProgress('plan_planned', {
                        planIndex,
                        planLimit: replanningCycleLimit,
                        ...log ? {
                            log
                        } : {},
                        ...thought ? {
                            thought
                        } : {}
                    });
                    if (error) {
                        const errorMessage = `Failed to continue: ${error}\n${log || ''}`;
                        await this.emitAiActProgress('plan_failed', {
                            planIndex,
                            planLimit: replanningCycleLimit,
                            error: errorMessage
                        });
                    }
                    (0, utils_namespaceObject.assert)(!error, `Failed to continue: ${error}\n${log || ''}`);
                    if (false === finalizeSuccess) {
                        const errorMessage = `Task failed: ${finalizeMessage || 'No error message provided'}\n${log || ''}`;
                        await this.emitAiActProgress('plan_failed', {
                            planIndex,
                            planLimit: replanningCycleLimit,
                            error: errorMessage
                        });
                        (0, utils_namespaceObject.assert)(false, errorMessage);
                    }
                    return {
                        cache: {
                            hit: false
                        }
                    };
                }
            }, {
                allowWhenError: true
            });
            const planResult = result?.output;
            latestPlanResult = planResult;
            let plans = planResult?.actions || [];
            const planYamlFlow = planResult?.yamlFlow || [];
            if (void 0 !== actionBudget) {
                const remaining = actionBudget - totalActionsExecuted;
                if (remaining <= 0) {
                    debug('maxActions budget exhausted before executing plans, stopping aiAct', {
                        actionBudget,
                        totalActionsExecuted
                    });
                    break;
                }
                if (plans.length > remaining) {
                    debug('truncating planned actions to maxActions budget', {
                        planned: plans.length,
                        remaining,
                        actionBudget
                    });
                    plans = plans.slice(0, remaining);
                }
            }
            yamlFlow.push(...planYamlFlow.slice(0, plans.length));
            let executables;
            try {
                executables = await this.convertPlanToExecutable(plans, planningModel, defaultModel, {
                    cacheable,
                    deepLocate,
                    abortSignal
                });
            } catch (error) {
                return appendFailedPlan(`Error converting plans to executable tasks: ${(0, external_progress_index_js_namespaceObject.errorMessageForAiAct)(error)}, plans: ${JSON.stringify(plans)}`, planIndex);
            }
            if (conversationHistory.pendingFeedbackMessage) console.warn('unconsumed pending feedback message detected, this may lead to unexpected planning result:', conversationHistory.pendingFeedbackMessage);
            const initialTimeString = await this.getTimeString();
            const taskCountBeforeRun = runner.tasks.length;
            activeActionReporter = (0, external_progress_index_js_namespaceObject.createAiActActionReporter)(planIndex, replanningCycleLimit, (phase, data)=>this.emitAiActProgress(phase, data));
            try {
                await session.appendAndRun(executables.tasks);
                totalActionsExecuted += plans.length;
                this.setPendingFeedbackMessage(conversationHistory, initialTimeString, this.collectPlanningFeedback(runner.tasks.slice(taskCountBeforeRun)));
            } catch (error) {
                errorCountInOnePlanningLoop++;
                totalActionsExecuted += plans.length;
                const timeString = await this.getTimeString();
                this.setPendingFeedbackMessage(conversationHistory, timeString, `Error executing running tasks: ${error?.message || String(error)}`);
                debug('error when executing running tasks, but continue to run if it is not too many errors:', error instanceof Error ? error.message : String(error), 'current error count in one planning loop:', errorCountInOnePlanningLoop);
            } finally{
                activeActionReporter = void 0;
            }
            if (errorCountInOnePlanningLoop > maxErrorCountAllowedInOnePlanningLoop) return appendFailedPlan('Too many errors in one planning loop', planIndex);
            if (abortSignal?.aborted) return appendFailedPlan(`Task aborted: ${abortSignal.reason || 'abort signal received'}`, planIndex);
            if (void 0 !== actionBudget && totalActionsExecuted >= actionBudget) {
                debug('maxActions reached, skipping further replanning', {
                    actionBudget,
                    totalActionsExecuted
                });
                break;
            }
            if (!planResult?.shouldContinuePlanning) break;
            this.invalidateFailedCacheHitLocates(runner, taskCountBeforeRun);
            ++replanCount;
            if (replanCount > replanningCycleLimit) {
                const errorMsg = `Replanned ${replanningCycleLimit} times, exceeding the limit. Please configure a larger value for replanningCycleLimit (or use MIDSCENE_REPLANNING_CYCLE_LIMIT) to handle more complex tasks.`;
                return appendFailedPlan(errorMsg, planIndex);
            }
            if (!conversationHistory.pendingFeedbackMessage) {
                const timeString = await this.getTimeString();
                conversationHistory.pendingFeedbackMessage = `Time: ${timeString}, I have finished the action previously planned.`;
            }
        }
        await this.emitAiActProgress('complete', {
            planIndex: latestPlanIndex,
            planLimit: replanningCycleLimit,
            ...outputString ?? latestPlanResult?.output ? {
                output: outputString ?? latestPlanResult?.output
            } : {},
            ...latestPlanResult?.log ? {
                log: latestPlanResult.log
            } : {},
            ...latestPlanResult?.thought ? {
                thought: latestPlanResult.thought
            } : {}
        });
        return {
            output: {
                yamlFlow,
                output: outputString
            },
            runner
        };
    }
    createTypeQueryTask(type, demand, modelRuntime, opt, multimodalPrompt, executionOptions) {
        const queryTask = {
            type: 'Insight',
            subType: type,
            param: {
                domIncluded: opt?.domIncluded,
                dataDemand: multimodalPrompt ? {
                    demand,
                    multimodalPrompt
                } : demand
            },
            executor: async (param, taskContext)=>{
                const { task } = taskContext;
                let queryDump;
                const applyDump = (dump)=>{
                    queryDump = dump;
                    task.log = {
                        dump,
                        rawResponse: dump.taskInfo?.rawResponse,
                        rawChoiceMessage: dump.taskInfo?.rawChoiceMessage,
                        searchAreaRawChoiceMessage: dump.taskInfo?.searchAreaRawChoiceMessage
                    };
                    task.usage = (0, external_usage_intent_js_namespaceObject.withUsageIntent)(dump.taskInfo?.usage, 'insight');
                    if (dump.taskInfo?.reasoning_content) task.reasoning_content = dump.taskInfo.reasoning_content;
                };
                const uiContext = taskContext.uiContext;
                (0, utils_namespaceObject.assert)(uiContext, 'uiContext is required for Query task');
                const ifTypeRestricted = 'Query' !== type;
                let demandInput = demand;
                let keyOfResult = 'result';
                if (ifTypeRestricted && ('Assert' === type || 'WaitFor' === type)) {
                    keyOfResult = 'StatementIsTruthy';
                    demandInput = {
                        [keyOfResult]: (0, extraction_js_namespaceObject.buildTypeQueryDemandValue)(type, demand)
                    };
                } else if (ifTypeRestricted) {
                    keyOfResult = type;
                    demandInput = {
                        [keyOfResult]: (0, extraction_js_namespaceObject.buildTypeQueryDemandValue)(type, demand)
                    };
                }
                let extractResult;
                let extraPageDescription = '';
                if (opt?.domIncluded && this.interface.getElementsNodeTree) {
                    debug('appending tree info for page');
                    const tree = await this.interface.getElementsNodeTree();
                    extraPageDescription = await (0, extractor_namespaceObject.descriptionOfTree)(tree, 200, false, opt?.domIncluded === 'visible-only');
                }
                try {
                    extractResult = await this.service.extract(demandInput, modelRuntime, opt, extraPageDescription, multimodalPrompt, uiContext, executionOptions);
                } catch (error) {
                    if (error instanceof external_types_js_namespaceObject.ServiceError) applyDump(error.dump);
                    throw error;
                } finally{
                    recordAndReleaseScreenshotSequence(task, uiContext);
                }
                const { data, thought, dump } = extractResult;
                applyDump(dump);
                let outputResult = data;
                if (ifTypeRestricted) if ('string' == typeof data) outputResult = data;
                else if ('WaitFor' === type) outputResult = null == data ? false : data[keyOfResult];
                else if (null == data) outputResult = null;
                else if (data?.[keyOfResult] !== void 0) outputResult = data[keyOfResult];
                else if (data?.result !== void 0) outputResult = data.result;
                else (0, utils_namespaceObject.assert)(false, 'No result in query data');
                if ('Assert' === type && !outputResult) {
                    task.thought = thought;
                    throw new Error(`Assertion failed: ${thought}`);
                }
                return {
                    output: outputResult,
                    log: queryDump,
                    thought
                };
            }
        };
        return queryTask;
    }
    async createTypeQueryExecution(type, demand, modelRuntime, opt, multimodalPrompt, executionOptions) {
        const session = this.createExecutionSession((0, external_ui_utils_js_namespaceObject.taskTitleStr)(type, 'string' == typeof demand ? demand : JSON.stringify(demand)), executionOptions?.uiContext ? {
            uiContext: executionOptions.uiContext
        } : void 0);
        const queryTask = await this.createTypeQueryTask(type, demand, modelRuntime, opt, multimodalPrompt, executionOptions);
        const runner = session.getRunner();
        const result = await session.appendAndRun(queryTask);
        if (!result) throw new Error('result of taskExecutor.flush() is undefined in function createTypeQueryTask');
        const { output, thought } = result;
        return {
            output,
            thought,
            runner
        };
    }
    async waitFor(assertion, opt, modelRuntime) {
        const { textPrompt, multimodalPrompt } = (0, external_utils_js_namespaceObject.parsePrompt)(assertion);
        const description = `waitFor: ${textPrompt}`;
        const session = this.createExecutionSession((0, external_ui_utils_js_namespaceObject.taskTitleStr)('WaitFor', description));
        const runner = session.getRunner();
        const { timeoutMs, checkIntervalMs, domIncluded, screenshotIncluded, ...restOpt } = opt;
        const serviceExtractOpt = {
            domIncluded,
            screenshotIncluded,
            ...restOpt
        };
        (0, utils_namespaceObject.assert)(assertion, 'No assertion for waitFor');
        (0, utils_namespaceObject.assert)(timeoutMs, 'No timeoutMs for waitFor');
        (0, utils_namespaceObject.assert)(checkIntervalMs, 'No checkIntervalMs for waitFor');
        (0, utils_namespaceObject.assert)(checkIntervalMs <= timeoutMs, `wrong config for waitFor: checkIntervalMs must be less than timeoutMs, config: {checkIntervalMs: ${checkIntervalMs}, timeoutMs: ${timeoutMs}}`);
        const overallStartTime = Date.now();
        let lastCheckStart = overallStartTime;
        let errorThought = '';
        while(lastCheckStart - overallStartTime <= timeoutMs){
            const currentCheckStart = Date.now();
            lastCheckStart = currentCheckStart;
            const queryTask = await this.createTypeQueryTask('WaitFor', textPrompt, modelRuntime, serviceExtractOpt, multimodalPrompt);
            const result = await session.appendAndRun(queryTask);
            if (result?.output) return {
                output: void 0,
                runner
            };
            errorThought = result?.thought || !result && `No result from assertion: ${textPrompt}` || `unknown error when waiting for assertion: ${textPrompt}`;
            const now = Date.now();
            if (now - currentCheckStart < checkIntervalMs) {
                const elapsed = now - currentCheckStart;
                const timeRemaining = checkIntervalMs - elapsed;
                const thought = `Check interval is ${checkIntervalMs}ms, ${elapsed}ms elapsed since last check, sleeping for ${timeRemaining}ms`;
                const { tasks: sleepTasks } = await this.convertPlanToExecutable([
                    {
                        type: 'Sleep',
                        param: {
                            timeMs: timeRemaining
                        },
                        thought
                    }
                ], modelRuntime, modelRuntime);
                if (sleepTasks[0]) await session.appendAndRun(sleepTasks[0]);
            }
        }
        return session.appendErrorPlan(`waitFor timeout: ${errorThought}`);
    }
    constructor(interfaceInstance, service, opts){
        _define_property(this, "interface", void 0);
        _define_property(this, "service", void 0);
        _define_property(this, "taskCache", void 0);
        _define_property(this, "providedActionSpace", void 0);
        _define_property(this, "taskBuilder", void 0);
        _define_property(this, "onTaskStartCallback", void 0);
        _define_property(this, "hooks", void 0);
        _define_property(this, "replanningCycleLimit", void 0);
        _define_property(this, "waitAfterAction", void 0);
        _define_property(this, "useDeviceTime", void 0);
        this.interface = interfaceInstance;
        this.service = service;
        this.taskCache = opts.taskCache;
        this.onTaskStartCallback = opts?.onTaskStart;
        this.replanningCycleLimit = opts.replanningCycleLimit;
        this.waitAfterAction = opts.waitAfterAction;
        this.useDeviceTime = opts.useDeviceTime;
        this.hooks = opts.hooks;
        this.providedActionSpace = opts.actionSpace;
        this.taskBuilder = new external_task_builder_js_namespaceObject.TaskBuilder({
            interfaceInstance,
            service,
            taskCache: opts.taskCache,
            actionSpace: this.getActionSpace(),
            waitAfterAction: opts.waitAfterAction
        });
    }
}
function recordAndReleaseScreenshotSequence(task, uiContext) {
    const frames = uiContext?.screenshotSequence;
    if (frames && frames.length > 1) {
        const recorderItems = [];
        for(let i = 0; i < frames.length - 1; i++){
            const frame = frames[i];
            recorderItems.push({
                type: 'screenshot',
                ts: frame.capturedAt,
                screenshot: frame,
                description: `Observed frame ${i + 1}/${frames.length}`,
                timing: 'observed-frame'
            });
        }
        task.recorder = task.recorder ? [
            ...recorderItems,
            ...task.recorder
        ] : recorderItems;
    }
    if (uiContext?.screenshotSequence) uiContext.screenshotSequence = void 0;
}
async function withFileChooser(interfaceInstance, fileChooserAccept, action) {
    if (!fileChooserAccept?.length) return action();
    if (!interfaceInstance.registerFileChooserListener) throw new Error(`File upload is not supported on ${interfaceInstance.interfaceType}`);
    const handler = async (chooser)=>{
        await chooser.accept(fileChooserAccept);
    };
    const { dispose, getError } = await interfaceInstance.registerFileChooserListener(handler);
    try {
        const result = await action();
        const error = await getError();
        if (error) throw error;
        return result;
    } finally{
        dispose();
    }
}
exports.TaskExecutionError = __webpack_exports__.TaskExecutionError;
exports.TaskExecutor = __webpack_exports__.TaskExecutor;
exports.locatePlanForLocate = __webpack_exports__.locatePlanForLocate;
exports.recordAndReleaseScreenshotSequence = __webpack_exports__.recordAndReleaseScreenshotSequence;
exports.withFileChooser = __webpack_exports__.withFileChooser;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "TaskExecutionError",
    "TaskExecutor",
    "locatePlanForLocate",
    "recordAndReleaseScreenshotSequence",
    "withFileChooser"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=tasks.js.map