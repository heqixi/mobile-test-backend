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
    parseXMLPlanningResponse: ()=>parseXMLPlanningResponse,
    plan: ()=>plan
});
const external_common_js_namespaceObject = require("../common.js");
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const external_errors_js_namespaceObject = require("./errors.js");
const llm_planning_js_namespaceObject = require("./prompt/llm-planning.js");
const util_js_namespaceObject = require("./prompt/util.js");
const index_js_namespaceObject = require("./service-caller/index.js");
const semantic_retry_js_namespaceObject = require("./service-caller/semantic-retry.js");
const image_preprocess_js_namespaceObject = require("./workflows/image-preprocess.js");
const locate_normalization_js_namespaceObject = require("./workflows/planning/locate-normalization.js");
const debug = (0, logger_namespaceObject.getDebug)('planning');
const warnLog = (0, logger_namespaceObject.getDebug)('planning', {
    console: true
});
const noPreviousActionsText = 'No previous actions have been executed in this aiAct execution yet. If the instruction asks for actions, choose the first action to execute.';
function parseXMLPlanningResponse(xmlString, jsonParser) {
    const thought = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'planning');
    const memory = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'memory');
    const log = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'log') || '';
    const error = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'error');
    const actionType = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'action-type');
    const actionParamStr = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'action-param-json');
    const completeGoalRegex = /<complete\s+success="(true|false)">([\s\S]*?)<\/complete>/i;
    const completeGoalMatch = xmlString.match(completeGoalRegex);
    let finalizeMessage;
    let finalizeSuccess;
    if (completeGoalMatch) {
        finalizeSuccess = 'true' === completeGoalMatch[1];
        finalizeMessage = completeGoalMatch[2]?.trim() || void 0;
    }
    const updatePlanContent = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'update-plan-content');
    const markSubGoalDone = (0, util_js_namespaceObject.extractXMLTag)(xmlString, 'mark-sub-goal-done');
    const updateSubGoals = updatePlanContent ? (0, util_js_namespaceObject.parseSubGoalsFromXML)(updatePlanContent) : void 0;
    const markFinishedIndexes = markSubGoalDone ? (0, util_js_namespaceObject.parseMarkFinishedIndexes)(markSubGoalDone) : void 0;
    let action = null;
    if (actionType && 'null' !== actionType.toLowerCase()) {
        const type = actionType.split('<')[0].trim();
        let param;
        if (actionParamStr) try {
            param = jsonParser(actionParamStr, {
                source: 'planning-action-param',
                preserveStringValueKeys: 'input' === type.toLowerCase() ? [
                    'value'
                ] : void 0
            });
        } catch (e) {
            throw new Error(`Failed to parse action-param-json: ${e}`);
        }
        action = {
            type,
            ...void 0 !== param ? {
                param
            } : {}
        };
    }
    return {
        ...thought ? {
            thought
        } : {},
        ...memory ? {
            memory
        } : {},
        log,
        ...error ? {
            error
        } : {},
        action,
        ...void 0 !== finalizeMessage ? {
            finalizeMessage
        } : {},
        ...void 0 !== finalizeSuccess ? {
            finalizeSuccess
        } : {},
        ...updateSubGoals?.length ? {
            updateSubGoals
        } : {},
        ...markFinishedIndexes?.length ? {
            markFinishedIndexes
        } : {}
    };
}
async function callAndParsePlanningResponse(options) {
    const { messages, modelRuntime, abortSignal, includeLocateInPlanning, actionSpace, locateResultAdapter, locateResultContext } = options;
    return (0, semantic_retry_js_namespaceObject.callAiAndParseWithRetry)({
        callAi: ()=>(0, index_js_namespaceObject.callAI)(messages, modelRuntime, {
                abortSignal,
                requiresOriginalImageDetail: includeLocateInPlanning
            }),
        parseResponse: (response)=>{
            const planFromAI = parseXMLPlanningResponse(response.content, modelRuntime.adapter.jsonParser);
            if (planFromAI.action && void 0 !== planFromAI.finalizeSuccess) {
                warnLog('Planning response included both an action and <complete>; ignoring <complete> output.');
                planFromAI.finalizeMessage = void 0;
                planFromAI.finalizeSuccess = void 0;
            }
            const actions = planFromAI.action ? [
                planFromAI.action
            ] : [];
            const yamlFlow = (0, external_common_js_namespaceObject.buildYamlFlowFromPlans)(actions, actionSpace);
            (0, locate_normalization_js_namespaceObject.normalizePlanningActionLocateFields)(actions, {
                actionSpace,
                includeLocateInPlanning,
                locateResultAdapter,
                locateResultContext
            });
            return {
                response,
                planFromAI,
                actions,
                yamlFlow
            };
        },
        toParseError: (parseError, response)=>{
            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
            return new index_js_namespaceObject.AIResponseParseError(`XML parse error: ${errorMessage}`, response.content, response.usage, response.rawChoiceMessage, response.reasoning_content);
        },
        parseRetryTimes: modelRuntime.config.retryCount,
        parseRetryInterval: modelRuntime.config.retryInterval,
        abortSignal,
        onParseRetry: (parseError)=>{
            debug('retrying plan after response parsing failed: %s', parseError instanceof Error ? parseError.message : String(parseError));
        }
    });
}
async function plan(userInstruction, opts) {
    const { context, conversationHistory } = opts;
    const modelRuntime = opts.modelRuntime;
    const { adapter } = modelRuntime;
    const { shotSize } = context;
    const screenshotBase64 = context.screenshot.base64;
    if (opts.includeLocateInPlanning && !modelRuntime.config.modelFamily) throw new Error((0, external_errors_js_namespaceObject.planningModelFamilyRequiredForLocateMessage)(modelRuntime.config.slot));
    const locateResultAdapter = modelRuntime.config.modelFamily && 'standard' === adapter.locate.kind ? adapter.locate.resultAdapter : void 0;
    const includeSubGoals = true === opts.deepThink;
    const systemPrompt = await (0, llm_planning_js_namespaceObject.systemPromptToTaskPlanning)({
        actionSpace: opts.actionSpace,
        locatePromptSpec: locateResultAdapter?.promptSpec,
        includeLocateInPlanning: opts.includeLocateInPlanning,
        includeThought: true,
        includeSubGoals
    });
    const preparedImage = await (0, image_preprocess_js_namespaceObject.prepareModelImage)({
        imageBase64: screenshotBase64,
        width: shotSize.width,
        height: shotSize.height,
        policy: adapter.imagePreprocess
    });
    const imagePayload = preparedImage.imageBase64;
    const userInstructionText = (0, external_common_js_namespaceObject.userPromptToString)(userInstruction);
    const actionContext = opts.actionContext ? `<high_priority_knowledge>${opts.actionContext}</high_priority_knowledge>\n` : '';
    const referenceImageMessages = opts.referenceImageMessages ?? [];
    const instruction = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `${actionContext}<user_instruction>${userInstructionText}</user_instruction>`
                }
            ]
        },
        ...referenceImageMessages
    ];
    let latestFeedbackMessage;
    const executionProgressText = includeSubGoals ? conversationHistory.subGoalsToText() : conversationHistory.historicalLogsToText();
    const executionProgressSection = executionProgressText ? `\n\n${executionProgressText}` : conversationHistory.pendingFeedbackMessage ? '' : `\n\n${noPreviousActionsText}`;
    const memoriesText = conversationHistory.memoriesToText();
    const memoriesSection = memoriesText ? `\n\n${memoriesText}` : '';
    if (conversationHistory.pendingFeedbackMessage) {
        latestFeedbackMessage = {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `${conversationHistory.pendingFeedbackMessage}. The previous action has been executed, here is the latest screenshot. Please continue according to the instruction.${memoriesSection}${executionProgressSection}`
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imagePayload,
                        detail: 'high'
                    }
                }
            ]
        };
        conversationHistory.resetPendingFeedbackMessageIfExists();
    } else latestFeedbackMessage = {
        role: 'user',
        content: [
            {
                type: 'text',
                text: `This is the current screenshot.${memoriesSection}${executionProgressSection}`
            },
            {
                type: 'image_url',
                image_url: {
                    url: imagePayload,
                    detail: 'high'
                }
            }
        ]
    };
    conversationHistory.append(latestFeedbackMessage);
    conversationHistory.compressHistory(50, 20);
    const historyLog = conversationHistory.snapshot(opts.imagesIncludeCount);
    const msgs = [
        {
            role: 'system',
            content: systemPrompt
        },
        ...instruction,
        ...historyLog
    ];
    const { response: { content: rawResponse, usage, reasoning_content, rawChoiceMessage }, planFromAI, actions, yamlFlow } = await callAndParsePlanningResponse({
        messages: msgs,
        modelRuntime,
        abortSignal: opts.abortSignal,
        includeLocateInPlanning: opts.includeLocateInPlanning,
        actionSpace: opts.actionSpace,
        locateResultAdapter,
        locateResultContext: {
            preparedSize: preparedImage.preparedSize,
            contentSize: preparedImage.contentSize
        }
    });
    let shouldContinuePlanning = true;
    if (void 0 !== planFromAI.finalizeSuccess) {
        debug('task completed via <complete> tag, stop planning');
        shouldContinuePlanning = false;
        if (includeSubGoals) conversationHistory.markAllSubGoalsFinished();
    }
    const returnValue = {
        ...planFromAI,
        actions,
        rawResponse,
        rawChoiceMessage,
        usage,
        reasoning_content,
        yamlFlow,
        shouldContinuePlanning
    };
    (0, utils_namespaceObject.assert)(planFromAI, "can't get plans from AI");
    if (includeSubGoals) {
        if (planFromAI.updateSubGoals?.length) conversationHistory.mergeSubGoals(planFromAI.updateSubGoals);
        if (planFromAI.markFinishedIndexes?.length) for (const index of planFromAI.markFinishedIndexes)conversationHistory.markSubGoalFinished(index);
        if (planFromAI.log) conversationHistory.appendSubGoalLog(planFromAI.log);
    } else if (planFromAI.log) conversationHistory.appendHistoricalLog(planFromAI.log);
    if (planFromAI.memory) conversationHistory.appendMemory(planFromAI.memory);
    conversationHistory.append({
        role: 'assistant',
        content: [
            {
                type: 'text',
                text: rawResponse
            }
        ]
    });
    return returnValue;
}
exports.parseXMLPlanningResponse = __webpack_exports__.parseXMLPlanningResponse;
exports.plan = __webpack_exports__.plan;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "parseXMLPlanningResponse",
    "plan"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=llm-planning.js.map