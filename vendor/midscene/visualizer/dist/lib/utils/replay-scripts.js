"use strict";
"use client";
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
    generateAnimationScripts: ()=>generateAnimationScripts,
    mergeTwoCameraState: ()=>mergeTwoCameraState,
    cameraStateForRect: ()=>cameraStateForRect,
    extractDumpMetaInfo: ()=>extractDumpMetaInfo,
    allScriptsFromDump: ()=>allScriptsFromDump
});
const external_index_js_namespaceObject = require("./index.js");
const agent_namespaceObject = require("@midscene/core/agent");
const task_service_dump_namespaceObject = require("@midscene/core/dump/task-service-dump");
const external_highlight_element_js_namespaceObject = require("./highlight-element.js");
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
function replay_scripts_ownKeys(object, enumerableOnly) {
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
    else replay_scripts_ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
    return target;
}
const stillDuration = 900;
const actionSpinningPointerDuration = 300;
const stillAfterInsightDuration = 300;
const locateDuration = 800;
const actionDuration = 500;
const clearInsightDuration = 200;
const lastFrameDuration = 200;
const cameraStateForRect = (rect, imageWidth, imageHeight)=>{
    const canvasRatio = imageWidth / imageHeight;
    const rectRatio = rect.width / rect.height;
    let rectWidthOnPage;
    rectWidthOnPage = rectRatio >= canvasRatio ? rect.width : rect.height / imageHeight * imageWidth;
    const cameraPaddingRatio = rectWidthOnPage > 400 ? 0.1 : rectWidthOnPage > 50 ? 0.2 : 0.3;
    const cameraWidth = Math.min(imageWidth, rectWidthOnPage + imageWidth * cameraPaddingRatio * 2);
    const cameraHeight = imageHeight / imageWidth * cameraWidth;
    let left = Math.min(rect.left - imageWidth * cameraPaddingRatio, imageWidth - cameraWidth);
    left = Math.max(left, 0);
    let top = Math.min(rect.top - imageHeight * cameraPaddingRatio, imageHeight - cameraHeight);
    top = Math.max(top, 0);
    return {
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(cameraWidth)
    };
};
const createFullPageCameraState = (imageWidth, imageHeight)=>cameraStateForRect({
        left: 0,
        top: 0,
        width: imageWidth,
        height: imageHeight
    }, imageWidth, imageHeight);
const resolveTaskShotSize = (task, fallbackWidth, fallbackHeight)=>{
    var _task_uiContext;
    const size = null == task ? void 0 : null == (_task_uiContext = task.uiContext) ? void 0 : _task_uiContext.shotSize;
    return {
        width: (null == size ? void 0 : size.width) || fallbackWidth,
        height: (null == size ? void 0 : size.height) || fallbackHeight
    };
};
const mergeTwoCameraState = (cameraState1, cameraState2)=>{
    const newLeft = Math.min(cameraState1.left, cameraState2.left);
    const newTop = Math.min(cameraState1.top, cameraState2.top);
    const newRight = Math.max(cameraState1.left + cameraState1.width, cameraState2.left + cameraState2.width);
    const newWidth = newRight - newLeft;
    return {
        left: newLeft,
        top: newTop,
        width: newWidth
    };
};
const isSameModelBrief = (a, b)=>a.intent === b.intent && a.name === b.name && a.modelDescription === b.modelDescription;
const pushModelBriefIfNotExists = (list, candidate)=>{
    if (!list.some((brief)=>isSameModelBrief(brief, candidate))) list.push(candidate);
};
const normalizeDump = (dump)=>{
    if (!dump) return null;
    return Array.isArray(dump.executions) ? dump : {
        sdkVersion: '',
        groupName: 'Execution',
        modelBriefs: [],
        executions: [
            dump
        ]
    };
};
const sortExecutionsByLogTime = (executions)=>executions.map((execution, index)=>({
            execution,
            index
        })).sort((left, right)=>{
        const leftTime = Number.isFinite(left.execution.logTime) ? left.execution.logTime : 1 / 0;
        const rightTime = Number.isFinite(right.execution.logTime) ? right.execution.logTime : 1 / 0;
        return leftTime - rightTime || left.index - right.index;
    }).map(({ execution })=>execution);
const extractMetaFromNormalized = (normalizedDump)=>{
    var _normalizedDump_executions;
    let firstWidth;
    let firstHeight;
    const sdkVersion = normalizedDump.sdkVersion;
    const modelBriefs = [];
    sortExecutionsByLogTime((null == (_normalizedDump_executions = normalizedDump.executions) ? void 0 : _normalizedDump_executions.filter(Boolean)) || []).forEach((execution)=>{
        execution.tasks.forEach((task)=>{
            var _task_uiContext;
            const shotSize = null == (_task_uiContext = task.uiContext) ? void 0 : _task_uiContext.shotSize;
            if (shotSize) {
                const w = shotSize.width;
                const h = shotSize.height;
                if (!firstWidth) {
                    firstWidth = w;
                    firstHeight = h;
                }
            }
            if (task.usage) {
                const { model_name, model_description, intent } = task.usage;
                const brief = {
                    intent,
                    name: model_name,
                    modelDescription: model_description
                };
                pushModelBriefIfNotExists(modelBriefs, brief);
            }
        });
    });
    if (!firstWidth || !firstHeight) {
        console.warn('width or height is missing in dump file');
        return null;
    }
    return {
        width: firstWidth,
        height: firstHeight,
        sdkVersion,
        modelBriefs,
        deviceType: normalizedDump.deviceType
    };
};
const extractDumpMetaInfo = (dump)=>{
    const normalizedDump = normalizeDump(dump);
    if (!normalizedDump) return null;
    return extractMetaFromNormalized(normalizedDump);
};
const allScriptsFromDump = (dump)=>{
    var _normalizedDump_executions;
    const normalizedDump = normalizeDump(dump);
    if (!normalizedDump) {
        console.warn('[allScriptsFromDump] dump is empty');
        return {
            scripts: [],
            modelBriefs: []
        };
    }
    const metaInfo = extractMetaFromNormalized(normalizedDump);
    if (!metaInfo) return {
        scripts: [],
        sdkVersion: normalizedDump.sdkVersion,
        modelBriefs: []
    };
    const { width: firstWidth, height: firstHeight } = metaInfo;
    const allScripts = [];
    const executions = sortExecutionsByLogTime((null == (_normalizedDump_executions = normalizedDump.executions) ? void 0 : _normalizedDump_executions.filter(Boolean)) || []);
    for(let execIndex = 0; execIndex < executions.length; execIndex++){
        const execution = executions[execIndex];
        const scripts = generateAnimationScripts(execution, -1, firstWidth, firstHeight, execIndex);
        if (scripts) allScripts.push(...scripts);
    }
    const allScriptsWithoutIntermediateDoneFrame = allScripts.filter((script, index)=>{
        if (index !== allScripts.length - 1 && 'Done' === script.title) return false;
        return true;
    });
    return {
        scripts: allScriptsWithoutIntermediateDoneFrame,
        width: firstWidth,
        height: firstHeight,
        sdkVersion: metaInfo.sdkVersion,
        modelBriefs: metaInfo.modelBriefs,
        deviceType: metaInfo.deviceType
    };
};
const generateAnimationScripts = (execution, task, imageWidth, imageHeight, executionIndex = 0)=>{
    if (!execution || !execution.tasks.length) return null;
    if (0 === imageWidth || 0 === imageHeight) return null;
    let tasksIncluded = [];
    if (-1 === task) tasksIncluded = execution.tasks;
    else {
        const startIndex = execution.tasks.findIndex((t)=>t === task);
        if (-1 === startIndex) {
            console.error("task not found, cannot generate animation scripts");
            return null;
        }
        if (startIndex === execution.tasks.length - 1) return null;
        for(let i = startIndex; i < execution.tasks.length; i++){
            if (i > startIndex && 'Planning' === execution.tasks[i].type && 'Plan' === execution.tasks[i].subType) break;
            tasksIncluded.push(execution.tasks[i]);
        }
    }
    if (0 === tasksIncluded.length) return null;
    const getTaskId = (taskIndex)=>{
        var _tasksIncluded_taskIndex;
        return null == (_tasksIncluded_taskIndex = tasksIncluded[taskIndex]) ? void 0 : _tasksIncluded_taskIndex.taskId;
    };
    const setPointerScript = (img, title, subTitle, taskId)=>({
            type: 'pointer',
            img,
            duration: 0,
            title,
            subTitle,
            taskId
        });
    const asScreenshot = (s)=>s;
    const createScript = (base, screenshot)=>{
        if (!screenshot) return base;
        const script = _object_spread({}, base);
        let cachedImg = null;
        Object.defineProperty(script, 'img', {
            get () {
                if (null === cachedImg) cachedImg = screenshot.base64;
                return cachedImg;
            },
            enumerable: true
        });
        return script;
    };
    const scripts = [];
    let insightCameraState;
    let insightOnTop = false;
    let initSubTitle = '';
    let lastTaskId;
    tasksIncluded.forEach((task, index)=>{
        const currentTaskId = getTaskId(index);
        lastTaskId = currentTaskId;
        if (0 === index) initSubTitle = (0, agent_namespaceObject.paramStr)(task);
        if ('Planning' === task.type) {
            var _task_output;
            let locateElements = [];
            if ('Plan' === task.subType) {
                var _planTask_output;
                const planTask = task;
                const actions = (null == (_planTask_output = planTask.output) ? void 0 : _planTask_output.actions) || [];
                if (actions.length > 0) {
                    const action = actions[0];
                    const knownFields = [
                        'locate',
                        'start',
                        'end'
                    ];
                    if (action.param) {
                        knownFields.forEach((field)=>{
                            if (action.param[field] && 'object' == typeof action.param[field] && 'center' in (action.param[field] || {})) locateElements.push(action.param[field]);
                        });
                        for(const key in action.param)if (!knownFields.includes(key)) {
                            if ('object' == typeof action.param[key] && 'center' in (action.param[key] || {})) locateElements.push(action.param[key]);
                        }
                    }
                }
            } else if ('Locate' === task.subType && (null == (_task_output = task.output) ? void 0 : _task_output.element)) {
                const locateTask = task;
                locateElements = [
                    locateTask.output.element
                ];
            }
            const title = (0, agent_namespaceObject.typeStr)(task);
            const subTitle = (0, agent_namespaceObject.paramStr)(task);
            const context = task.uiContext;
            const contextScreenshot = null == context ? void 0 : context.screenshot;
            if (context && contextScreenshot) {
                const { width, height } = resolveTaskShotSize(task, imageWidth, imageHeight);
                scripts.push(createScript({
                    type: 'img',
                    duration: stillAfterInsightDuration,
                    title,
                    subTitle,
                    imageWidth: width,
                    imageHeight: height,
                    taskId: currentTaskId
                }, asScreenshot(contextScreenshot)));
                locateElements.forEach((element)=>{
                    const highlightElement = (0, external_highlight_element_js_namespaceObject.normalizeHighlightElementForReport)(element);
                    const highlightBox = (0, external_highlight_element_js_namespaceObject.getCenterHighlightBox)(highlightElement);
                    insightCameraState = _object_spread_props(_object_spread({}, cameraStateForRect(highlightBox, width, height)), {
                        pointerLeft: highlightElement.center[0],
                        pointerTop: highlightElement.center[1]
                    });
                    const newCameraState = insightCameraState;
                    scripts.push(createScript({
                        type: 'insight',
                        context: context,
                        camera: newCameraState,
                        highlightElement,
                        searchArea: (0, task_service_dump_namespaceObject.getTaskSearchArea)(task),
                        duration: 0.5 * locateDuration,
                        insightCameraDuration: locateDuration,
                        title,
                        subTitle: highlightElement.description || subTitle,
                        imageWidth: width,
                        imageHeight: height,
                        taskId: currentTaskId
                    }, asScreenshot(contextScreenshot)));
                    insightOnTop = true;
                });
            }
            const planningTask = task;
            if (planningTask.recorder && planningTask.recorder.length > 0) {
                var _planningTask_recorder_;
                const screenshot = null == (_planningTask_recorder_ = planningTask.recorder[0]) ? void 0 : _planningTask_recorder_.screenshot;
                const { width, height } = resolveTaskShotSize(task, imageWidth, imageHeight);
                scripts.push(createScript({
                    type: 'img',
                    duration: stillDuration,
                    title: (0, agent_namespaceObject.typeStr)(task),
                    subTitle: (0, agent_namespaceObject.paramStr)(task),
                    imageWidth: width,
                    imageHeight: height,
                    taskId: currentTaskId
                }, asScreenshot(screenshot)));
            }
        } else if ('Action Space' === task.type) {
            var _task_recorder_, _task_recorder;
            const title = (0, agent_namespaceObject.typeStr)(task);
            const subTitle = (0, agent_namespaceObject.paramStr)(task);
            scripts.push({
                type: 'spinning-pointer',
                duration: actionSpinningPointerDuration,
                title,
                subTitle,
                taskId: currentTaskId
            });
            if (insightOnTop) {
                scripts.push({
                    type: 'clear-insight',
                    duration: clearInsightDuration,
                    title,
                    subTitle,
                    taskId: currentTaskId
                });
                insightOnTop = false;
            }
            scripts.push(setPointerScript(external_index_js_namespaceObject.mousePointer, title, subTitle, currentTaskId));
            const screenshot = null == (_task_recorder = task.recorder) ? void 0 : null == (_task_recorder_ = _task_recorder[0]) ? void 0 : _task_recorder_.screenshot;
            const { width, height } = resolveTaskShotSize(task, imageWidth, imageHeight);
            scripts.push(createScript({
                type: 'img',
                duration: actionDuration,
                camera: 'Sleep' === task.subType ? createFullPageCameraState(width, height) : void 0,
                title,
                subTitle,
                imageWidth: width,
                imageHeight: height,
                taskId: currentTaskId
            }, asScreenshot(screenshot)));
        } else {
            var _task_recorder_1, _task_recorder1;
            const title = (0, agent_namespaceObject.typeStr)(task);
            const subTitle = (0, agent_namespaceObject.paramStr)(task);
            const screenshot = null == (_task_recorder1 = task.recorder) ? void 0 : null == (_task_recorder_1 = _task_recorder1[task.recorder.length - 1]) ? void 0 : _task_recorder_1.screenshot;
            if (screenshot) {
                const { width, height } = resolveTaskShotSize(task, imageWidth, imageHeight);
                scripts.push(createScript({
                    type: 'img',
                    duration: stillDuration,
                    camera: createFullPageCameraState(width, height),
                    title,
                    subTitle,
                    imageWidth: width,
                    imageHeight: height,
                    taskId: currentTaskId
                }, asScreenshot(screenshot)));
            }
        }
        if ('finished' !== task.status) {
            var _task_recorder_2, _task_recorder2;
            const errorTitle = (0, agent_namespaceObject.typeStr)(task);
            const errorMsg = task.errorMessage || 'unknown error';
            const errorSubTitle = errorMsg.indexOf('NOT_IMPLEMENTED_AS_DESIGNED') > 0 ? 'Further actions cannot be performed in the current environment' : errorMsg;
            const screenshot = null == (_task_recorder2 = task.recorder) ? void 0 : null == (_task_recorder_2 = _task_recorder2[task.recorder.length - 1]) ? void 0 : _task_recorder_2.screenshot;
            const { width, height } = resolveTaskShotSize(task, imageWidth, imageHeight);
            scripts.push(createScript({
                type: 'img',
                camera: createFullPageCameraState(width, height),
                duration: stillDuration,
                title: errorTitle,
                subTitle: errorSubTitle,
                imageWidth: width,
                imageHeight: height,
                taskId: currentTaskId
            }, asScreenshot(screenshot)));
        }
    });
    if (insightOnTop) {
        scripts.push({
            type: 'clear-insight',
            duration: clearInsightDuration,
            title: '',
            subTitle: '',
            taskId: lastTaskId
        });
        insightOnTop = false;
    }
    const lastTaskShotSize = tasksIncluded.length > 0 ? resolveTaskShotSize(tasksIncluded[tasksIncluded.length - 1], imageWidth, imageHeight) : {
        width: imageWidth,
        height: imageHeight
    };
    scripts.push({
        title: 'End',
        subTitle: initSubTitle,
        type: 'img',
        duration: lastFrameDuration,
        camera: createFullPageCameraState(lastTaskShotSize.width, lastTaskShotSize.height),
        taskId: void 0
    });
    return scripts;
};
exports.allScriptsFromDump = __webpack_exports__.allScriptsFromDump;
exports.cameraStateForRect = __webpack_exports__.cameraStateForRect;
exports.extractDumpMetaInfo = __webpack_exports__.extractDumpMetaInfo;
exports.generateAnimationScripts = __webpack_exports__.generateAnimationScripts;
exports.mergeTwoCameraState = __webpack_exports__.mergeTwoCameraState;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "allScriptsFromDump",
    "cameraStateForRect",
    "extractDumpMetaInfo",
    "generateAnimationScripts",
    "mergeTwoCameraState"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
