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
    createEventCounts: ()=>external_recorder_generation_common_js_namespaceObject.createEventCounts,
    filterEventsByType: ()=>external_recorder_generation_common_js_namespaceObject.filterEventsByType,
    processEventsForLLM: ()=>external_recorder_generation_common_js_namespaceObject.processEventsForLLM,
    validateEvents: ()=>external_recorder_generation_common_js_namespaceObject.validateEvents,
    generateRecorderYamlTestStream: ()=>generateRecorderYamlTestStream,
    generateRecorderYamlTest: ()=>generateRecorderYamlTest,
    createMessageContent: ()=>external_recorder_generation_common_js_namespaceObject.createMessageContent,
    generateYamlTestStream: ()=>generateYamlTestStream,
    getScreenshotsForLLM: ()=>external_recorder_generation_common_js_namespaceObject.getScreenshotsForLLM,
    extractInputDescriptions: ()=>external_recorder_generation_common_js_namespaceObject.extractInputDescriptions,
    prepareEventSummary: ()=>external_recorder_generation_common_js_namespaceObject.prepareEventSummary,
    prepareRecorderGenerationContext: ()=>external_recorder_generation_common_js_namespaceObject.prepareRecorderGenerationContext,
    generateYamlTest: ()=>generateYamlTest
});
const constants_namespaceObject = require("@midscene/shared/constants");
const recorder_namespaceObject = require("@midscene/shared/recorder");
const external_index_js_namespaceObject = require("../index.js");
const index_js_namespaceObject = require("../models/index.js");
const external_recorder_generation_common_js_namespaceObject = require("./recorder-generation-common.js");
const getYamlLanguageInstruction = (language)=>{
    const normalizedLanguage = language?.trim();
    if (!normalizedLanguage) return '';
    return `
Language requirement:
- Write all human-readable YAML content in ${normalizedLanguage}.
- Keep YAML keys, field names, and Midscene API names unchanged.`;
};
const createYamlPrompt = ({ yamlSummary, screenshotAssets, language, targetBlock, target })=>{
    const prompt = [
        {
            role: 'system',
            content: `You are an expert in Midscene.js YAML test generation. Generate clean, accurate YAML following these rules: ${constants_namespaceObject.YAML_EXAMPLE_CODE}`
        },
        {
            role: 'user',
            content: `Generate YAML test for Midscene.js automation from recorded events.

Target platform:
- Preserve this exact top-level target platform: ${target.platformId}
- Use exactly one top-level target block.
- The target block must be:
${targetBlock}

Event Summary:
${JSON.stringify(yamlSummary, null, 2)}

Screenshot assets:
${JSON.stringify(screenshotAssets.map((asset)=>({
                    eventIndex: asset.eventIndex,
                    eventHashId: asset.eventHashId,
                    eventType: asset.eventType,
                    relativePath: asset.relativePath,
                    description: yamlSummary.events[asset.eventIndex]?.description
                })), null, 2)}

Convert events:
- navigation → target URL or aiAction only when the target platform supports it
- click → aiTap with the semantic element description
- input → aiInput with value and semantic locate
- scroll → aiScroll with appropriate direction and semantic scroll area
- keydown → aiKeyboardPress
- Add aiAssert for important state changes
- Prefer event.semantic.replayInstruction and event.semantic.elementDescription when event.semantic.source is "aiDescribe" or "recorderAI" and event.semantic.status is "ready".
- If event.semantic.source is "heuristic" or event.semantic.status is "pending"/"failed", use the screenshot/context to write the best visual instruction, and avoid raw coordinates unless there is no reliable semantic description.
- Screenshot assets are context only. Use their eventIndex/eventHashId relationship to understand the matching event, but do not include screenshot file paths in the YAML unless the Midscene YAML API explicitly needs them.${getYamlLanguageInstruction(language)}

Important: Return ONLY the raw YAML content. Do NOT wrap the response in markdown code blocks (no \`\`\`yaml or \`\`\`). Start directly with the YAML content.`
        }
    ];
    if (screenshotAssets.length > 0) {
        prompt.push({
            role: 'user',
            content: 'Here are screenshots from the recording session to help you understand the context:'
        });
        prompt.push({
            role: 'user',
            content: screenshotAssets.flatMap((asset)=>[
                    {
                        type: 'text',
                        text: `Screenshot asset for event #${asset.eventIndex + 1}: ${asset.relativePath}`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: asset.dataUrl
                        }
                    }
                ])
        });
    }
    return prompt;
};
function createDefaultWebTarget(events, options) {
    const navigationEvents = events.filter((event)=>'navigation' === event.type);
    const firstUrl = options.navigationInfo?.urls?.find(Boolean) || navigationEvents.find((event)=>event.url)?.url || '';
    const firstViewport = options.navigationInfo?.initialViewport || events.find((event)=>event.pageInfo)?.pageInfo;
    return {
        platformId: 'web',
        deviceId: firstUrl || void 0,
        label: firstUrl || 'Web',
        values: {
            url: firstUrl,
            ...firstViewport?.width ? {
                viewportWidth: firstViewport.width
            } : {},
            ...firstViewport?.height ? {
                viewportHeight: firstViewport.height
            } : {}
        }
    };
}
function normalizeGeneratedYaml(content) {
    const trimmed = content.trim();
    const fencedMatch = trimmed.match(/^```(?:ya?ml)?\s*([\s\S]*?)\s*```$/i);
    return `${(fencedMatch?.[1] ?? trimmed).trim()}\n`;
}
function resolveModelRuntime(model) {
    if ('config' in model && 'adapter' in model) return model;
    return (0, index_js_namespaceObject.getModelRuntime)(model);
}
function createRecorderYamlPrompt(input) {
    const { summary, screenshotAssets } = (0, external_recorder_generation_common_js_namespaceObject.prepareRecorderGenerationContext)(input);
    const yamlSummary = {
        ...summary,
        target: input.target,
        includeTimestamps: input.includeTimestamps || false
    };
    return createYamlPrompt({
        yamlSummary,
        screenshotAssets,
        language: input.language,
        target: input.target,
        targetBlock: (0, recorder_namespaceObject.stringifyMidsceneRecorderTargetBlock)(input.target)
    });
}
const generateRecorderYamlTest = async (input, model)=>{
    try {
        const prompt = createRecorderYamlPrompt(input);
        const response = await (0, external_index_js_namespaceObject.callAIWithStringResponse)(prompt, resolveModelRuntime(model));
        if (response?.content && 'string' == typeof response.content) return normalizeGeneratedYaml(response.content);
        throw new Error('Failed to generate recorder YAML test configuration');
    } catch (error) {
        throw new Error(`Failed to generate recorder YAML test: ${error}`);
    }
};
const generateRecorderYamlTestStream = async (input, options, model)=>{
    try {
        const prompt = createRecorderYamlPrompt(input);
        const modelRuntime = resolveModelRuntime(model);
        if (options.stream && options.onChunk) return await (0, external_index_js_namespaceObject.callAI)(prompt, modelRuntime, {
            stream: true,
            onChunk: options.onChunk
        });
        const response = await (0, external_index_js_namespaceObject.callAIWithStringResponse)(prompt, modelRuntime);
        if (response?.content && 'string' == typeof response.content) return {
            content: normalizeGeneratedYaml(response.content),
            usage: response.usage,
            isStreamed: false
        };
        throw new Error('Failed to generate recorder YAML test configuration');
    } catch (error) {
        throw new Error(`Failed to generate recorder YAML test: ${error}`);
    }
};
const generateYamlTest = async (events, options, model)=>generateRecorderYamlTest({
        ...options,
        target: createDefaultWebTarget(events, options),
        events
    }, model);
const generateYamlTestStream = async (events, options, model)=>generateRecorderYamlTestStream({
        ...options,
        target: createDefaultWebTarget(events, options),
        events
    }, options, model);
exports.createEventCounts = __webpack_exports__.createEventCounts;
exports.createMessageContent = __webpack_exports__.createMessageContent;
exports.extractInputDescriptions = __webpack_exports__.extractInputDescriptions;
exports.filterEventsByType = __webpack_exports__.filterEventsByType;
exports.generateRecorderYamlTest = __webpack_exports__.generateRecorderYamlTest;
exports.generateRecorderYamlTestStream = __webpack_exports__.generateRecorderYamlTestStream;
exports.generateYamlTest = __webpack_exports__.generateYamlTest;
exports.generateYamlTestStream = __webpack_exports__.generateYamlTestStream;
exports.getScreenshotsForLLM = __webpack_exports__.getScreenshotsForLLM;
exports.prepareEventSummary = __webpack_exports__.prepareEventSummary;
exports.prepareRecorderGenerationContext = __webpack_exports__.prepareRecorderGenerationContext;
exports.processEventsForLLM = __webpack_exports__.processEventsForLLM;
exports.validateEvents = __webpack_exports__.validateEvents;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "createEventCounts",
    "createMessageContent",
    "extractInputDescriptions",
    "filterEventsByType",
    "generateRecorderYamlTest",
    "generateRecorderYamlTestStream",
    "generateYamlTest",
    "generateYamlTestStream",
    "getScreenshotsForLLM",
    "prepareEventSummary",
    "prepareRecorderGenerationContext",
    "processEventsForLLM",
    "validateEvents"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=yaml-generator.js.map