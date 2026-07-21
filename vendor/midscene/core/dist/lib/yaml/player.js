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
    ScriptPlayer: ()=>ScriptPlayer
});
const external_node_fs_namespaceObject = require("node:fs");
const external_node_path_namespaceObject = require("node:path");
const utils_namespaceObject = require("@midscene/shared/utils");
const external_zod_namespaceObject = require("zod");
const common_namespaceObject = require("@midscene/shared/common");
const logger_namespaceObject = require("@midscene/shared/logger");
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
const debug = (0, logger_namespaceObject.getDebug)('yaml-player');
const aiTaskHandlerMap = {
    aiQuery: 'aiQuery',
    aiNumber: 'aiNumber',
    aiString: 'aiString',
    aiBoolean: 'aiBoolean',
    aiAsk: 'aiAsk',
    aiLocate: 'aiLocate'
};
const isStringParamSchema = (schema)=>{
    if (!schema) return false;
    const schemaDef = schema?._def;
    if (!schemaDef?.typeName) return false;
    switch(schemaDef.typeName){
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodString:
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodEnum:
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodNativeEnum:
            return true;
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodLiteral:
            return 'string' == typeof schemaDef.value;
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodOptional:
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodNullable:
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodDefault:
            return isStringParamSchema(schemaDef.innerType);
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodEffects:
            return isStringParamSchema(schemaDef.schema);
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodPipeline:
            return isStringParamSchema(schemaDef.out);
        case external_zod_namespaceObject.z.ZodFirstPartyTypeKind.ZodUnion:
            {
                const options = schemaDef.options;
                return Array.isArray(options) ? options.every((option)=>isStringParamSchema(option)) : false;
            }
        default:
            return false;
    }
};
const buildShortcutActionParam = (actionName, interfaceAlias, value)=>{
    if ('Launch' === actionName || 'launch' === interfaceAlias) return {
        uri: value
    };
    if ('Terminate' === actionName || 'terminate' === interfaceAlias) return {
        uri: value
    };
    if ('RunAdbShell' === actionName || 'runAdbShell' === interfaceAlias || 'RunHdcShell' === actionName || 'runHdcShell' === interfaceAlias) return {
        command: value
    };
};
class ScriptPlayer {
    setResult(key, value) {
        const keyToUse = key || this.unnamedResultIndex++;
        if (this.result[keyToUse]) console.warn(`result key ${keyToUse} already exists, will overwrite`);
        this.result[keyToUse] = value;
        return this.flushResult();
    }
    setPlayerStatus(status, error) {
        this.status = status;
        this.errorInSetup = error;
    }
    notifyCurrentTaskStatusChange(taskIndex) {
        const taskIndexToNotify = 'number' == typeof taskIndex ? taskIndex : this.currentTaskIndex;
        if ('number' != typeof taskIndexToNotify) return;
        const taskStatus = this.taskStatusList[taskIndexToNotify];
        if (this.onTaskStatusChange) this.onTaskStatusChange(taskStatus);
    }
    async setTaskStatus(index, statusValue, error) {
        this.taskStatusList[index].status = statusValue;
        if (error) this.taskStatusList[index].error = error;
        this.notifyCurrentTaskStatusChange(index);
    }
    setTaskIndex(taskIndex) {
        this.currentTaskIndex = taskIndex;
    }
    flushResult() {
        if (this.output) {
            const output = (0, external_node_path_namespaceObject.resolve)(process.cwd(), this.output);
            const outputDir = (0, external_node_path_namespaceObject.dirname)(output);
            if (!(0, external_node_fs_namespaceObject.existsSync)(outputDir)) (0, external_node_fs_namespaceObject.mkdirSync)(outputDir, {
                recursive: true
            });
            (0, external_node_fs_namespaceObject.writeFileSync)(output, JSON.stringify(this.result || {}, void 0, 2));
        }
    }
    flushUnstableLogContent() {
        if (this.unstableLogContent) {
            const content = this.interfaceAgent?._unstableLogContent();
            const filePath = (0, external_node_path_namespaceObject.resolve)(process.cwd(), this.unstableLogContent);
            const outputDir = (0, external_node_path_namespaceObject.dirname)(filePath);
            if (!(0, external_node_fs_namespaceObject.existsSync)(outputDir)) (0, external_node_fs_namespaceObject.mkdirSync)(outputDir, {
                recursive: true
            });
            (0, external_node_fs_namespaceObject.writeFileSync)(filePath, JSON.stringify(content, null, 2));
        }
    }
    async playTask(taskStatus, agent) {
        const { flow } = taskStatus;
        (0, utils_namespaceObject.assert)(flow, 'missing flow in task');
        for(const flowItemIndex in flow){
            const currentStep = Number.parseInt(flowItemIndex, 10);
            taskStatus.currentStep = currentStep;
            const flowItem = flow[flowItemIndex];
            const flowItemRecord = flowItem;
            const executionCountBeforeStep = agent.dump?.executions?.length ?? 0;
            this.failedReportExecutionInCurrentStep = false;
            try {
                await this.playFlowItem(agent, flowItem, flowItemRecord, flowItemIndex);
            } catch (error) {
                this.failedReportExecutionInCurrentStep = this.hasFailedReportExecutionSince(agent, executionCountBeforeStep);
                throw error;
            }
        }
        this.reportFile = agent.reportFile;
        await this.flushUnstableLogContent();
    }
    hasFailedReportExecutionSince(agent, executionCountBefore) {
        return (agent.dump?.executions ?? []).slice(executionCountBefore).some((execution)=>execution.tasks.some((task)=>'failed' === task.status || Boolean(task.error || task.errorMessage)));
    }
    async playFlowItem(agent, flowItem, flowItemRecord, flowItemIndex) {
        if ('Finalize' in flowItemRecord) return;
        debug(`playing step ${flowItemIndex}, flowItem=${JSON.stringify(flowItem)}`);
        const simpleAIKey = Object.keys(aiTaskHandlerMap).find((key)=>Object.prototype.hasOwnProperty.call(flowItemRecord, key));
        if ('aiAct' in flowItem || 'aiAction' in flowItem || 'ai' in flowItem) {
            const actionTask = flowItem;
            const { aiAct, aiAction, ai, instruction, ...actionOptions } = actionTask;
            const actionPrompt = aiAct ?? aiAction ?? ai;
            let promptForAI;
            if ('string' == typeof instruction && instruction) promptForAI = instruction;
            else if (instruction && 'object' == typeof instruction && 'string' == typeof instruction.prompt && instruction.prompt) promptForAI = instruction;
            else if (actionPrompt && 'object' == typeof actionPrompt && 'string' == typeof actionPrompt.prompt && actionPrompt.prompt) promptForAI = actionPrompt;
            else if ('string' == typeof actionPrompt && actionPrompt) promptForAI = actionPrompt;
            (0, utils_namespaceObject.assert)(promptForAI, 'missing prompt for ai (aiAct)');
            await agent.aiAct(promptForAI, actionOptions);
        } else if ('runGherkinScenario' in flowItem) {
            const gherkinScenarioTask = flowItem;
            const { runGherkinScenario } = gherkinScenarioTask;
            (0, utils_namespaceObject.assert)(runGherkinScenario, 'missing scenario for runGherkinScenario');
            await agent.runGherkinScenario(runGherkinScenario, {
                cacheable: false
            });
        } else if ('aiAssert' in flowItem) {
            const assertTask = flowItem;
            const { aiAssert: prompt, errorMessage: msg, name, ...restOpts } = assertTask;
            (0, utils_namespaceObject.assert)(prompt, 'missing prompt for aiAssert');
            (0, utils_namespaceObject.assert)(!Object.prototype.hasOwnProperty.call(assertTask, 'observe'), '`observe` is not supported in YAML aiAssert. Use agent.startObserving() from code instead.');
            const result = await agent.aiAssert(prompt, msg, {
                ...restOpts,
                keepRawResponse: true
            });
            const pass = result?.pass;
            const thought = result?.thought;
            const message = result?.message;
            this.setResult(name, {
                pass,
                thought,
                message
            });
            if (!pass) throw new Error(message);
        } else if (simpleAIKey) {
            const { [simpleAIKey]: prompt, name, ...options } = flowItem;
            (0, utils_namespaceObject.assert)(prompt, `missing prompt for ${simpleAIKey}`);
            (0, utils_namespaceObject.assert)(!Object.prototype.hasOwnProperty.call(flowItem, 'observe'), '`observe` is not supported in YAML flow items. Use agent.startObserving() from code instead.');
            const agentMethod = agent[aiTaskHandlerMap[simpleAIKey]];
            (0, utils_namespaceObject.assert)('function' == typeof agentMethod, `missing agent method for ${simpleAIKey}`);
            const aiResult = await agentMethod.call(agent, prompt, options);
            this.setResult(name, aiResult);
        } else if ('aiWaitFor' in flowItem) {
            const waitForTask = flowItem;
            const { aiWaitFor, timeout, ...restWaitForOpts } = waitForTask;
            const prompt = aiWaitFor;
            (0, utils_namespaceObject.assert)(prompt, 'missing prompt for aiWaitFor');
            const waitForOptions = {
                ...restWaitForOpts,
                ...void 0 !== timeout ? {
                    timeout,
                    timeoutMs: timeout
                } : {}
            };
            await agent.aiWaitFor(prompt, waitForOptions);
        } else if ('sleep' in flowItem) {
            const sleepTask = flowItem;
            const ms = sleepTask.sleep;
            let msNumber = ms;
            if ('string' == typeof ms) msNumber = Number.parseInt(ms, 10);
            (0, utils_namespaceObject.assert)(msNumber && msNumber > 0, `ms for sleep must be greater than 0, but got ${ms}`);
            await new Promise((resolve)=>setTimeout(resolve, msNumber));
        } else if ("javascript" in flowItem) {
            const evaluateJavaScriptTask = flowItem;
            const result = await agent.evaluateJavaScript(evaluateJavaScriptTask.javascript);
            this.setResult(evaluateJavaScriptTask.name, result);
        } else if ('logScreenshot' in flowItem || 'recordToReport' in flowItem) {
            const recordTask = flowItem;
            const title = recordTask.recordToReport ?? recordTask.logScreenshot ?? 'untitled';
            const content = recordTask.content || '';
            await agent.recordToReport(title, {
                content
            });
        } else if ('aiInput' in flowItem) {
            const { aiInput, value: rawValue, ...inputTask } = flowItem;
            let locatePrompt;
            let value;
            if (inputTask.locate) {
                value = aiInput || rawValue;
                locatePrompt = inputTask.locate;
            } else {
                locatePrompt = aiInput || '';
                value = rawValue;
            }
            await agent.callActionInActionSpace('Input', {
                ...inputTask,
                ...void 0 !== value ? {
                    value: String(value)
                } : {},
                ...locatePrompt ? {
                    locate: (0, external_utils_js_namespaceObject.buildDetailedLocateParam)(locatePrompt, inputTask)
                } : {}
            });
        } else if ('aiKeyboardPress' in flowItem) {
            const { aiKeyboardPress, ...keyboardPressTask } = flowItem;
            let locatePrompt;
            let keyName;
            if (keyboardPressTask.locate) {
                keyName = aiKeyboardPress;
                locatePrompt = keyboardPressTask.locate;
            } else if (keyboardPressTask.keyName) {
                keyName = keyboardPressTask.keyName;
                locatePrompt = aiKeyboardPress;
            } else keyName = aiKeyboardPress;
            await agent.callActionInActionSpace('KeyboardPress', {
                ...keyboardPressTask,
                ...keyName ? {
                    keyName
                } : {},
                ...locatePrompt ? {
                    locate: (0, external_utils_js_namespaceObject.buildDetailedLocateParam)(locatePrompt, keyboardPressTask)
                } : {}
            });
        } else if ('aiScroll' in flowItem) {
            const { aiScroll, ...scrollTask } = flowItem;
            const { locate, ...scrollOptions } = scrollTask;
            const locatePrompt = locate ?? aiScroll ?? void 0;
            await agent.aiScroll(locatePrompt, scrollOptions);
        } else if ('aiTap' in flowItem) {
            const { aiTap, prompt, locate, ...tapOptions } = flowItem;
            let locatePrompt;
            let opts = tapOptions;
            const locateObj = locate ?? ('object' == typeof aiTap && null !== aiTap ? aiTap.locate : void 0);
            if ('string' == typeof aiTap && aiTap) locatePrompt = aiTap;
            else if ('object' == typeof locateObj && locateObj?.prompt) {
                const { prompt: lp, ...locateOpts } = locateObj;
                locatePrompt = lp;
                opts = {
                    ...locateOpts,
                    ...tapOptions
                };
            } else locatePrompt = aiTap?.prompt || prompt || locateObj;
            (0, utils_namespaceObject.assert)(locatePrompt, 'missing prompt for aiTap');
            await agent.aiTap(locatePrompt, opts);
        } else {
            const actionSpace = this.actionSpace;
            let locatePromptShortcut;
            let actionParamForMatchedAction;
            const matchedAction = actionSpace.find((action)=>{
                const actionInterfaceAlias = action.interfaceAlias;
                if (actionInterfaceAlias && Object.prototype.hasOwnProperty.call(flowItem, actionInterfaceAlias)) {
                    actionParamForMatchedAction = flowItem[actionInterfaceAlias];
                    if ('string' == typeof actionParamForMatchedAction) locatePromptShortcut = actionParamForMatchedAction;
                    return true;
                }
                const keyOfActionInActionSpace = action.name;
                if (Object.prototype.hasOwnProperty.call(flowItem, keyOfActionInActionSpace)) {
                    actionParamForMatchedAction = flowItem[keyOfActionInActionSpace];
                    if ('string' == typeof actionParamForMatchedAction) locatePromptShortcut = actionParamForMatchedAction;
                    return true;
                }
                return false;
            });
            (0, utils_namespaceObject.assert)(matchedAction, `unknown flowItem in yaml: ${JSON.stringify(flowItem)}`);
            const schemaIsStringParam = isStringParamSchema(matchedAction.paramSchema);
            let stringParamToCall;
            const resultName = flowItem.name;
            const timeout = flowItem.timeout;
            const hasRunAdbShellAlias = Object.prototype.hasOwnProperty.call(flowItem, 'runAdbShell');
            if (hasRunAdbShellAlias && 'string' == typeof actionParamForMatchedAction && 'number' == typeof timeout && 'function' == typeof agent.runAdbShell) {
                const result = await agent.runAdbShell(actionParamForMatchedAction, {
                    timeout
                });
                if (void 0 !== result) this.setResult(resultName, result);
                return;
            }
            const specialActionParamToCall = 'string' == typeof actionParamForMatchedAction ? buildShortcutActionParam(matchedAction.name, matchedAction.interfaceAlias, actionParamForMatchedAction) : void 0;
            if (specialActionParamToCall) {
                debug(`matchedAction: ${matchedAction.name}`, `flowParams: ${JSON.stringify(specialActionParamToCall)}`);
                const result = await agent.callActionInActionSpace(matchedAction.name, specialActionParamToCall);
                if (void 0 !== result) this.setResult(resultName, result);
            } else if ('string' == typeof actionParamForMatchedAction && schemaIsStringParam) {
                if (matchedAction.paramSchema) {
                    const parseResult = matchedAction.paramSchema.safeParse(actionParamForMatchedAction);
                    if (parseResult.success && 'string' == typeof parseResult.data) stringParamToCall = parseResult.data;
                    else if (!parseResult.success) {
                        debug(`parse failed for action ${matchedAction.name} with string param`, parseResult.error);
                        stringParamToCall = actionParamForMatchedAction;
                    }
                } else stringParamToCall = actionParamForMatchedAction;
                if (void 0 !== stringParamToCall) {
                    debug(`matchedAction: ${matchedAction.name}`, `flowParams: ${JSON.stringify(stringParamToCall)}`);
                    const result = await agent.callActionInActionSpace(matchedAction.name, stringParamToCall);
                    const resultName = flowItem.name;
                    if (void 0 !== result) this.setResult(resultName, result);
                }
            } else {
                const sourceForParams = locatePromptShortcut && 'string' == typeof actionParamForMatchedAction ? {
                    ...flowItem,
                    prompt: locatePromptShortcut
                } : 'object' == typeof actionParamForMatchedAction && null !== actionParamForMatchedAction ? actionParamForMatchedAction : flowItem;
                const { locateParam, restParams } = (0, external_utils_js_namespaceObject.buildDetailedLocateParamAndRestParams)(locatePromptShortcut || '', sourceForParams, [
                    matchedAction.name,
                    matchedAction.interfaceAlias || '_never_mind_'
                ]);
                const flowParams = {
                    ...restParams,
                    locate: locateParam
                };
                debug(`matchedAction: ${matchedAction.name}`, `flowParams: ${JSON.stringify(flowParams, null, 2)}`);
                const result = await agent.callActionInActionSpace(matchedAction.name, flowParams);
                const resultName = flowItem.name;
                if (void 0 !== result) this.setResult(resultName, result);
            }
        }
    }
    async run() {
        const { target, web, android, ios, harmony, computer, tasks } = this.script;
        const webEnv = web || target;
        const androidEnv = android;
        const iosEnv = ios;
        const harmonyEnv = harmony;
        const computerEnv = computer;
        const platform = webEnv || androidEnv || iosEnv || harmonyEnv || computerEnv;
        this.setPlayerStatus('running');
        let agent = null;
        let freeFn = [];
        try {
            const { agent: newAgent, freeFn: newFreeFn } = await this.setupAgent(platform);
            this.actionSpace = await newAgent.getActionSpace();
            agent = newAgent;
            const originalOnTaskStartTip = agent.onTaskStartTip;
            agent.onTaskStartTip = (tip)=>{
                if ('running' === this.status) this.agentStatusTip = tip;
                originalOnTaskStartTip?.(tip);
            };
            freeFn = [
                ...newFreeFn || [],
                {
                    name: 'restore-agent-onTaskStartTip',
                    fn: ()=>{
                        if (agent) agent.onTaskStartTip = originalOnTaskStartTip;
                    }
                }
            ];
        } catch (e) {
            this.setPlayerStatus('error', e);
            return;
        }
        this.interfaceAgent = agent;
        let taskIndex = 0;
        this.setPlayerStatus('running');
        let errorFlag = false;
        while(taskIndex < tasks.length){
            const taskStatus = this.taskStatusList[taskIndex];
            this.setTaskStatus(taskIndex, 'running');
            this.setTaskIndex(taskIndex);
            this.failedReportExecutionInCurrentStep = false;
            try {
                await this.playTask(taskStatus, this.interfaceAgent);
                this.setTaskStatus(taskIndex, 'done');
            } catch (e) {
                this.setTaskStatus(taskIndex, 'error', e);
                const recordErrorToReport = agent.recordErrorToReport;
                if (!this.failedReportExecutionInCurrentStep && 'function' == typeof recordErrorToReport) try {
                    await recordErrorToReport.call(agent, `YAML task failed - ${taskStatus.name}`, {
                        error: e,
                        content: `Step ${taskStatus.currentStep ?? 0} failed while running YAML task "${taskStatus.name}".`
                    });
                } catch (reportError) {
                    debug('failed to record yaml error to report', reportError);
                }
                if (taskStatus.continueOnError) ;
                else {
                    this.reportFile = agent.reportFile;
                    errorFlag = true;
                    break;
                }
            }
            this.reportFile = agent?.reportFile;
            taskIndex++;
        }
        if (errorFlag) this.setPlayerStatus('error');
        else this.setPlayerStatus('done');
        this.agentStatusTip = '';
        for (const fn of freeFn)try {
            await fn.fn();
        } catch (e) {}
    }
    constructor(script, setupAgent, onTaskStatusChange, scriptPath){
        _define_property(this, "script", void 0);
        _define_property(this, "setupAgent", void 0);
        _define_property(this, "onTaskStatusChange", void 0);
        _define_property(this, "currentTaskIndex", void 0);
        _define_property(this, "taskStatusList", void 0);
        _define_property(this, "status", void 0);
        _define_property(this, "reportFile", void 0);
        _define_property(this, "result", void 0);
        _define_property(this, "unnamedResultIndex", void 0);
        _define_property(this, "output", void 0);
        _define_property(this, "unstableLogContent", void 0);
        _define_property(this, "errorInSetup", void 0);
        _define_property(this, "interfaceAgent", void 0);
        _define_property(this, "agentStatusTip", void 0);
        _define_property(this, "target", void 0);
        _define_property(this, "actionSpace", void 0);
        _define_property(this, "scriptPath", void 0);
        _define_property(this, "failedReportExecutionInCurrentStep", void 0);
        this.script = script;
        this.setupAgent = setupAgent;
        this.onTaskStatusChange = onTaskStatusChange;
        this.taskStatusList = [];
        this.status = 'init';
        this.unnamedResultIndex = 0;
        this.interfaceAgent = null;
        this.actionSpace = [];
        this.failedReportExecutionInCurrentStep = false;
        this.scriptPath = scriptPath;
        this.result = {};
        const resolvedAiActContext = script.agent?.aiActContext ?? script.agent?.aiActionContext;
        if (void 0 !== resolvedAiActContext && script.agent) {
            if (void 0 === script.agent.aiActContext && void 0 !== script.agent.aiActionContext) console.warn('agent.aiActionContext is deprecated, please use agent.aiActContext instead. The legacy name is still accepted for backward compatibility.');
            script.agent.aiActContext = resolvedAiActContext;
        }
        this.target = script.target || script.web || script.android || script.ios || script.computer || script.config;
        if (utils_namespaceObject.ifInBrowser || utils_namespaceObject.ifInWorker) {
            this.output = void 0;
            debug('output is undefined in browser or worker');
        } else if (this.target?.output) {
            this.output = (0, external_node_path_namespaceObject.resolve)(process.cwd(), this.target.output);
            debug('setting output by config.output', this.output);
        } else {
            const scriptName = this.scriptPath ? (0, external_node_path_namespaceObject.basename)(this.scriptPath, '.yaml').replace(/\.(ya?ml)$/i, '') : "script";
            this.output = (0, external_node_path_namespaceObject.join)((0, common_namespaceObject.getMidsceneRunSubDir)('output'), `${scriptName}-${Date.now()}.json`);
            debug("setting output by script path", this.output);
        }
        if (utils_namespaceObject.ifInBrowser || utils_namespaceObject.ifInWorker) this.unstableLogContent = void 0;
        else if ('string' == typeof this.target?.unstableLogContent) this.unstableLogContent = (0, external_node_path_namespaceObject.resolve)(process.cwd(), this.target.unstableLogContent);
        else if (this.target?.unstableLogContent === true) this.unstableLogContent = (0, external_node_path_namespaceObject.join)((0, common_namespaceObject.getMidsceneRunSubDir)('output'), 'unstableLogContent.json');
        this.taskStatusList = (script.tasks || []).map((task, taskIndex)=>({
                ...task,
                index: taskIndex,
                status: 'init',
                totalSteps: task.flow?.length || 0
            }));
    }
}
exports.ScriptPlayer = __webpack_exports__.ScriptPlayer;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "ScriptPlayer"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=player.js.map