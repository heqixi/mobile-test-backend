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
    createEventCounts: ()=>createEventCounts,
    filterEventsByType: ()=>filterEventsByType,
    validateEvents: ()=>validateEvents,
    createMessageContent: ()=>createMessageContent,
    getScreenshotsForLLM: ()=>getScreenshotsForLLM,
    extractInputDescriptions: ()=>extractInputDescriptions,
    prepareEventSummary: ()=>prepareEventSummary,
    prepareRecorderGenerationContext: ()=>prepareRecorderGenerationContext,
    compactRecorderSemanticForGeneration: ()=>compactRecorderSemanticForGeneration,
    processEventsForLLM: ()=>processEventsForLLM
});
const recorder_namespaceObject = require("@midscene/shared/recorder");
const MAX_RECORDER_GENERATION_SEMANTIC_TEXT_LENGTH = 1200;
const MAX_RECORDER_GENERATION_SEMANTIC_ERROR_LENGTH = 400;
function cleanRecorderSemanticField(value) {
    return value?.trim() === 'AI is analyzing element...' ? void 0 : value;
}
function truncateRecorderGenerationText(value, maxLength) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} chars]`;
}
function compactRecorderSemanticText(value) {
    const cleaned = cleanRecorderSemanticField(value);
    return cleaned ? truncateRecorderGenerationText(cleaned, MAX_RECORDER_GENERATION_SEMANTIC_TEXT_LENGTH) : void 0;
}
function compactRecorderSemanticError(value) {
    return value ? truncateRecorderGenerationText(value, MAX_RECORDER_GENERATION_SEMANTIC_ERROR_LENGTH) : void 0;
}
function compactRecorderSemanticForGeneration(semantic) {
    if (!semantic) return;
    return {
        source: semantic.source,
        status: semantic.status,
        confidence: semantic.confidence,
        elementDescription: compactRecorderSemanticText(semantic.elementDescription),
        replayInstruction: compactRecorderSemanticText(semantic.replayInstruction),
        actionSummary: compactRecorderSemanticText(semantic.actionSummary),
        error: compactRecorderSemanticError(semantic.error),
        ...semantic.aiDescribe ? {
            aiDescribe: {
                verifyPrompt: semantic.aiDescribe.verifyPrompt,
                verifyPassed: semantic.aiDescribe.verifyPassed,
                deepLocate: semantic.aiDescribe.deepLocate,
                centerDistance: semantic.aiDescribe.centerDistance,
                expectedCenter: semantic.aiDescribe.expectedCenter,
                actualCenter: semantic.aiDescribe.actualCenter
            }
        } : {}
    };
}
const validateEvents = (events)=>{
    if (!events.length) throw new Error('No events provided for test generation');
};
const getScreenshotsForLLM = (events, maxScreenshots = 1)=>(0, recorder_namespaceObject.createMidsceneRecorderMarkdownScreenshotAssets)(events, {
        baseDir: './screenshots',
        maxScreenshots
    }).map((asset)=>asset.dataUrl);
const filterEventsByType = (events)=>({
        navigationEvents: events.filter((event)=>'navigation' === event.type),
        clickEvents: events.filter((event)=>'click' === event.type),
        inputEvents: events.filter((event)=>'input' === event.type),
        scrollEvents: events.filter((event)=>'scroll' === event.type)
    });
const createEventCounts = (filteredEvents, totalEvents)=>({
        navigation: filteredEvents.navigationEvents.length,
        click: filteredEvents.clickEvents.length,
        input: filteredEvents.inputEvents.length,
        scroll: filteredEvents.scrollEvents.length,
        total: totalEvents
    });
const extractInputDescriptions = (inputEvents)=>inputEvents.map((event)=>{
        const semantic = (0, recorder_namespaceObject.getMidsceneRecorderSemantic)(event);
        return {
            description: cleanRecorderSemanticField(semantic?.elementDescription) || '',
            value: event.value || ''
        };
    }).filter((item)=>item.description && item.value);
const processEventsForLLM = (events, screenshotPathByEventHash = new Map())=>{
    let inputIndex = 0;
    return events.map((event, index)=>{
        const previousEvent = events[index - 1];
        const nextEvent = events[index + 1];
        const previousInput = events.slice(0, index).reverse().find((candidate)=>'input' === candidate.type);
        const nextInput = events.slice(index + 1).find((candidate)=>'input' === candidate.type);
        const isInput = 'input' === event.type;
        const inputSequenceIndex = isInput ? ++inputIndex : void 0;
        const hasNeighborInput = Boolean(previousInput || nextInput);
        const neighborInputValues = isInput ? [
            previousInput?.value,
            nextInput?.value
        ].filter((value)=>Boolean(value)) : void 0;
        const semantic = compactRecorderSemanticForGeneration((0, recorder_namespaceObject.getMidsceneRecorderSemantic)(event));
        return {
            hashId: event.hashId,
            type: event.type,
            timestamp: event.timestamp,
            source: event.source,
            actionType: event.actionType,
            url: event.url,
            title: event.title,
            semantic,
            description: (0, recorder_namespaceObject.getMidsceneRecorderEventDescription)(event),
            value: event.value,
            previousActionDescription: previousEvent ? (0, recorder_namespaceObject.getMidsceneRecorderEventDescription)(previousEvent) : void 0,
            nextActionDescription: nextEvent ? (0, recorder_namespaceObject.getMidsceneRecorderEventDescription)(nextEvent) : void 0,
            ...isInput ? {
                typedText: event.value || '',
                inputIndex: inputSequenceIndex,
                isSequentialInput: previousEvent?.type === 'input' || nextEvent?.type === 'input',
                hasNeighborInput,
                previousInputDescription: previousInput ? (0, recorder_namespaceObject.getMidsceneRecorderEventDescription)(previousInput) : void 0,
                neighborInputValues: neighborInputValues && neighborInputValues.length > 0 ? neighborInputValues : void 0
            } : {},
            pageInfo: event.pageInfo,
            elementRect: event.elementRect,
            screenshotPath: screenshotPathByEventHash.get(event.hashId)
        };
    });
};
const prepareEventSummary = (events, options = {})=>{
    const filteredEvents = filterEventsByType(events);
    const eventCounts = createEventCounts(filteredEvents, events.length);
    const startUrl = filteredEvents.navigationEvents.length > 0 ? filteredEvents.navigationEvents[0].url || '' : '';
    const clickDescriptions = filteredEvents.clickEvents.map((event)=>(0, recorder_namespaceObject.getMidsceneRecorderSemantic)(event)?.elementDescription).filter((desc)=>Boolean(desc)).slice(0, 10);
    const inputDescriptions = extractInputDescriptions(filteredEvents.inputEvents).slice(0, 10);
    const urls = filteredEvents.navigationEvents.map((e)=>e.url).filter((url)=>Boolean(url)).slice(0, 5);
    const processedEvents = processEventsForLLM(events, options.screenshotPathByEventHash);
    return {
        testName: options.testName || 'Automated test from recorded events',
        startUrl,
        eventCounts,
        urls,
        clickDescriptions,
        inputDescriptions,
        events: processedEvents
    };
};
function prepareRecorderGenerationContext(input) {
    validateEvents(input.events);
    const maxScreenshots = input.maxScreenshots ?? recorder_namespaceObject.DEFAULT_MIDSCENE_RECORDER_MARKDOWN_MAX_SCREENSHOTS;
    const screenshotAssets = (0, recorder_namespaceObject.createMidsceneRecorderMarkdownScreenshotAssets)(input.events, {
        baseDir: './screenshots',
        maxScreenshots
    });
    const screenshotPathByEventHash = new Map(screenshotAssets.map((asset)=>[
            asset.eventHashId,
            asset.relativePath
        ]));
    return {
        summary: prepareEventSummary(input.events, {
            testName: input.testName,
            screenshotPathByEventHash
        }),
        screenshotAssets
    };
}
const createMessageContent = (promptText, screenshots = [], includeScreenshots = true)=>{
    const messageContent = [
        {
            type: 'text',
            text: promptText
        }
    ];
    if (includeScreenshots && screenshots.length > 0) {
        messageContent.unshift({
            type: 'text',
            text: 'Here are screenshots from the recording session to help you understand the context:'
        });
        screenshots.forEach((screenshot)=>{
            messageContent.push({
                type: 'image_url',
                image_url: {
                    url: screenshot
                }
            });
        });
    }
    return messageContent;
};
exports.compactRecorderSemanticForGeneration = __webpack_exports__.compactRecorderSemanticForGeneration;
exports.createEventCounts = __webpack_exports__.createEventCounts;
exports.createMessageContent = __webpack_exports__.createMessageContent;
exports.extractInputDescriptions = __webpack_exports__.extractInputDescriptions;
exports.filterEventsByType = __webpack_exports__.filterEventsByType;
exports.getScreenshotsForLLM = __webpack_exports__.getScreenshotsForLLM;
exports.prepareEventSummary = __webpack_exports__.prepareEventSummary;
exports.prepareRecorderGenerationContext = __webpack_exports__.prepareRecorderGenerationContext;
exports.processEventsForLLM = __webpack_exports__.processEventsForLLM;
exports.validateEvents = __webpack_exports__.validateEvents;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "compactRecorderSemanticForGeneration",
    "createEventCounts",
    "createMessageContent",
    "extractInputDescriptions",
    "filterEventsByType",
    "getScreenshotsForLLM",
    "prepareEventSummary",
    "prepareRecorderGenerationContext",
    "processEventsForLLM",
    "validateEvents"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=recorder-generation-common.js.map