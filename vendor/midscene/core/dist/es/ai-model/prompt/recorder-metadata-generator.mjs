import { getMidsceneRecorderEventDescription, getMidsceneRecorderScreenshotsForLLM, getMidsceneRecorderSemantic } from "@midscene/shared/recorder";
import { getModelRuntime } from "../models/index.mjs";
import { callAIWithObjectResponse } from "../service-caller/index.mjs";
import { compactRecorderSemanticForGeneration } from "./recorder-generation-common.mjs";
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
                description: getMidsceneRecorderEventDescription(event),
                semantic: compactRecorderSemanticForGeneration(getMidsceneRecorderSemantic(event))
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
    const screenshots = getMidsceneRecorderScreenshotsForLLM(input.events, input.maxScreenshots ?? 1);
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
    const response = await callAIWithObjectResponse([
        {
            role: 'system',
            content: "You generate clear, task-oriented titles and descriptions for recorded automation sessions."
        },
        {
            role: 'user',
            content: messageContent
        }
    ], getModelRuntime(modelConfig));
    return {
        title: normalizeMetadataValue(response.content.title),
        description: normalizeMetadataValue(response.content.description)
    };
}
export { generateRecorderSessionMetadata };

//# sourceMappingURL=recorder-metadata-generator.mjs.map