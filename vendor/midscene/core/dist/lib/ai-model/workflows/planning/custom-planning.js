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
    runCustomPlanning: ()=>runCustomPlanning,
    buildCustomPlanningMessages: ()=>buildCustomPlanningMessages
});
const external_common_js_namespaceObject = require("../../../common.js");
const external_screenshot_item_js_namespaceObject = require("../../../screenshot-item.js");
const index_js_namespaceObject = require("../../service-caller/index.js");
const external_image_preprocess_js_namespaceObject = require("../image-preprocess.js");
const external_locate_normalization_js_namespaceObject = require("./locate-normalization.js");
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
    const preparedImage = await (0, external_image_preprocess_js_namespaceObject.prepareModelImage)({
        imageBase64: context.screenshot.base64,
        width: context.shotSize.width,
        height: context.shotSize.height,
        policy: options.modelRuntime.adapter.imagePreprocess
    });
    const preparedOptions = {
        ...options,
        context: {
            ...context,
            screenshot: external_screenshot_item_js_namespaceObject.ScreenshotItem.create(preparedImage.imageBase64, context.screenshot.capturedAt),
            shotSize: preparedImage.preparedSize
        }
    };
    const input = {
        userInstruction,
        userInstructionText: (0, external_common_js_namespaceObject.userPromptToString)(userInstruction),
        options: preparedOptions,
        coordinateSystem: config.coordinateSystem
    };
    const messages = buildCustomPlanningMessages(input, config.messages);
    const { content, usage, rawChoiceMessage } = await (0, index_js_namespaceObject.callAIWithStringResponse)(messages, preparedOptions.modelRuntime, {
        abortSignal: preparedOptions.abortSignal,
        requiresOriginalImageDetail: preparedOptions.includeLocateInPlanning
    });
    let parsed;
    let actions;
    let shouldContinuePlanning;
    try {
        parsed = config.parseResponse(content, input);
        actions = config.transformActions(parsed, input);
        (0, external_locate_normalization_js_namespaceObject.normalizePlanningActionLocateFields)(actions, {
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
        throw new index_js_namespaceObject.AIResponseParseError(errorMessage, JSON.stringify(content, void 0, 2), usage, rawChoiceMessage);
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
exports.buildCustomPlanningMessages = __webpack_exports__.buildCustomPlanningMessages;
exports.runCustomPlanning = __webpack_exports__.runCustomPlanning;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "buildCustomPlanningMessages",
    "runCustomPlanning"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=custom-planning.js.map