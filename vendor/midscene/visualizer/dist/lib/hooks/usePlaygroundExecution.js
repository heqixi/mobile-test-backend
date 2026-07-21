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
    usePlaygroundExecution: ()=>usePlaygroundExecution,
    formatPlaygroundError: ()=>formatPlaygroundError
});
const agent_namespaceObject = require("@midscene/core/agent");
const dump_namespaceObject = require("@midscene/core/dump");
const external_react_namespaceObject = require("react");
const store_js_namespaceObject = require("../store/store.js");
const constants_js_namespaceObject = require("../utils/constants.js");
const replay_scripts_js_namespaceObject = require("../utils/replay-scripts.js");
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) resolve(value);
    else Promise.resolve(value).then(_next, _throw);
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(void 0);
        });
    };
}
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = null != arguments[i] ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if ("function" == typeof Object.getOwnPropertySymbols) ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
            return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function usePlaygroundExecution_ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) symbols = symbols.filter(function(sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = null != source ? source : {};
    if (Object.getOwnPropertyDescriptors) Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    else usePlaygroundExecution_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
function formatPlaygroundError(error) {
    if (!error) return 'Unknown error';
    if ('string' == typeof error) return error;
    if ('object' == typeof error) {
        var _errorWithDetails_dump, _errorWithDetails_cause;
        const errorWithDetails = error;
        if (null == (_errorWithDetails_dump = errorWithDetails.dump) ? void 0 : _errorWithDetails_dump.error) return formatPlaygroundError(errorWithDetails.dump.error);
        if (errorWithDetails.message) return String(errorWithDetails.message);
        if (null == (_errorWithDetails_cause = errorWithDetails.cause) ? void 0 : _errorWithDetails_cause.message) return String(errorWithDetails.cause.message);
    }
    try {
        const serialized = JSON.stringify(error);
        if (serialized && '{}' !== serialized) return serialized;
    } catch (e) {}
    const stringified = String(error);
    return '[object Object]' === stringified ? 'Unknown error (an empty error object was received)' : stringified;
}
function buildProgressContent(task) {
    const action = (0, agent_namespaceObject.typeStr)(task);
    const description = (0, agent_namespaceObject.paramStr)(task);
    return description ? `${action} - ${description}` : action;
}
function wrapExecutionDumpForReplay(dump, deviceType) {
    return {
        sdkVersion: '',
        groupName: 'Playground Execution',
        modelBriefs: [],
        executions: [
            dump
        ],
        deviceType
    };
}
function isReportActionDump(dump) {
    return Array.isArray(null == dump ? void 0 : dump.executions);
}
function replayInfoFromDump(dump, deviceType) {
    if (!dump) return null;
    if (isReportActionDump(dump)) return (0, replay_scripts_js_namespaceObject.allScriptsFromDump)(dump);
    if (dump.tasks && Array.isArray(dump.tasks)) return (0, replay_scripts_js_namespaceObject.allScriptsFromDump)(wrapExecutionDumpForReplay(dump, deviceType));
    return null;
}
function replayInfoFromReportHTML(reportHTML, deviceType) {
    try {
        const imageMap = (0, dump_namespaceObject.parseImageScripts)(reportHTML);
        const dump = (0, dump_namespaceObject.restoreImageReferences)(JSON.parse((0, dump_namespaceObject.parseDumpScript)(reportHTML)), (ref)=>imageMap[ref.id] || '');
        return replayInfoFromDump(dump, deviceType);
    } catch (error) {
        console.error('Failed to restore replay from playground report:', error);
        return null;
    }
}
function replayInfoFromExecutionResult(result, deviceType) {
    return (null == result ? void 0 : result.dump) ? replayInfoFromDump(result.dump, deviceType) : (null == result ? void 0 : result.reportHTML) ? replayInfoFromReportHTML(result.reportHTML, deviceType) : null;
}
function loadReportReplay(result) {
    return _async_to_generator(function*() {
        var _result_report;
        if (result.dump || !(null == (_result_report = result.report) ? void 0 : _result_report.replayUrl)) return;
        try {
            const response = yield fetch(result.report.replayUrl);
            if (!response.ok) throw new Error(`Report replay request failed (${response.status})`);
            const dump = yield response.json();
            result.dump = (0, dump_namespaceObject.restoreImageReferences)(dump, (ref)=>{
                const extension = 'image/jpeg' === ref.mimeType ? 'jpeg' : 'png';
                return new URL(`screenshots/${encodeURIComponent(ref.id)}.${extension}`, result.report.url).toString();
            });
        } catch (error) {
            console.error('Failed to load playground report replay:', error);
        }
    })();
}
function shouldForwardDeepThink(actionType) {
    return 'aiAct' === actionType || 'runMarkdown' === actionType;
}
function usePlaygroundExecution(options) {
    const { playgroundSDK, storage, actionSpace, loading, setLoading, setInfoList, replayCounter, setReplayCounter, verticalMode, currentRunningIdRef, interruptedFlagRef, deviceType } = options;
    const { deepLocate, deepThink, screenshotIncluded, domIncluded, imeStrategy, autoDismissKeyboard, keyboardDismissStrategy, alwaysRefreshScreenInfo } = (0, store_js_namespaceObject.useEnvConfig)();
    const handleRun = (0, external_react_namespaceObject.useCallback)((value, runOptions = {})=>_async_to_generator(function*() {
            if (!playgroundSDK) return void console.warn('PlaygroundSDK is not available');
            const thisRunningId = Date.now();
            const actionType = value.type;
            const displayContent = runOptions.displayContent || `${value.type}: ${value.prompt || JSON.stringify(value.params)}`;
            const userItem = {
                id: `user-${Date.now()}`,
                type: 'user',
                content: displayContent,
                timestamp: new Date()
            };
            setInfoList((prev)=>[
                    ...prev,
                    userItem
                ]);
            setLoading(true);
            const result = _object_spread({}, constants_js_namespaceObject.BLANK_RESULT);
            const systemItem = {
                id: `system-${thisRunningId}`,
                type: 'system',
                content: '',
                timestamp: new Date(),
                loading: true,
                loadingProgressText: ''
            };
            setInfoList((prev)=>[
                    ...prev,
                    systemItem
                ]);
            try {
                currentRunningIdRef.current = thisRunningId;
                interruptedFlagRef.current[thisRunningId] = false;
                if (playgroundSDK.onDumpUpdate) playgroundSDK.onDumpUpdate((_, executionDump)=>{
                    var _executionDump_tasks;
                    if (interruptedFlagRef.current[thisRunningId] || !(null == executionDump ? void 0 : null == (_executionDump_tasks = executionDump.tasks) ? void 0 : _executionDump_tasks.length)) return;
                    const progressItems = executionDump.tasks.map((task, index)=>{
                        var _task_timing;
                        return {
                            id: `progress-${thisRunningId}-task-${index}`,
                            type: 'progress',
                            content: buildProgressContent(task),
                            actionKind: (0, agent_namespaceObject.typeStr)(task),
                            timestamp: new Date((null == (_task_timing = task.timing) ? void 0 : _task_timing.start) || Date.now()),
                            result: task.error ? {
                                error: formatPlaygroundError(task.error),
                                result: null
                            } : void 0
                        };
                    });
                    setInfoList((prev)=>{
                        const systemItemIndex = prev.findIndex((item)=>item.id === `system-${thisRunningId}`);
                        if (-1 === systemItemIndex) return prev;
                        const listWithoutCurrentProgress = prev.filter((item)=>!('progress' === item.type && item.id.startsWith(`progress-${thisRunningId}-`)));
                        return [
                            ...listWithoutCurrentProgress.slice(0, systemItemIndex + 1),
                            ...progressItems,
                            ...listWithoutCurrentProgress.slice(systemItemIndex + 1)
                        ];
                    });
                });
                if (!shouldForwardDeepThink(actionType) && true === deepThink) console.warn('[Playground] Non-aiAct action will be executed without deepThink. deepThink is only forwarded for aiAct and runMarkdown.', {
                    actionType,
                    requestId: thisRunningId.toString()
                });
                const resolvedDeepThink = 'unset' === deepThink ? void 0 : deepThink;
                const executionOptions = _object_spread(_object_spread_props(_object_spread({
                    requestId: thisRunningId.toString(),
                    deepLocate
                }, shouldForwardDeepThink(actionType) && void 0 !== resolvedDeepThink ? {
                    deepThink: resolvedDeepThink
                } : {}), {
                    screenshotIncluded,
                    domIncluded,
                    deviceOptions: {
                        imeStrategy,
                        autoDismissKeyboard,
                        keyboardDismissStrategy,
                        alwaysRefreshScreenInfo
                    }
                }), runOptions.reportDisplay ? {
                    reportDisplay: runOptions.reportDisplay
                } : {});
                result.result = yield playgroundSDK.executeAction(actionType, value, executionOptions);
                if ('object' == typeof result.result && null !== result.result) {
                    const resultObj = result.result;
                    if (resultObj.dump) result.dump = resultObj.dump;
                    if (resultObj.reportHTML) result.reportHTML = resultObj.reportHTML;
                    if (resultObj.report) result.report = resultObj.report;
                    if (resultObj.error) result.error = formatPlaygroundError(resultObj.error);
                    if ('result' in resultObj) result.result = resultObj.result;
                }
            } catch (e) {
                if (interruptedFlagRef.current[thisRunningId]) return;
                result.error = formatPlaygroundError(e);
                console.error('Playground execution error:', e);
                if ('object' == typeof e && null !== e) {
                    if (e.dump) result.dump = e.dump;
                    if (e.reportHTML) result.reportHTML = e.reportHTML;
                    if (e.report) result.report = e.report;
                }
            }
            yield loadReportReplay(result);
            if (interruptedFlagRef.current[thisRunningId]) return;
            setLoading(false);
            currentRunningIdRef.current = null;
            let replayInfo = null;
            let counter = replayCounter;
            const info = replayInfoFromExecutionResult(result, deviceType);
            if (info) {
                setReplayCounter((c)=>c + 1);
                replayInfo = info;
                counter = replayCounter + 1;
            }
            setInfoList((prev)=>prev.map((item)=>item.id === `system-${thisRunningId}` ? _object_spread_props(_object_spread({}, item), {
                        content: '',
                        loading: false,
                        loadingProgressText: ''
                    }) : item));
            const resultItem = {
                id: `result-${thisRunningId}`,
                type: 'result',
                content: 'Execution result',
                timestamp: new Date(),
                result: result,
                loading: false,
                replayScriptsInfo: replayInfo,
                replayCounter: counter,
                loadingProgressText: '',
                verticalMode: verticalMode,
                actionType: actionType
            };
            setInfoList((prev)=>[
                    ...prev,
                    resultItem
                ]);
            if (null == storage ? void 0 : storage.saveResult) try {
                yield storage.saveResult(resultItem.id, resultItem);
            } catch (error) {
                console.error('Failed to save result:', error);
            }
        })(), [
        playgroundSDK,
        storage,
        actionSpace,
        setLoading,
        setInfoList,
        replayCounter,
        setReplayCounter,
        verticalMode,
        currentRunningIdRef,
        interruptedFlagRef,
        deepLocate,
        deepThink,
        screenshotIncluded,
        domIncluded,
        deviceType,
        imeStrategy,
        autoDismissKeyboard,
        keyboardDismissStrategy,
        alwaysRefreshScreenInfo
    ]);
    const cancelCurrentExecution = (0, external_react_namespaceObject.useCallback)(({ appendStopMessage = false } = {})=>_async_to_generator(function*() {
            const thisRunningId = currentRunningIdRef.current;
            if (!(thisRunningId && playgroundSDK && playgroundSDK.cancelExecution)) return;
            interruptedFlagRef.current[thisRunningId] = true;
            currentRunningIdRef.current = null;
            setLoading(false);
            const markStopped = (executionData)=>{
                setInfoList((prev)=>{
                    const next = prev.map((item)=>item.id === `system-${thisRunningId}` ? _object_spread_props(_object_spread({}, item), {
                            content: '',
                            loading: false,
                            loadingProgressText: ''
                        }) : item);
                    if (!appendStopMessage) return next;
                    const hasStopItem = next.some((item)=>item.id === `stop-${thisRunningId}` || item.id === `stop-result-${thisRunningId}`);
                    if (hasStopItem) return next;
                    if (executionData && (executionData.dump || executionData.reportHTML || executionData.report)) {
                        let replayInfo = null;
                        let counter = replayCounter;
                        replayInfo = replayInfoFromExecutionResult(executionData, deviceType);
                        if (replayInfo) {
                            setReplayCounter((c)=>c + 1);
                            counter = replayCounter + 1;
                        }
                        return [
                            ...next,
                            {
                                id: `stop-result-${thisRunningId}`,
                                type: 'result',
                                content: 'Execution stopped by user',
                                timestamp: new Date(),
                                result: {
                                    result: null,
                                    dump: executionData.dump,
                                    reportHTML: executionData.reportHTML,
                                    report: executionData.report || null,
                                    error: null
                                },
                                loading: false,
                                verticalMode,
                                replayScriptsInfo: replayInfo,
                                replayCounter: counter
                            }
                        ];
                    }
                    return [
                        ...next,
                        {
                            id: `stop-${thisRunningId}`,
                            type: 'system',
                            content: 'Operation stopped',
                            timestamp: new Date(),
                            loading: false
                        }
                    ];
                });
            };
            try {
                const cancelResult = yield playgroundSDK.cancelExecution(thisRunningId.toString());
                let executionData = null;
                if (cancelResult) executionData = cancelResult;
                else if (playgroundSDK.getCurrentExecutionData) try {
                    executionData = yield playgroundSDK.getCurrentExecutionData();
                } catch (error) {
                    console.error('Failed to get execution data before stop:', error);
                }
                if (executionData) yield loadReportReplay(executionData);
                markStopped(executionData);
            } catch (error) {
                console.error('Failed to stop execution:', error);
                markStopped();
            }
        })(), [
        playgroundSDK,
        currentRunningIdRef,
        interruptedFlagRef,
        setLoading,
        setInfoList,
        verticalMode,
        replayCounter,
        setReplayCounter,
        deviceType
    ]);
    const handleStop = (0, external_react_namespaceObject.useCallback)(()=>_async_to_generator(function*() {
            const thisRunningId = currentRunningIdRef.current;
            if (thisRunningId) yield cancelCurrentExecution({
                appendStopMessage: true
            });
        })(), [
        cancelCurrentExecution,
        currentRunningIdRef
    ]);
    const canStop = loading && !!currentRunningIdRef.current && !!playgroundSDK && !!playgroundSDK.cancelExecution;
    return {
        cancelCurrentExecution,
        handleRun,
        handleStop,
        canStop
    };
}
exports.formatPlaygroundError = __webpack_exports__.formatPlaygroundError;
exports.usePlaygroundExecution = __webpack_exports__.usePlaygroundExecution;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "formatPlaygroundError",
    "usePlaygroundExecution"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
