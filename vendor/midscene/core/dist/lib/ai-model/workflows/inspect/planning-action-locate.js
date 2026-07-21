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
    resolvePlanningTapLocator: ()=>resolvePlanningTapLocator
});
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const external_zod_namespaceObject = require("zod");
const external_common_js_namespaceObject = require("../../../common.js");
const external_screenshot_item_js_namespaceObject = require("../../../screenshot-item.js");
const external_conversation_history_js_namespaceObject = require("../../conversation-history.js");
const index_js_namespaceObject = require("../../service-caller/index.js");
const custom_planning_js_namespaceObject = require("../planning/custom-planning.js");
const debugInspect = (0, logger_namespaceObject.getDebug)('ai:inspect');
const planningActionLocatorActionSpace = [
    {
        name: 'Tap',
        description: 'Tap the element',
        paramSchema: external_zod_namespaceObject.z.object({
            locate: (0, external_common_js_namespaceObject.getMidsceneLocationSchema)()
        }),
        call: async ()=>void 0
    }
];
async function buildPlanningTapLocatorPlanOptions(locateRequest) {
    const { options, locateImage } = locateRequest;
    const { context } = options;
    return {
        ...options,
        context: {
            ...context,
            screenshot: external_screenshot_item_js_namespaceObject.ScreenshotItem.create(locateImage.imageBase64, context.screenshot.capturedAt),
            shotSize: {
                width: locateImage.width,
                height: locateImage.height
            }
        },
        actionSpace: planningActionLocatorActionSpace,
        conversationHistory: new external_conversation_history_js_namespaceObject.ConversationHistory(),
        includeLocateInPlanning: true,
        referenceImageMessages: locateRequest.referenceImageMessages
    };
}
function resolvePlanningTapLocator(definition, planner) {
    const locatorPlanner = {
        ...planner,
        messages: {
            ...planner.messages,
            buildSystemPrompt: definition.buildSystemPrompt,
            buildUserInstruction: (instruction)=>`Tap: ${instruction}`
        }
    };
    return async (elementDescription, options, locateRequest)=>{
        (0, utils_namespaceObject.assert)(elementDescription, "cannot find the target element description");
        let errors = [];
        let reasoningContent = '';
        let rawResponse = '';
        let rawChoiceMessage;
        let usage;
        try {
            const locatePlanOptions = await buildPlanningTapLocatorPlanOptions(locateRequest);
            const planningResponse = await (0, custom_planning_js_namespaceObject.runCustomPlanning)(elementDescription, locatePlanOptions, locatorPlanner);
            rawResponse = planningResponse.rawResponse ?? '';
            rawChoiceMessage = planningResponse.rawChoiceMessage;
            usage = planningResponse.usage;
            reasoningContent = planningResponse.log;
            debugInspect('planning-tap-locator rawResponse:', rawResponse);
            const locatedPixelBbox = definition.getLocatedPixelBbox(planningResponse.actions ?? []);
            if (!locatedPixelBbox) throw new Error('No locatedPixelBbox found in planner response');
            return {
                locatedPixelBbox,
                rawResponse,
                rawChoiceMessage,
                usage,
                reasoningContent
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (error instanceof index_js_namespaceObject.AIResponseParseError) {
                rawResponse = error.rawResponse;
                rawChoiceMessage = error.rawChoiceMessage;
                usage = error.usage;
            }
            errors = [
                errorMessage || 'Failed to parse planning tap locator response'
            ];
            debugInspect('planning-tap-locator parse error:', errors[0]);
        }
        return {
            rawResponse,
            rawChoiceMessage,
            usage,
            reasoningContent,
            errors
        };
    };
}
exports.resolvePlanningTapLocator = __webpack_exports__.resolvePlanningTapLocator;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "resolvePlanningTapLocator"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=planning-action-locate.js.map