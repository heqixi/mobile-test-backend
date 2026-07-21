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
    PlaygroundSDK: ()=>index_js_namespaceObject.PlaygroundSDK,
    LocalExecutionAdapter: ()=>local_execution_js_namespaceObject.LocalExecutionAdapter,
    buildPlaygroundBrowserUrl: ()=>external_server_js_namespaceObject.buildPlaygroundBrowserUrl,
    getRecorderUIEventTargetRect: ()=>external_recorder_ui_describer_js_namespaceObject.getRecorderUIEventTargetRect,
    playgroundForAgentFactory: ()=>external_launcher_js_namespaceObject.playgroundForAgentFactory,
    playgroundForSessionManager: ()=>external_launcher_js_namespaceObject.playgroundForSessionManager,
    noReplayAPIs: ()=>external_common_js_namespaceObject.noReplayAPIs,
    prepareMultiPlatformPlayground: ()=>external_multi_platform_js_namespaceObject.prepareMultiPlatformPlayground,
    resolvePreparedLaunchOptions: ()=>external_platform_js_namespaceObject.resolvePreparedLaunchOptions,
    BasePlaygroundAdapter: ()=>base_js_namespaceObject.BasePlaygroundAdapter,
    playgroundForPlatforms: ()=>external_multi_platform_js_namespaceObject.playgroundForPlatforms,
    validateStructuredParams: ()=>external_common_js_namespaceObject.validateStructuredParams,
    describeRecorderUIEvent: ()=>external_recorder_ui_describer_js_namespaceObject.describeRecorderUIEvent,
    dataExtractionAPIs: ()=>external_common_js_namespaceObject.dataExtractionAPIs,
    validationAPIs: ()=>external_common_js_namespaceObject.validationAPIs,
    PlaygroundServer: ()=>external_server_js_namespaceObject.PlaygroundServer,
    createMjpegPreviewDescriptor: ()=>external_platform_js_namespaceObject.createMjpegPreviewDescriptor,
    createScreenshotPreviewDescriptor: ()=>external_platform_js_namespaceObject.createScreenshotPreviewDescriptor,
    RemoteExecutionAdapter: ()=>remote_execution_js_namespaceObject.RemoteExecutionAdapter,
    formatErrorMessage: ()=>external_common_js_namespaceObject.formatErrorMessage,
    definePlaygroundPlatform: ()=>external_platform_js_namespaceObject.definePlaygroundPlatform,
    createScrcpyPreviewDescriptor: ()=>external_platform_js_namespaceObject.createScrcpyPreviewDescriptor,
    describeRecorderUIEvents: ()=>external_recorder_ui_describer_js_namespaceObject.describeRecorderUIEvents,
    executeAction: ()=>external_common_js_namespaceObject.executeAction,
    launchPreparedPlaygroundPlatform: ()=>external_platform_launcher_js_namespaceObject.launchPreparedPlaygroundPlatform,
    playgroundForAgent: ()=>external_launcher_js_namespaceObject.playgroundForAgent
});
const external_common_js_namespaceObject = require("./common.js");
const external_server_js_namespaceObject = require("./server.js");
const external_recorder_ui_describer_js_namespaceObject = require("./recorder-ui-describer.js");
const external_launcher_js_namespaceObject = require("./launcher.js");
const external_platform_js_namespaceObject = require("./platform.js");
const external_platform_launcher_js_namespaceObject = require("./platform-launcher.js");
const external_multi_platform_js_namespaceObject = require("./multi-platform.js");
const index_js_namespaceObject = require("./sdk/index.js");
const base_js_namespaceObject = require("./adapters/base.js");
const local_execution_js_namespaceObject = require("./adapters/local-execution.js");
const remote_execution_js_namespaceObject = require("./adapters/remote-execution.js");
exports.BasePlaygroundAdapter = __webpack_exports__.BasePlaygroundAdapter;
exports.LocalExecutionAdapter = __webpack_exports__.LocalExecutionAdapter;
exports.PlaygroundSDK = __webpack_exports__.PlaygroundSDK;
exports.PlaygroundServer = __webpack_exports__.PlaygroundServer;
exports.RemoteExecutionAdapter = __webpack_exports__.RemoteExecutionAdapter;
exports.buildPlaygroundBrowserUrl = __webpack_exports__.buildPlaygroundBrowserUrl;
exports.createMjpegPreviewDescriptor = __webpack_exports__.createMjpegPreviewDescriptor;
exports.createScrcpyPreviewDescriptor = __webpack_exports__.createScrcpyPreviewDescriptor;
exports.createScreenshotPreviewDescriptor = __webpack_exports__.createScreenshotPreviewDescriptor;
exports.dataExtractionAPIs = __webpack_exports__.dataExtractionAPIs;
exports.definePlaygroundPlatform = __webpack_exports__.definePlaygroundPlatform;
exports.describeRecorderUIEvent = __webpack_exports__.describeRecorderUIEvent;
exports.describeRecorderUIEvents = __webpack_exports__.describeRecorderUIEvents;
exports.executeAction = __webpack_exports__.executeAction;
exports.formatErrorMessage = __webpack_exports__.formatErrorMessage;
exports.getRecorderUIEventTargetRect = __webpack_exports__.getRecorderUIEventTargetRect;
exports.launchPreparedPlaygroundPlatform = __webpack_exports__.launchPreparedPlaygroundPlatform;
exports.noReplayAPIs = __webpack_exports__.noReplayAPIs;
exports.playgroundForAgent = __webpack_exports__.playgroundForAgent;
exports.playgroundForAgentFactory = __webpack_exports__.playgroundForAgentFactory;
exports.playgroundForPlatforms = __webpack_exports__.playgroundForPlatforms;
exports.playgroundForSessionManager = __webpack_exports__.playgroundForSessionManager;
exports.prepareMultiPlatformPlayground = __webpack_exports__.prepareMultiPlatformPlayground;
exports.resolvePreparedLaunchOptions = __webpack_exports__.resolvePreparedLaunchOptions;
exports.validateStructuredParams = __webpack_exports__.validateStructuredParams;
exports.validationAPIs = __webpack_exports__.validationAPIs;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "BasePlaygroundAdapter",
    "LocalExecutionAdapter",
    "PlaygroundSDK",
    "PlaygroundServer",
    "RemoteExecutionAdapter",
    "buildPlaygroundBrowserUrl",
    "createMjpegPreviewDescriptor",
    "createScrcpyPreviewDescriptor",
    "createScreenshotPreviewDescriptor",
    "dataExtractionAPIs",
    "definePlaygroundPlatform",
    "describeRecorderUIEvent",
    "describeRecorderUIEvents",
    "executeAction",
    "formatErrorMessage",
    "getRecorderUIEventTargetRect",
    "launchPreparedPlaygroundPlatform",
    "noReplayAPIs",
    "playgroundForAgent",
    "playgroundForAgentFactory",
    "playgroundForPlatforms",
    "playgroundForSessionManager",
    "prepareMultiPlatformPlayground",
    "resolvePreparedLaunchOptions",
    "validateStructuredParams",
    "validationAPIs"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=index.js.map