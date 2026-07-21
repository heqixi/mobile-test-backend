const DEFAULT_MIDSCENE_RECORDER_MARKDOWN_MAX_SCREENSHOTS = 20;
function isMidsceneRecorderPendingDescription(value) {
    return value?.trim() === 'AI is analyzing element...';
}
function getMidsceneRecorderSemantic(event) {
    return event.semantic;
}
function getRecorderPointerActionVerb(actionType) {
    switch(actionType){
        case 'Tap':
            return 'Tap';
        case 'DoubleClick':
            return 'Double click';
        case 'LongPress':
            return 'Long press';
        case 'RightClick':
            return 'Right click';
        default:
            return 'Click';
    }
}
function getRecorderDragActionVerb(actionType) {
    switch(actionType){
        case 'Swipe':
            return 'Swipe';
        case 'DragAndDrop':
            return 'Drag';
        default:
            return 'Drag';
    }
}
function buildMidsceneRecorderReplayInstruction(event, elementDescription) {
    switch(event.type){
        case 'navigation':
            if ('Stop' === event.actionType) return 'Stop loading the current page.';
            if ('GoBack' === event.actionType) return 'Go back in the browser.';
            if ('GoForward' === event.actionType) return 'Go forward in the browser.';
            if ('Reload' === event.actionType) return 'Reload the current page.';
            if ('NavigationChanged' === event.actionType && event.url) return `Wait for navigation to complete at \`${event.url}\`.`;
            return event.url ? `Navigate to \`${event.url}\`.` : `Navigate using ${elementDescription}.`;
        case 'scroll':
            return event.scrollDestinationDescription ? `Scroll the page/region with description "${elementDescription}" by value "${event.value || 'down'}" until "${event.scrollDestinationDescription}" is visible.` : `Scroll the page/region with description "${elementDescription}" by value "${event.value || 'down'}".`;
        case 'drag':
            {
                const verb = getRecorderDragActionVerb(event.actionType);
                return `${verb} through the area described as "${elementDescription}".`;
            }
        case 'input':
            return `Input "${event.value || ''}" into the element described as "${elementDescription}".`;
        case 'keydown':
            return `Press "${event.value || 'the recorded key'}" on the element described as "${elementDescription}".`;
        default:
            {
                const verb = getRecorderPointerActionVerb(event.actionType);
                if ('Long press' === verb) return `${verb} the element described as "${elementDescription}".`;
                return `${verb} on the element described as "${elementDescription}".`;
            }
    }
}
function buildMidsceneRecorderActionSummary(event, elementDescription) {
    switch(event.type){
        case 'navigation':
            if ('Stop' === event.actionType) return 'Stop page loading';
            if ('GoBack' === event.actionType) return 'Go back';
            if ('GoForward' === event.actionType) return 'Go forward';
            if ('Reload' === event.actionType) return 'Reload page';
            if ('NavigationChanged' === event.actionType && event.url) return `Wait for navigation to complete at ${event.url}`;
            return event.url ? `Navigate to ${event.url}` : 'Navigate';
        case 'scroll':
            return event.scrollDestinationDescription ? `Scroll ${elementDescription} toward ${event.scrollDestinationDescription}` : `Scroll ${elementDescription}`;
        case 'drag':
            return `${getRecorderDragActionVerb(event.actionType)} ${elementDescription}`;
        case 'input':
            return `Input into ${elementDescription}`;
        case 'keydown':
            return `Press ${event.value || 'key'} on ${elementDescription}`;
        default:
            return `${getRecorderPointerActionVerb(event.actionType)} ${elementDescription}`;
    }
}
function getMidsceneRecorderEventDescription(event) {
    const semantic = getMidsceneRecorderSemantic(event);
    if (semantic?.actionSummary && !isMidsceneRecorderPendingDescription(semantic.actionSummary)) return semantic.actionSummary;
    if (semantic?.elementDescription && !isMidsceneRecorderPendingDescription(semantic.elementDescription)) return semantic.elementDescription;
    if (semantic?.replayInstruction && !isMidsceneRecorderPendingDescription(semantic.replayInstruction)) return semantic.replayInstruction;
    if ('navigation' === event.type && event.url) return `Navigate to ${event.url}`;
    if (event.value) return event.actionType ? `${event.actionType} ${event.value}` : event.value;
    if (event.elementRect?.x !== void 0 && event.elementRect?.y !== void 0) {
        const prefix = event.actionType || event.type;
        return `${prefix} (${Math.round(event.elementRect.x)}, ${Math.round(event.elementRect.y)})`;
    }
    return event.actionType || event.type;
}
function getMidsceneRecorderScreenshotsForLLM(events, maxScreenshots = 1) {
    return selectRecorderScreenshotCandidates(getRecorderScreenshotCandidates(events), maxScreenshots).map((candidate)=>candidate.screenshot);
}
function sanitizeMidsceneRecorderFileName(value) {
    return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'midscene-recording';
}
function normalizeMarkdownAssetBaseDir(baseDir) {
    const value = (baseDir || './screenshots').replace(/\/+$/g, '');
    if (value.startsWith('./') || value.startsWith('../')) return value;
    return `./${value}`;
}
function padEventIndex(index) {
    return String(index + 1).padStart(3, '0');
}
function parseScreenshotDataUrl(value) {
    const dataUrlMatch = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (dataUrlMatch) {
        const mimeType = dataUrlMatch[1];
        const extension = mimeType.includes('jpeg') ? 'jpg' : mimeType.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'png';
        return {
            dataUrl: value,
            base64Data: dataUrlMatch[2],
            mimeType,
            extension
        };
    }
    if (/^[a-zA-Z0-9+/=\s]+$/.test(value) && value.trim().length > 0) {
        const base64Data = value.replace(/\s+/g, '');
        return {
            dataUrl: `data:image/png;base64,${base64Data}`,
            base64Data,
            mimeType: 'image/png',
            extension: 'png'
        };
    }
}
function getRecorderEventScreenshot(event) {
    return event.screenshotWithBox || event.screenshotAfter || event.screenshotBefore;
}
function hasCoordinateFallback(event) {
    const semantic = getMidsceneRecorderSemantic(event);
    return !semantic?.elementDescription && event.elementRect?.x !== void 0 && event.elementRect?.y !== void 0;
}
function shouldIncludeMarkdownScreenshot(event, eventIndex, lastEventIndex) {
    const semantic = getMidsceneRecorderSemantic(event);
    return 0 === eventIndex || eventIndex === lastEventIndex || 'navigation' === event.type || 'scroll' === event.type || 'input' === event.type || Boolean(event.screenshotWithBox) || !semantic?.elementDescription || hasCoordinateFallback(event);
}
function getRecorderScreenshotCandidatePriority(candidate, firstEventIndex, lastEventIndex) {
    const event = candidate.event;
    let priority = 0;
    if (candidate.eventIndex === firstEventIndex) priority += 100;
    if (candidate.eventIndex === lastEventIndex) priority += 95;
    if ('navigation' === event.type) priority += 80;
    if (event.screenshotWithBox) priority += 70;
    const semantic = getMidsceneRecorderSemantic(event);
    if (semantic?.source === 'heuristic' || semantic?.confidence === 'low' || semantic?.error) priority += 60;
    if ('input' === event.type || 'scroll' === event.type) priority += 40;
    if (!semantic?.elementDescription || hasCoordinateFallback(event)) priority += 30;
    return priority;
}
function selectEvenlyDistributedCandidates(candidates, count) {
    if (count <= 0) return [];
    if (candidates.length <= count) return candidates;
    if (1 === count) return [
        candidates[Math.floor((candidates.length - 1) / 2)]
    ];
    return Array.from({
        length: count
    }, (_, index)=>{
        const candidateIndex = Math.round(index * (candidates.length - 1) / (count - 1));
        return candidates[candidateIndex];
    });
}
function selectRecorderScreenshotCandidates(candidates, maxScreenshots) {
    if (maxScreenshots <= 0 || 0 === candidates.length) return [];
    if (candidates.length <= maxScreenshots) return candidates;
    const selected = new Map();
    const firstEventIndex = candidates[0].eventIndex;
    const lastEventIndex = candidates[candidates.length - 1].eventIndex;
    const addCandidate = (candidate)=>{
        if (!candidate || selected.size >= maxScreenshots) return;
        selected.set(candidate.eventIndex, candidate);
    };
    const addEvenly = (pool)=>{
        const remaining = maxScreenshots - selected.size;
        if (remaining <= 0) return;
        const unselected = pool.filter((candidate)=>!selected.has(candidate.eventIndex));
        for (const candidate of selectEvenlyDistributedCandidates(unselected, remaining))addCandidate(candidate);
    };
    addCandidate(candidates[0]);
    addCandidate(candidates[candidates.length - 1]);
    addEvenly(candidates.filter((candidate)=>getRecorderScreenshotCandidatePriority(candidate, firstEventIndex, lastEventIndex) >= 60));
    addEvenly(candidates.filter((candidate)=>getRecorderScreenshotCandidatePriority(candidate, firstEventIndex, lastEventIndex) >= 40));
    addEvenly(candidates);
    return Array.from(selected.values()).sort((left, right)=>left.eventIndex - right.eventIndex);
}
function getRecorderScreenshotCandidates(events) {
    const candidates = [];
    const seenScreenshots = new Set();
    const lastEventIndex = events.length - 1;
    for(let eventIndex = 0; eventIndex < events.length; eventIndex += 1){
        const event = events[eventIndex];
        if (!shouldIncludeMarkdownScreenshot(event, eventIndex, lastEventIndex)) continue;
        const screenshot = getRecorderEventScreenshot(event);
        if (!(!screenshot || seenScreenshots.has(screenshot))) {
            seenScreenshots.add(screenshot);
            candidates.push({
                event,
                eventIndex,
                screenshot
            });
        }
    }
    return candidates;
}
function createMidsceneRecorderMarkdownScreenshotAssets(events, options = {}) {
    const baseDir = normalizeMarkdownAssetBaseDir(options.baseDir);
    const maxScreenshots = options.maxScreenshots ?? DEFAULT_MIDSCENE_RECORDER_MARKDOWN_MAX_SCREENSHOTS;
    const candidates = [];
    for (const candidate of getRecorderScreenshotCandidates(events)){
        const parsedScreenshot = parseScreenshotDataUrl(candidate.screenshot);
        if (parsedScreenshot) candidates.push({
            ...candidate,
            parsedScreenshot
        });
    }
    return selectRecorderScreenshotCandidates(candidates, maxScreenshots).map(({ event, eventIndex, parsedScreenshot })=>{
        const safeType = event.type.replace(/[^a-zA-Z0-9-]/g, '-');
        const fileName = `event-${padEventIndex(eventIndex)}-${safeType}.${parsedScreenshot.extension}`;
        return {
            eventIndex,
            eventHashId: event.hashId,
            eventType: event.type,
            relativePath: `${baseDir}/${fileName}`,
            dataUrl: parsedScreenshot.dataUrl,
            base64Data: parsedScreenshot.base64Data,
            mimeType: parsedScreenshot.mimeType
        };
    });
}
function scalarToYaml(value) {
    return JSON.stringify(value);
}
function stringifyMidsceneRecorderTargetBlock(target) {
    const lines = [
        `${target.platformId}:`
    ];
    const values = Object.entries(target.values);
    if (0 === values.length) {
        lines.push('  {}');
        return lines.join('\n');
    }
    for (const [key, value] of values)lines.push(`  ${key}: ${scalarToYaml(value)}`);
    return lines.join('\n');
}
export { DEFAULT_MIDSCENE_RECORDER_MARKDOWN_MAX_SCREENSHOTS, buildMidsceneRecorderActionSummary, buildMidsceneRecorderReplayInstruction, createMidsceneRecorderMarkdownScreenshotAssets, getMidsceneRecorderEventDescription, getMidsceneRecorderScreenshotsForLLM, getMidsceneRecorderSemantic, sanitizeMidsceneRecorderFileName, stringifyMidsceneRecorderTargetBlock };
