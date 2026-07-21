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
    generateRecorderSessionMetadata: ()=>generateRecorderSessionMetadata
});
const recorder_namespaceObject = require("@midscene/shared/recorder");
const index_js_namespaceObject = require("../models/index.js");
const external_service_caller_index_js_namespaceObject = require("../service-caller/index.js");
const external_recorder_generation_common_js_namespaceObject = require("./recorder-generation-common.js");
function summarizeRecorderEvents(input) {
    const events = input.events;
    const navigationEvents = events.filter((event)=>'navigation' === event.type);
    const clickEvents = events.filter((event)=>'click' === event.type);
    const inputEvents = events.filter((event)=>'input' === event.type);
    const scrollEvents = events.filter((event)=>'scroll' === event.type);
    const urls = navigationEvents.map((event)=>event.url).filter((url)=>Boolean(url));
    const titles = navigationEvents.map((event)=>event.title).filter((title)=>Boolean(title));
    return {
        platform: input.target.platformId,
        target: input.target,
        fallbackName: input.fallbackName,
        pageCount: navigationEvents.length,
        pageTitles: titles.slice(0, 5),
        urls: urls.slice(0, 5),
        clickCount: clickEvents.length,
        inputCount: inputEvents.length,
        scrollCount: scrollEvents.length,
        totalActions: events.length,
        firstUrl: urls[0] || input.target.values.url || '',
        lastUrl: urls[urls.length - 1] || '',
        events: events.slice(0, 20).map((event)=>({
                type: event.type,
                actionType: event.actionType,
                url: event.url,
                title: event.title,
                value: event.value,
                description: (0, recorder_namespaceObject.getMidsceneRecorderEventDescription)(event),
                semantic: (0, external_recorder_generation_common_js_namespaceObject.compactRecorderSemanticForGeneration)((0, recorder_namespaceObject.getMidsceneRecorderSemantic)(event))
            }))
    };
}
function normalizeMetadataValue(value) {
    return 'string' == typeof value ? value.trim() : '';
}
async function generateRecorderSessionMetadata(input, modelConfig) {
    if (!input?.events?.length) throw new Error('generateRecorderSessionMetadata: events are required.');
    if (!modelConfig?.modelName) throw new Error('generateRecorderSessionMetadata: modelConfig.modelName is required.');
    const summary = summarizeRecorderEvents(input);
    const screenshots = (0, recorder_namespaceObject.getMidsceneRecorderScreenshotsForLLM)(input.events, input.maxScreenshots ?? 1);
    const messageContent = [
        {
            type: 'text',
            text: `Generate a concise title (5-7 words) and brief description (1-2 sentences) for a Studio recording of user actions.

The recording can target Web, Android, iOS, HarmonyOS, or Computer. Do not assume it is a browser session unless the platform is web.
Describe what the user did or accomplished. The description should use the user as the subject, preferably starting with "The user ...". Do not start the description with "The session ...".
The title should be action-oriented and highlight the main task accomplished.

Summary:
${JSON.stringify(summary, null, 2)}

Respond with a JSON object containing exactly "title" and "description".`
        }
    ];
    for (const screenshot of screenshots)messageContent.push({
        type: 'image_url',
        image_url: {
            url: screenshot
        }
    });
    const response = await (0, external_service_caller_index_js_namespaceObject.callAIWithObjectResponse)([
        {
            role: 'system',
            content: "You generate clear, task-oriented titles and descriptions for recorded automation sessions."
        },
        {
            role: 'user',
            content: messageContent
        }
    ], (0, index_js_namespaceObject.getModelRuntime)(modelConfig));
    return {
        title: normalizeMetadataValue(response.content.title),
        description: normalizeMetadataValue(response.content.description)
    };
}
exports.generateRecorderSessionMetadata = __webpack_exports__.generateRecorderSessionMetadata;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "generateRecorderSessionMetadata"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=recorder-metadata-generator.js.map