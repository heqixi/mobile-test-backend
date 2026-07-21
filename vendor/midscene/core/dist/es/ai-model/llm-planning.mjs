import { buildYamlFlowFromPlans, userPromptToString } from "../common.mjs";
import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
import { planningModelFamilyRequiredForLocateMessage } from "./errors.mjs";
import { systemPromptToTaskPlanning } from "./prompt/llm-planning.mjs";
import { extractXMLTag, parseMarkFinishedIndexes, parseSubGoalsFromXML } from "./prompt/util.mjs";
import { AIResponseParseError, callAI } from "./service-caller/index.mjs";
import { callAiAndParseWithRetry } from "./service-caller/semantic-retry.mjs";
import { prepareModelImage } from "./workflows/image-preprocess.mjs";
import { normalizePlanningActionLocateFields } from "./workflows/planning/locate-normalization.mjs";
const debug = getDebug('planning');
const warnLog = getDebug('planning', {
    console: true
});
const noPreviousActionsText = 'No previous actions have been executed in this aiAct execution yet. If the instruction asks for actions, choose the first action to execute.';
function parseXMLPlanningResponse(xmlString, jsonParser) {
    const thought = extractXMLTag(xmlString, 'planning');
    const memory = extractXMLTag(xmlString, 'memory');
    const log = extractXMLTag(xmlString, 'log') || '';
    const error = extractXMLTag(xmlString, 'error');
    const actionType = extractXMLTag(xmlString, 'action-type');
    const actionParamStr = extractXMLTag(xmlString, 'action-param-json');
    const completeGoalRegex = /<complete\s+success="(true|false)">([\s\S]*?)<\/complete>/i;
    const completeGoalMatch = xmlString.match(completeGoalRegex);
    let finalizeMessage;
    let finalizeSuccess;
    if (completeGoalMatch) {
        finalizeSuccess = 'true' === completeGoalMatch[1];
        finalizeMessage = completeGoalMatch[2]?.trim() || void 0;
    }
    const updatePlanContent = extractXMLTag(xmlString, 'update-plan-content');
    const markSubGoalDone = extractXMLTag(xmlString, 'mark-sub-goal-done');
    const updateSubGoals = updatePlanContent ? parseSubGoalsFromXML(updatePlanContent) : void 0;
    const markFinishedIndexes = markSubGoalDone ? parseMarkFinishedIndexes(markSubGoalDone) : void 0;
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
    return callAiAndParseWithRetry({
        callAi: ()=>callAI(messages, modelRuntime, {
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
            const yamlFlow = buildYamlFlowFromPlans(actions, actionSpace);
            normalizePlanningActionLocateFields(actions, {
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
            return new AIResponseParseError(`XML parse error: ${errorMessage}`, response.content, response.usage, response.rawChoiceMessage, response.reasoning_content);
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
    if (opts.includeLocateInPlanning && !modelRuntime.config.modelFamily) throw new Error(planningModelFamilyRequiredForLocateMessage(modelRuntime.config.slot));
    const locateResultAdapter = modelRuntime.config.modelFamily && 'standard' === adapter.locate.kind ? adapter.locate.resultAdapter : void 0;
    const includeSubGoals = true === opts.deepThink;
    const systemPrompt = await systemPromptToTaskPlanning({
        actionSpace: opts.actionSpace,
        locatePromptSpec: locateResultAdapter?.promptSpec,
        includeLocateInPlanning: opts.includeLocateInPlanning,
        includeThought: true,
        includeSubGoals
    });
    const preparedImage = await prepareModelImage({
        imageBase64: screenshotBase64,
        width: shotSize.width,
        height: shotSize.height,
        policy: adapter.imagePreprocess
    });
    const imagePayload = preparedImage.imageBase64;
    const userInstructionText = userPromptToString(userInstruction);
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
    assert(planFromAI, "can't get plans from AI");
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
export { parseXMLPlanningResponse, plan };

//# sourceMappingURL=llm-planning.mjs.map