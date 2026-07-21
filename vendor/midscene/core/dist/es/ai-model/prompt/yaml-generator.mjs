import { YAML_EXAMPLE_CODE } from "@midscene/shared/constants";
import { stringifyMidsceneRecorderTargetBlock } from "@midscene/shared/recorder";
import { callAI, callAIWithStringResponse } from "../index.mjs";
import { getModelRuntime } from "../models/index.mjs";
import { createEventCounts, createMessageContent, extractInputDescriptions, filterEventsByType, getScreenshotsForLLM, prepareEventSummary, prepareRecorderGenerationContext, processEventsForLLM, validateEvents } from "./recorder-generation-common.mjs";
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
            content: `You are an expert in Midscene.js YAML test generation. Generate clean, accurate YAML following these rules: ${YAML_EXAMPLE_CODE}`
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
    return getModelRuntime(model);
}
function createRecorderYamlPrompt(input) {
    const { summary, screenshotAssets } = prepareRecorderGenerationContext(input);
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
        targetBlock: stringifyMidsceneRecorderTargetBlock(input.target)
    });
}
const generateRecorderYamlTest = async (input, model)=>{
    try {
        const prompt = createRecorderYamlPrompt(input);
        const response = await callAIWithStringResponse(prompt, resolveModelRuntime(model));
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
        if (options.stream && options.onChunk) return await callAI(prompt, modelRuntime, {
            stream: true,
            onChunk: options.onChunk
        });
        const response = await callAIWithStringResponse(prompt, modelRuntime);
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
export { createEventCounts, createMessageContent, extractInputDescriptions, filterEventsByType, generateRecorderYamlTest, generateRecorderYamlTestStream, generateYamlTest, generateYamlTestStream, getScreenshotsForLLM, prepareEventSummary, prepareRecorderGenerationContext, processEventsForLLM, validateEvents };

//# sourceMappingURL=yaml-generator.mjs.map