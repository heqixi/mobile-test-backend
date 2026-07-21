import { userPromptToString } from "../../../common.mjs";
import { ScreenshotItem } from "../../../screenshot-item.mjs";
import { AIResponseParseError, callAIWithStringResponse } from "../../service-caller/index.mjs";
import { prepareModelImage } from "../image-preprocess.mjs";
import { normalizePlanningActionLocateFields } from "./locate-normalization.mjs";
function appendHighPriorityKnowledge(systemPrompt, actionContext) {
    return systemPrompt + (actionContext ? `<high_priority_knowledge>${actionContext}</high_priority_knowledge>\n` : '');
}
function buildCustomPlanningMessages(input, config) {
    const { options, userInstructionText } = input;
    const { conversationHistory, context, actionContext } = options;
    const systemPrompt = appendHighPriorityKnowledge(config.buildSystemPrompt(), actionContext);
    const userInstruction = config.buildUserInstruction ? config.buildUserInstruction(userInstructionText) : userInstructionText;
    if (conversationHistory.pendingFeedbackMessage) {
        conversationHistory.append({
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `${conversationHistory.pendingFeedbackMessage}. The previous action has been executed, here is the latest screenshot. Please continue according to the instruction.`
                }
            ]
        });
        conversationHistory.resetPendingFeedbackMessageIfExists();
    }
    conversationHistory.append({
        role: 'user',
        content: [
            {
                type: 'image_url',
                image_url: {
                    url: context.screenshot.base64
                }
            }
        ]
    });
    if ('system-message' === config.systemPromptPlacement) return [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: userInstruction
                }
            ]
        },
        ...options.referenceImageMessages ?? [],
        ...conversationHistory.snapshot(config.historyImageLimit)
    ];
    return [
        {
            role: 'user',
            content: `${systemPrompt}${userInstruction}`
        },
        ...options.referenceImageMessages ?? [],
        ...conversationHistory.snapshot(config.historyImageLimit)
    ];
}
async function runCustomPlanning(userInstruction, options, config) {
    const { context } = options;
    const preparedImage = await prepareModelImage({
        imageBase64: context.screenshot.base64,
        width: context.shotSize.width,
        height: context.shotSize.height,
        policy: options.modelRuntime.adapter.imagePreprocess
    });
    const preparedOptions = {
        ...options,
        context: {
            ...context,
            screenshot: ScreenshotItem.create(preparedImage.imageBase64, context.screenshot.capturedAt),
            shotSize: preparedImage.preparedSize
        }
    };
    const input = {
        userInstruction,
        userInstructionText: userPromptToString(userInstruction),
        options: preparedOptions,
        coordinateSystem: config.coordinateSystem
    };
    const messages = buildCustomPlanningMessages(input, config.messages);
    const { content, usage, rawChoiceMessage } = await callAIWithStringResponse(messages, preparedOptions.modelRuntime, {
        abortSignal: preparedOptions.abortSignal,
        requiresOriginalImageDetail: preparedOptions.includeLocateInPlanning
    });
    let parsed;
    let actions;
    let shouldContinuePlanning;
    try {
        parsed = config.parseResponse(content, input);
        actions = config.transformActions(parsed, input);
        normalizePlanningActionLocateFields(actions, {
            actionSpace: preparedOptions.actionSpace,
            includeLocateInPlanning: preparedOptions.includeLocateInPlanning,
            locateResultAdapter: config.coordinateNormalizer,
            locateResultContext: {
                preparedSize: preparedImage.preparedSize,
                contentSize: preparedImage.contentSize
            }
        });
        shouldContinuePlanning = config.shouldContinuePlanning(parsed, actions);
    } catch (parseError) {
        const errorMessage = `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
        throw new AIResponseParseError(errorMessage, JSON.stringify(content, void 0, 2), usage, rawChoiceMessage);
    }
    const assistantContent = config.messages.buildAssistantContent?.(parsed, content, input);
    if (assistantContent) options.conversationHistory.append({
        role: 'assistant',
        content: assistantContent
    });
    return {
        actions,
        log: config.buildResponseLog(parsed, content),
        usage,
        shouldContinuePlanning,
        rawResponse: JSON.stringify(content, void 0, 2),
        rawChoiceMessage
    };
}
export { buildCustomPlanningMessages, runCustomPlanning };

//# sourceMappingURL=custom-planning.mjs.map