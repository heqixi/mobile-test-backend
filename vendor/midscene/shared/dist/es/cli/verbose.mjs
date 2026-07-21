import { aiActCliProgressRenderer, cliAiActProgressScope } from "./verbose-ai-act.mjs";
import { collectScreenshotRefs, renderScreenshotList } from "./verbose-screenshot.mjs";
const cliVerboseFlag = 'verbose';
const progressRenderers = {
    [cliAiActProgressScope]: aiActCliProgressRenderer
};
function progressRendererForEvent(event) {
    if ('object' != typeof event || null === event) return;
    const scope = event.scope;
    if ('string' != typeof scope) return;
    const renderer = progressRenderers[scope];
    return renderer ? {
        scope,
        renderer
    } : void 0;
}
const progressEventName = 'midscene_progress';
const cliVerboseContextKey = '__midscene_cli_verbose_context__';
const getGlobalContext = ()=>{
    const globalWithContext = globalThis;
    if (!globalWithContext[cliVerboseContextKey]) globalWithContext[cliVerboseContextKey] = {
        current: {
            enabled: false
        }
    };
    return globalWithContext[cliVerboseContextKey];
};
function parseVerboseFormat(rawFormat) {
    if ('text' === rawFormat || 'jsonl' === rawFormat) return rawFormat;
    throw new Error(`Unsupported --${cliVerboseFlag} format "${rawFormat}". Use "--${cliVerboseFlag}" or "--${cliVerboseFlag}=jsonl".`);
}
function stripVerboseFlag(argv) {
    const rawArgs = [];
    let verbose = false;
    let format = 'text';
    for (const arg of argv){
        if (arg === `--${cliVerboseFlag}`) {
            verbose = true;
            continue;
        }
        if (arg.startsWith(`--${cliVerboseFlag}=`)) {
            verbose = true;
            format = parseVerboseFormat(arg.slice(`--${cliVerboseFlag}=`.length));
            continue;
        }
        rawArgs.push(arg);
    }
    return {
        rawArgs,
        verbose,
        format
    };
}
async function withCliVerboseContext(context, fn) {
    const globalContext = getGlobalContext();
    const previous = globalContext.current;
    globalContext.current = {
        ...context,
        renderedLineKeys: context.renderedLineKeys ?? new Set()
    };
    try {
        return await fn();
    } finally{
        globalContext.current = previous;
    }
}
function getCliVerboseContext() {
    return getGlobalContext().current;
}
function isCliVerboseEnabled() {
    return getCliVerboseContext().enabled;
}
function emitCliVerboseEvent(event) {
    const context = getCliVerboseContext();
    if (!context.enabled) return;
    const payload = {
        type: progressEventName,
        timestamp: new Date().toISOString(),
        scriptName: context.scriptName,
        command: context.commandName,
        ...event
    };
    if ('jsonl' === context.format) return void console.log(JSON.stringify(payload));
    const text = renderCliVerboseEventText(payload, context);
    if (text) console.log(text);
}
function errorMessageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
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
function compactPrimitiveCliVerboseValue(value) {
    if (null == value) return {
        handled: true,
        value
    };
    if ('string' == typeof value) return {
        handled: true,
        value: value.length > 180 ? `${value.slice(0, 177)}...` : value
    };
    if ('number' == typeof value || 'boolean' == typeof value) return {
        handled: true,
        value
    };
    if ('object' != typeof value) return {
        handled: true,
        value: String(value)
    };
    return {
        handled: false
    };
}
function compactStructuredCliVerboseValue(value) {
    const primitive = compactPrimitiveCliVerboseValue(value);
    if (primitive.handled) return primitive.value;
    if (Array.isArray(value)) return value.slice(0, 5).map(compactStructuredCliVerboseValue);
    if (!isRecord(value)) return String(value);
    const entries = Object.entries(value).slice(0, 6);
    return Object.fromEntries(entries.map(([key, entryValue])=>[
            key,
            compactStructuredCliVerboseValue(entryValue)
        ]));
}
function compactCliVerboseValue(value) {
    const primitive = compactPrimitiveCliVerboseValue(value);
    if (primitive.handled) return primitive.value;
    if (Array.isArray(value)) return value.slice(0, 5).map(compactCliVerboseValue);
    if (isRecord(value) && 'string' == typeof value.prompt) return compactCliVerboseValue(value.prompt);
    if (!isRecord(value)) return String(value);
    const entries = Object.entries(value).slice(0, 6);
    return Object.fromEntries(entries.map(([key, entryValue])=>[
            key,
            compactCliVerboseValue(entryValue)
        ]));
}
function compactCliVerboseArgs(args) {
    return Object.fromEntries(Object.entries(args).slice(0, 8).map(([key, value])=>[
            key,
            compactStructuredCliVerboseValue(value)
        ]));
}
function summarizeParam(param) {
    if (!param || 'object' != typeof param) return compactCliVerboseValue(param);
    const record = param;
    if ('string' == typeof record.prompt) return compactCliVerboseValue(record.prompt);
    if (record.locate && 'object' == typeof record.locate && null !== record.locate) {
        const locate = record.locate;
        return {
            locate: compactCliVerboseValue(locate.prompt),
            ...Object.fromEntries(Object.entries(record).filter(([key])=>'locate' !== key).slice(0, 4).map(([key, value])=>[
                    key,
                    compactCliVerboseValue(value)
                ]))
        };
    }
    return compactCliVerboseValue(record);
}
function summarizeUserInstruction(value) {
    if ('string' == typeof value) return compactText(value);
    if (isRecord(value) && 'string' == typeof value.prompt) return compactText(value.prompt);
    return compactText(value);
}
function summarizeTaskParamText(task) {
    if (!isRecord(task.param)) return compactText(summarizeParam(task.param));
    if ('Planning' === task.type && 'Locate' !== task.subType) {
        if (task.param.userInstructionDisplay) return summarizeUserInstruction(task.param.userInstructionDisplay);
        if (task.param.userInstruction) return summarizeUserInstruction(task.param.userInstruction);
    }
    if (task.param.dataDemand) return compactText(summarizeParam(task.param.dataDemand));
    if (task.param.assertion) return compactText(summarizeParam(task.param.assertion));
    return compactText(summarizeParam(task.param));
}
function summarizeSubGoals(value) {
    if (!Array.isArray(value) || 0 === value.length) return '';
    const goals = value.slice(0, 6).map((goal)=>{
        if (!isRecord(goal)) return '';
        const index = 'number' == typeof goal.index ? `${goal.index}. ` : '';
        const status = 'string' == typeof goal.status ? `[${goal.status}] ` : '';
        const description = 'string' == typeof goal.description ? goal.description : '';
        return `${index}${status}${description}`.trim();
    }).filter(Boolean);
    return goals.length > 0 ? `sub-goals: ${goals.join('; ')}` : '';
}
function summarizeActions(value) {
    if (!Array.isArray(value) || 0 === value.length) return '';
    const actions = value.slice(0, 5).map((action)=>{
        if (!isRecord(action)) return '';
        const type = 'string' == typeof action.type ? action.type : 'Action';
        const param = compactText(summarizeParam(action.param));
        return param ? `${type}: ${param}` : type;
    }).filter(Boolean);
    return actions.length > 0 ? `actions: ${actions.join('; ')}` : '';
}
function summarizeTaskOutputText(task) {
    if (!isRecord(task.output)) return compactText(task.output);
    return summarizeSubGoals(task.output.updateSubGoals) || compactText(task.output.log) || compactText(task.output.output) || summarizeActions(task.output.actions);
}
function summarizeTaskText(task) {
    const parts = [
        task.type,
        task.subType
    ].filter((part)=>'string' == typeof part && part.length > 0);
    const label = parts.length > 0 ? parts.join('/') : 'Task';
    const status = 'string' == typeof task.status && task.status.length > 0 ? task.status : 'unknown';
    const param = summarizeTaskParamText(task);
    const output = summarizeTaskOutputText(task);
    const thought = compactText(task.thought);
    const detail = output || thought || param;
    return detail ? `${label} ${status}: ${detail}` : `${label} ${status}`;
}
function isCliVerboseExecutionDumpLike(value) {
    return isRecord(value) && Array.isArray(value.tasks);
}
function summarizeDumpUpdate(executionDump, screenshotOptions = {}) {
    if (!isCliVerboseExecutionDumpLike(executionDump)) return;
    const tasks = executionDump.tasks;
    const latestTask = tasks[tasks.length - 1];
    const steps = tasks.map((task, index)=>({
            id: task.taskId,
            index: index + 1,
            total: tasks.length,
            type: task.type,
            subType: task.subType,
            status: task.status,
            param: summarizeParam(task.param),
            message: summarizeTaskText(task),
            error: task.errorMessage,
            durationMs: task.timing?.cost,
            screenshots: collectScreenshotRefs(task, screenshotOptions).slice(-3)
        }));
    return {
        execution: {
            id: executionDump.id,
            name: executionDump.name,
            description: compactCliVerboseValue(executionDump.description),
            taskCount: tasks.length
        },
        steps,
        task: latestTask ? {
            id: latestTask.taskId,
            index: tasks.length,
            total: tasks.length,
            type: latestTask.type,
            subType: latestTask.subType,
            status: latestTask.status,
            param: summarizeParam(latestTask.param),
            message: summarizeTaskText(latestTask),
            error: latestTask.errorMessage,
            durationMs: latestTask.timing?.cost
        } : void 0,
        screenshots: collectScreenshotRefs(tasks, screenshotOptions).slice(-5)
    };
}
function stringifyArgs(args) {
    if (!isRecord(args) || 0 === Object.keys(args).length) return '';
    return Object.entries(args).map(([key, value])=>`${key}=${compactText(value)}`).join(', ');
}
function isActVerboseEvent(command, tool) {
    return 'act' === command || 'act' === tool;
}
function renderLinesOnce(context, lines) {
    if (0 === lines.length) return;
    if (!context.renderedLineKeys) context.renderedLineKeys = new Set();
    const renderedLineKeys = context.renderedLineKeys;
    const pendingLines = lines.filter((line)=>{
        if (renderedLineKeys.has(line.key)) return false;
        renderedLineKeys.add(line.key);
        return true;
    });
    return pendingLines.length > 0 ? pendingLines.map((line)=>line.text).join('\n') : void 0;
}
function renderCliVerboseEventText(event, context) {
    const command = 'string' == typeof event.command ? event.command : 'command';
    const tool = 'string' == typeof event.tool ? event.tool : void 0;
    switch(event.event){
        case 'agent_progress':
            {
                const scope = 'string' == typeof event.scope ? event.scope : void 0;
                const renderer = scope ? progressRenderers[scope] : void 0;
                const progressEvent = isRecord(event.progress) ? event.progress : void 0;
                if (!renderer || !progressEvent) return;
                return renderLinesOnce(context, renderer.buildLines(progressEvent));
            }
        case 'command_start':
            {
                if (isActVerboseEvent(command, tool)) return;
                const args = stringifyArgs(event.args);
                return args ? `[Midscene] ${command} started (${args})` : `[Midscene] ${command} started`;
            }
        case 'agent_ready':
            if (isActVerboseEvent(command, tool)) return;
            return `[Midscene] ${tool ?? command} ready`;
        case 'dump_update':
            {
                if (isActVerboseEvent(command, tool)) return;
                const task = isRecord(event.task) ? event.task : void 0;
                const steps = Array.isArray(event.steps) ? event.steps.filter(isRecord) : [];
                const execution = isRecord(event.execution) ? event.execution : void 0;
                const executionName = 'string' == typeof execution?.name ? execution.name : 'execution';
                const lines = steps.length > 0 ? [
                    `[Midscene] Progress: ${executionName} (${steps.length} steps)`,
                    ...steps.map((step)=>{
                        const index = 'number' == typeof step.index && 'number' == typeof step.total ? `Step ${step.index}/${step.total}` : 'Step';
                        const message = 'string' == typeof step.message ? step.message : 'string' == typeof step.status ? step.status : 'updated';
                        return `[Midscene] ${index}: ${message}`;
                    })
                ] : [
                    `[Midscene] Step: ${'string' == typeof task?.message ? task.message : 'string' == typeof task?.status ? task.status : 'updated'}`
                ];
                const screenshots = renderScreenshotList(event.screenshots);
                if (screenshots) lines.push(`[Midscene] Screenshot: ${screenshots}`);
                if ('string' == typeof event.report && event.report.length > 0) lines.push(`[Midscene] Report: ${event.report}`);
                return lines.join('\n');
            }
        case 'artifact':
            {
                if (isActVerboseEvent(command, tool)) return;
                const kind = 'string' == typeof event.kind ? event.kind : 'artifact';
                const path = 'string' == typeof event.path ? event.path : void 0;
                return path ? `[Midscene] ${kind} saved: ${path}` : `[Midscene] ${kind} ready`;
            }
        case 'command_done':
            {
                if (isActVerboseEvent(command, tool)) {
                    if ('error' === event.status) {
                        const error = 'string' == typeof event.error && event.error.length > 0 ? `: ${event.error}` : '';
                        return renderLinesOnce(context, [
                            {
                                key: `aiAct:command_failed:${event.error ?? 'unknown'}`,
                                text: `[Midscene][aiAct] Failed${error}`
                            }
                        ]);
                    }
                    return;
                }
                const status = 'error' === event.status ? 'failed' : 'finished';
                const duration = 'number' == typeof event.durationMs ? ` in ${event.durationMs}ms` : '';
                const error = 'error' === event.status && 'string' == typeof event.error ? `: ${event.error}` : '';
                return `[Midscene] ${command} ${status}${duration}${error}`;
            }
        default:
            return;
    }
}
function attachCliVerboseDumpListener(agent, options) {
    if (!isCliVerboseEnabled()) return ()=>{};
    const isActTool = options?.toolName === 'act';
    const screenshotExportCache = new Map();
    if (isActTool && 'function' == typeof agent.addProgressListener) return agent.addProgressListener((event)=>{
        const match = progressRendererForEvent(event);
        if (!match) return;
        const context = getCliVerboseContext();
        const isTextMode = 'jsonl' !== context.format;
        const progress = match.renderer.normalize(event, {
            reportFile: agent.reportFile,
            exportMode: isTextMode ? 'report' : 'none',
            cache: screenshotExportCache
        });
        if (!progress) return;
        emitCliVerboseEvent({
            event: 'agent_progress',
            tool: options?.toolName,
            scope: match.scope,
            progress
        });
    });
    if (isActTool) return ()=>{};
    if ('function' != typeof agent.addDumpUpdateListener) return ()=>{};
    return agent.addDumpUpdateListener((_dump, executionDump)=>{
        const context = getCliVerboseContext();
        const isTextMode = 'jsonl' !== context.format;
        const summaryExportMode = isTextMode && !isActTool ? 'tmp' : 'none';
        const summary = summarizeDumpUpdate(executionDump, {
            exportMode: summaryExportMode,
            cache: screenshotExportCache
        });
        if (!summary) return;
        emitCliVerboseEvent({
            event: 'dump_update',
            tool: options?.toolName,
            report: agent.reportFile || void 0,
            ...summary
        });
    });
}
export { attachCliVerboseDumpListener, errorMessageOf as cliVerboseErrorMessage, cliVerboseFlag, compactCliVerboseArgs, compactCliVerboseValue, emitCliVerboseEvent, getCliVerboseContext, isCliVerboseEnabled, stripVerboseFlag, withCliVerboseContext };
