import { collectScreenshotRefs, pathForReportScreenshot } from "./verbose-screenshot.mjs";
const cliAiActProgressScope = 'aiAct';
function isRecord(value) {
    return 'object' == typeof value && null !== value && !Array.isArray(value);
}
function compactText(value) {
    if (null == value || '' === value) return '';
    if ('string' == typeof value) return value.length > 180 ? `${value.slice(0, 177)}...` : value;
    if ('number' == typeof value || 'boolean' == typeof value) return String(value);
    try {
        const json = JSON.stringify(value);
        return json.length > 180 ? `${json.slice(0, 177)}...` : json;
    } catch  {
        return String(value);
    }
}
function numericValue(value) {
    return 'number' == typeof value && Number.isFinite(value) ? value : void 0;
}
function firstText(values) {
    for (const value of values){
        const text = compactText(value);
        if (text) return text;
    }
    return '';
}
function planPrefix(event) {
    const planIndex = numericValue(event.planIndex);
    if (!planIndex) return '[Midscene][aiAct]';
    const planLimit = numericValue(event.planLimit);
    return `[Midscene][aiAct][Plan ${Math.round(planIndex)}${planLimit ? `/${Math.round(planLimit)}` : ''}]`;
}
function eventKey(event, suffix) {
    const sequence = numericValue(event.sequence);
    if (sequence) return `aiAct:${sequence}:${suffix}`;
    return [
        'aiAct',
        compactText(event.phase),
        compactText(event.planIndex),
        suffix
    ].filter(Boolean).join(':');
}
function integerText(value) {
    return String(Math.round(value));
}
function numberTuple2(value) {
    if (Array.isArray(value) && value.length >= 2 && 'number' == typeof value[0] && 'number' == typeof value[1]) return [
        value[0],
        value[1]
    ];
}
function numberTuple4(value) {
    if (Array.isArray(value) && value.length >= 4 && value.slice(0, 4).every((item)=>'number' == typeof item)) return [
        value[0],
        value[1],
        value[2],
        value[3]
    ];
}
function parseAction(value) {
    if (!isRecord(value) || 'string' != typeof value.name) return;
    return {
        name: value.name,
        target: 'string' == typeof value.target ? value.target : void 0,
        point: numberTuple2(value.point),
        bbox: numberTuple4(value.bbox),
        param: value.param
    };
}
function formatPoint(point) {
    return `(${integerText(point[0])}, ${integerText(point[1])})`;
}
function formatBbox(bbox) {
    return `(${bbox.map(integerText).join(',')})`;
}
function sleepActionText(action) {
    if ('Sleep' !== action.name || !isRecord(action.param)) return;
    const timeMs = numericValue(action.param.timeMs) ?? numericValue(action.param.duration) ?? numericValue(action.param.timeoutMs);
    return void 0 !== timeMs ? `Sleep ${integerText(timeMs)}ms` : void 0;
}
function plannedActionText(action) {
    if (action.point) {
        const targetSegment = action.target ? ` "${action.target}"` : '';
        const bboxSegment = action.bbox ? `, bbox=${formatBbox(action.bbox)}` : '';
        return `${action.name}${targetSegment} at ${formatPoint(action.point)}${bboxSegment}`;
    }
    const sleep = sleepActionText(action);
    if (sleep) return sleep;
    const paramText = compactText(action.param);
    return paramText ? `${action.name}: ${paramText}` : action.name;
}
function runningActionText(action) {
    if (action.point) return `${action.name} at ${formatPoint(action.point)}`;
    return plannedActionText(action);
}
function normalizeAiActProgressEventForCli(event, screenshotOptions = {}) {
    if (!isRecord(event) || event.scope !== cliAiActProgressScope) return;
    const data = isRecord(event.data) ? event.data : {};
    const screenshots = collectScreenshotRefs(data.screenshot, screenshotOptions);
    const latestPath = screenshots.slice().reverse().find((item)=>'string' == typeof item.path && item.path.length > 0)?.path;
    const screenshotPath = 'string' == typeof latestPath ? pathForReportScreenshot(latestPath, screenshotOptions.reportFile) : void 0;
    const { prompt, planIndex, planLimit, action, thought, log, output, durationMs, error } = data;
    return {
        phase: event.phase,
        sequence: event.sequence,
        prompt,
        planIndex,
        planLimit,
        action,
        thought,
        log,
        output,
        durationMs,
        error,
        ...screenshots.length > 0 ? {
            screenshots
        } : {},
        ...screenshotPath ? {
            screenshotPath
        } : {}
    };
}
function buildAiActProgressEventLines(event) {
    const phase = 'string' == typeof event.phase ? event.phase : '';
    const prefix = planPrefix(event);
    const error = compactText(event.error);
    const duration = 'number' == typeof event.durationMs ? ` cost=${Math.round(event.durationMs)}ms` : '';
    const action = parseAction(event.action);
    switch(phase){
        case 'start':
            {
                const prompt = compactText(event.prompt);
                return [
                    {
                        key: `aiAct:start:${prompt}`,
                        text: prompt ? `[Midscene][aiAct] Start: ${prompt}` : '[Midscene][aiAct] Start'
                    }
                ];
            }
        case 'plan_thinking':
            return event.screenshotPath ? [
                {
                    key: eventKey(event, 'thinking'),
                    text: `${prefix} Thinking with the latest screenshot: ${event.screenshotPath}`
                }
            ] : [
                {
                    key: eventKey(event, 'thinking'),
                    text: `${prefix} Thinking with the latest screenshot`
                }
            ];
        case 'plan_planned':
            {
                const text = firstText([
                    event.log,
                    event.thought,
                    event.output
                ]);
                return text ? [
                    {
                        key: eventKey(event, 'planned'),
                        text: `${prefix} Planned: ${text}`
                    }
                ] : [];
            }
        case 'plan_action':
            return action ? [
                {
                    key: eventKey(event, 'action'),
                    text: `${prefix} Action: ${plannedActionText(action)}`
                }
            ] : [];
        case 'plan_failed':
            return [
                {
                    key: eventKey(event, 'plan_failed'),
                    text: `${prefix} Failed${error ? `: ${error}` : ''}`
                }
            ];
        case 'action_running':
            return action ? [
                {
                    key: eventKey(event, 'action_running'),
                    text: `[Midscene][aiAct][Action] Running: ${runningActionText(action)}`
                }
            ] : [];
        case 'action_done':
            return action ? [
                {
                    key: eventKey(event, 'action_done'),
                    text: `[Midscene][aiAct][Action] Done: ${action.name}${duration}`
                }
            ] : [];
        case 'action_failed':
            return [
                {
                    key: eventKey(event, 'action_failed'),
                    text: `[Midscene][aiAct][Action] Failed${action ? `: ${action.name}` : ''}${duration}${error ? ` error=${error}` : ''}`
                }
            ];
        case 'complete':
            {
                const text = firstText([
                    event.output,
                    event.log,
                    event.thought
                ]);
                return [
                    {
                        key: eventKey(event, 'complete'),
                        text: `[Midscene][aiAct] Complete${text ? `: ${text}` : ''}`
                    }
                ];
            }
        case 'failed':
            return [
                {
                    key: eventKey(event, 'failed'),
                    text: `[Midscene][aiAct] Failed${error ? `: ${error}` : ''}`
                }
            ];
        default:
            return [];
    }
}
const aiActCliProgressRenderer = {
    normalize: normalizeAiActProgressEventForCli,
    buildLines: buildAiActProgressEventLines
};
export { aiActCliProgressRenderer, buildAiActProgressEventLines, cliAiActProgressScope, normalizeAiActProgressEventForCli };
