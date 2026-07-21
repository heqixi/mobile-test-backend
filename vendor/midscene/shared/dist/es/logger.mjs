import node_fs from "node:fs";
import node_path from "node:path";
import node_util from "node:util";
import debug from "debug";
import { getMidsceneRunSubDir } from "./common.mjs";
import { ifInNode } from "./utils.mjs";
const topicPrefix = 'midscene';
const logStreams = new Map();
const logStreamPaths = new Map();
let logDirectoryResolver;
const backpressuredLogStreams = new Set();
const unavailableLogStreams = new Set();
const debugInstances = new Map();
function setLogDirectoryResolver(resolver) {
    if (logDirectoryResolver === resolver) return;
    logDirectoryResolver = resolver;
    for (const stream of logStreams.values())stream.end();
    logStreams.clear();
    logStreamPaths.clear();
    unavailableLogStreams.clear();
    backpressuredLogStreams.clear();
}
function getLogDirectory() {
    return logDirectoryResolver?.() ?? getMidsceneRunSubDir('log');
}
function getLogStream(topic) {
    const topicFileName = topic.replace(/:/g, '-');
    if (unavailableLogStreams.has(topicFileName)) return null;
    const logFile = node_path.join(getLogDirectory(), `${topicFileName}.log`);
    const existingStream = logStreams.get(topicFileName);
    if (existingStream && logStreamPaths.get(topicFileName) !== logFile) {
        existingStream.end();
        logStreams.delete(topicFileName);
        logStreamPaths.delete(topicFileName);
    }
    if (!logStreams.has(topicFileName)) {
        const stream = node_fs.createWriteStream(logFile, {
            flags: 'a'
        });
        stream.on('error', ()=>{
            unavailableLogStreams.add(topicFileName);
            backpressuredLogStreams.delete(topicFileName);
            if (logStreams.get(topicFileName) === stream) {
                logStreams.delete(topicFileName);
                logStreamPaths.delete(topicFileName);
            }
        });
        logStreams.set(topicFileName, stream);
        logStreamPaths.set(topicFileName, logFile);
    }
    return logStreams.get(topicFileName) ?? null;
}
function writeLogToFile(topic, message) {
    if (!ifInNode) return;
    const topicFileName = topic.replace(/:/g, '-');
    if (backpressuredLogStreams.has(topicFileName)) return;
    const stream = getLogStream(topic);
    if (!stream) return;
    const now = new Date();
    const isoDate = now.toLocaleDateString('sv-SE');
    const isoTime = now.toLocaleTimeString('sv-SE');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    const timezoneOffsetMinutes = now.getTimezoneOffset();
    const sign = timezoneOffsetMinutes <= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60).toString().padStart(2, '0');
    const minutes = (Math.abs(timezoneOffsetMinutes) % 60).toString().padStart(2, '0');
    const timezoneString = `${sign}${hours}:${minutes}`;
    const localISOTime = `${isoDate}T${isoTime}.${milliseconds}${timezoneString}`;
    try {
        if (!stream.write(`[${localISOTime}] ${message}\n`)) {
            backpressuredLogStreams.add(topicFileName);
            stream.once('drain', ()=>{
                backpressuredLogStreams.delete(topicFileName);
            });
        }
    } catch  {
        unavailableLogStreams.add(topicFileName);
        backpressuredLogStreams.delete(topicFileName);
    }
}
function getDebug(topic, options) {
    const fullTopic = `${topicPrefix}:${topic}`;
    const withConsole = options?.console ?? false;
    const cacheKey = withConsole ? `${fullTopic}:withConsole` : fullTopic;
    if (!debugInstances.has(cacheKey)) if (withConsole) {
        const baseFn = getDebug(topic);
        const wrapper = (...args)=>{
            baseFn(...args);
            try {
                console.warn('[Midscene]', ...args);
            } catch  {}
        };
        debugInstances.set(cacheKey, wrapper);
    } else {
        const debugFn = debug(fullTopic);
        const wrapper = (...args)=>{
            if (ifInNode) {
                const message = node_util.format(...args);
                writeLogToFile(topic, message);
            }
            debugFn(...args);
        };
        debugInstances.set(cacheKey, wrapper);
    }
    return debugInstances.get(cacheKey);
}
function enableDebug(topic) {
    if (ifInNode) return;
    debug.enable(`${topicPrefix}:${topic}`);
}
export { enableDebug, getDebug, setLogDirectoryResolver };
