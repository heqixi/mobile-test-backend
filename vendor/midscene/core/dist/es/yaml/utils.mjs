import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
import js_yaml from "js-yaml";
const debugUtils = getDebug('yaml:utils');
const topLevelTasksPattern = /^tasks\s*:/;
const topLevelYamlKeyPattern = /^[^\s#][^:]*:/;
const webTargetSources = [
    'page',
    'browser',
    'web',
    'target'
];
function resolveWebTarget(config) {
    const entries = webTargetSources.map((source)=>[
            source,
            config[source]
        ]).filter((entry)=>void 0 !== entry[1]);
    if (0 === entries.length) return;
    if (entries.length > 1) {
        const specifiedTargets = entries.map(([source])=>source);
        throw new Error(`[midscene] Only one web target can be specified, but found multiple: ${specifiedTargets.join(', ')}. Please specify only one of: page, browser, web, or target.`);
    }
    const [source, target] = entries[0];
    const explicitMode = target.mode;
    if (void 0 !== explicitMode && 'page' !== explicitMode && 'browser' !== explicitMode) throw new Error(`[midscene] web target mode must be either "page" or "browser", but got "${explicitMode}".`);
    if ('page' === source && 'browser' === explicitMode) throw new Error('[midscene] page target cannot use mode: browser. Use browser: instead.');
    if ('browser' === source && 'page' === explicitMode) throw new Error('[midscene] browser target cannot use mode: page. Use page: instead.');
    const mode = 'page' === source ? 'page' : 'browser' === source ? 'browser' : explicitMode ?? 'page';
    if ('page' === mode && target.autoFollowNewPage) throw new Error('[midscene] autoFollowNewPage requires browser mode. Use browser: or web.mode: browser.');
    if ('browser' === mode && void 0 !== target.forceSameTabNavigation) throw new Error('[midscene] forceSameTabNavigation cannot be used in browser mode. Use page: or web.mode: page when same-tab navigation is required.');
    return {
        source,
        mode,
        target: {
            ...target,
            mode
        }
    };
}
function interpolateEnvVarRefs(value, keepUnresolvedRefs = false) {
    let result = '';
    let lastIndex = 0;
    let searchFrom = 0;
    while(searchFrom < value.length){
        const start = value.indexOf('${', searchFrom);
        if (-1 === start) break;
        const end = value.indexOf('}', start + 2);
        if (-1 === end) break;
        const rawName = value.slice(start + 2, end);
        if (!rawName) {
            searchFrom = end + 1;
            continue;
        }
        result += value.slice(lastIndex, start);
        const envVar = rawName.trim();
        const envValue = process.env[envVar];
        if (void 0 === envValue) if (keepUnresolvedRefs) result += value.slice(start, end + 1);
        else throw new Error(`Environment variable "${envVar}" is not defined`);
        else result += envValue;
        lastIndex = end + 1;
        searchFrom = end + 1;
    }
    return result + value.slice(lastIndex);
}
const multimodalLocateOptionFieldMap = {
    images: true,
    convertHttpImage2Base64: true
};
const multimodalLocateOptionKeys = Object.keys(multimodalLocateOptionFieldMap);
function extractMultimodalPrompt(opt) {
    if ('object' != typeof opt || null === opt) return;
    const entries = multimodalLocateOptionKeys.map((key)=>[
            key,
            opt[key]
        ]).filter(([, value])=>void 0 !== value);
    return entries.length ? Object.fromEntries(entries) : void 0;
}
function interpolateEnvVars(content) {
    const lines = content.split('\n');
    const processedLines = lines.map((line)=>{
        const trimmedLine = line.trimStart();
        if (trimmedLine.startsWith('#')) return line;
        return interpolateEnvVarRefs(line);
    });
    return processedLines.join('\n');
}
function interpolateYamlScriptEnvVars(content) {
    let inTopLevelTasksBlock = false;
    return content.split('\n').map((line)=>{
        const trimmedLine = line.trimStart();
        if (!trimmedLine || trimmedLine.startsWith('#')) return line;
        const indentSize = line.length - trimmedLine.length;
        if (0 === indentSize) {
            if (topLevelTasksPattern.test(trimmedLine)) {
                inTopLevelTasksBlock = true;
                return line;
            }
            if (topLevelYamlKeyPattern.test(trimmedLine)) inTopLevelTasksBlock = false;
        }
        return interpolateEnvVarRefs(line, inTopLevelTasksBlock);
    }).join('\n');
}
function parseYamlScript(content, filePath) {
    let processedContent = content;
    if (-1 !== content.indexOf('android') && content.match(/deviceId:\s*(\d+)/)) {
        let matchedDeviceId;
        processedContent = content.replace(/deviceId:\s*(\d+)/g, (match, deviceId)=>{
            matchedDeviceId = deviceId;
            return `deviceId: '${deviceId}'`;
        });
        console.warn(`please use string-style deviceId in yaml script, for example: deviceId: "${matchedDeviceId}"`);
    }
    const interpolatedContent = interpolateYamlScriptEnvVars(processedContent);
    const obj = js_yaml.load(interpolatedContent, {
        schema: js_yaml.JSON_SCHEMA
    });
    const pathTip = filePath ? `, failed to load ${filePath}` : '';
    resolveWebTarget(obj);
    assert(obj.tasks, `property "tasks" is required in yaml script ${pathTip}`);
    assert(Array.isArray(obj.tasks), `property "tasks" must be an array in yaml script, but got ${obj.tasks}`);
    return obj;
}
function buildDetailedLocateParam(locatePrompt, opt) {
    debugUtils('will call buildDetailedLocateParam', locatePrompt, opt);
    let normalizedLocatePrompt = locatePrompt;
    if ('object' == typeof locatePrompt && null !== locatePrompt && 'prompt' in locatePrompt) {
        const { prompt: innerPrompt, ...rest } = locatePrompt;
        const hasMultimodalFields = Object.keys(rest).length > 0;
        normalizedLocatePrompt = hasMultimodalFields ? locatePrompt : innerPrompt;
    }
    let prompt = normalizedLocatePrompt || opt?.prompt || opt?.locate;
    let deepLocate = false;
    let cacheable = true;
    let xpath;
    if ('object' == typeof opt && null !== opt) {
        deepLocate = opt.deepLocate ?? opt.deepThink ?? false;
        cacheable = opt.cacheable ?? true;
        xpath = opt.xpath;
        if (locatePrompt && opt.prompt && locatePrompt !== opt.prompt) console.warn('conflict prompt for item', locatePrompt, opt, 'maybe you put the prompt in the wrong place');
        prompt = prompt || opt.prompt;
    }
    if (!prompt) return void debugUtils('no prompt, will return undefined in buildDetailedLocateParam', opt);
    const multimodalPrompt = extractMultimodalPrompt(opt);
    if (multimodalPrompt) prompt = 'string' == typeof prompt ? {
        prompt,
        ...multimodalPrompt
    } : {
        ...prompt,
        ...multimodalPrompt
    };
    return {
        prompt,
        deepLocate,
        cacheable,
        xpath
    };
}
function buildDetailedLocateParamAndRestParams(locatePrompt, opt, excludeKeys = []) {
    const multimodalPrompt = extractMultimodalPrompt(opt);
    const locateParam = buildDetailedLocateParam(locatePrompt, opt);
    const restParams = {};
    if ('object' == typeof opt && null !== opt) {
        const allKeys = Object.keys(opt);
        const locateParamKeys = Object.keys(locateParam || {});
        const multimodalPromptKeys = 'object' == typeof locateParam?.prompt && locateParam?.prompt !== null ? Object.keys(multimodalPrompt || {}) : [];
        for (const key of allKeys)if (!locateParamKeys.includes(key) && !multimodalPromptKeys.includes(key) && !excludeKeys.includes(key) && 'locate' !== key) restParams[key] = opt[key];
    }
    return {
        locateParam,
        restParams
    };
}
export { buildDetailedLocateParam, buildDetailedLocateParamAndRestParams, interpolateEnvVars, parseYamlScript, resolveWebTarget };

//# sourceMappingURL=utils.mjs.map