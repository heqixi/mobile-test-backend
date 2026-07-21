"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
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
    plan: ()=>external_ai_model_index_js_namespaceObject.plan,
    TUserPromptSchema: ()=>external_ai_model_index_js_namespaceObject.TUserPromptSchema,
    MIDSCENE_MODEL_NAME: ()=>env_namespaceObject.MIDSCENE_MODEL_NAME,
    deriveTaskStatus: ()=>external_dump_index_js_namespaceObject.deriveTaskStatus,
    getTaskServiceDump: ()=>task_service_dump_js_namespaceObject.getTaskServiceDump,
    reportToMarkdown: ()=>external_report_markdown_js_namespaceObject.reportToMarkdown,
    collectDedupedExecutions: ()=>external_report_js_namespaceObject.collectDedupedExecutions,
    generateImageScriptTag: ()=>external_dump_index_js_namespaceObject.generateImageScriptTag,
    restoreImageReferences: ()=>external_dump_index_js_namespaceObject.restoreImageReferences,
    runConnectivityTest: ()=>external_ai_model_index_js_namespaceObject.runConnectivityTest,
    getTaskSearchArea: ()=>task_service_dump_js_namespaceObject.getTaskSearchArea,
    parseDumpScriptAttributes: ()=>external_dump_index_js_namespaceObject.parseDumpScriptAttributes,
    splitReportHtmlByExecution: ()=>external_report_js_namespaceObject.splitReportHtmlByExecution,
    z: ()=>external_zod_namespaceObject.z,
    generateDumpScriptTag: ()=>external_dump_index_js_namespaceObject.generateDumpScriptTag,
    SizeSchema: ()=>external_ai_model_index_js_namespaceObject.SizeSchema,
    default: ()=>src,
    getVersion: ()=>external_utils_js_namespaceObject.getVersion,
    getMidsceneLocationSchema: ()=>external_ai_model_index_js_namespaceObject.getMidsceneLocationSchema,
    parseDumpScript: ()=>external_dump_index_js_namespaceObject.parseDumpScript,
    ServiceError: ()=>external_types_js_namespaceObject.ServiceError,
    parseImageScripts: ()=>external_dump_index_js_namespaceObject.parseImageScripts,
    PointSchema: ()=>external_ai_model_index_js_namespaceObject.PointSchema,
    RectSchema: ()=>external_ai_model_index_js_namespaceObject.RectSchema,
    Agent: ()=>external_agent_index_js_namespaceObject.Agent,
    verifyElementDescriptionAtPoint: ()=>external_element_describer_js_namespaceObject.verifyElementDescriptionAtPoint,
    nullReportGenerator: ()=>external_report_generator_js_namespaceObject.nullReportGenerator,
    verifyLocator: ()=>external_element_describer_js_namespaceObject.verifyLocator,
    ScreenshotStore: ()=>screenshot_store_js_namespaceObject.ScreenshotStore,
    ReportMergingTool: ()=>external_report_js_namespaceObject.ReportMergingTool,
    Service: ()=>index_js_default(),
    mergeReportFiles: ()=>external_report_cli_js_namespaceObject.mergeReportFiles,
    deriveCaseStatus: ()=>external_dump_index_js_namespaceObject.deriveCaseStatus,
    AiLocateElement: ()=>external_ai_model_index_js_namespaceObject.AiLocateElement,
    createReportCliCommands: ()=>external_report_cli_js_namespaceObject.createReportCliCommands,
    ScreenshotItem: ()=>external_screenshot_item_js_namespaceObject.ScreenshotItem,
    createAgent: ()=>external_agent_index_js_namespaceObject.createAgent,
    ExecutionDump: ()=>external_types_js_namespaceObject.ExecutionDump,
    dedupeExecutionsKeepLatest: ()=>external_report_js_namespaceObject.dedupeExecutionsKeepLatest,
    ReportGenerator: ()=>external_report_generator_js_namespaceObject.ReportGenerator,
    describeElementAtPoint: ()=>external_element_describer_js_namespaceObject.describeElementAtPoint,
    TaskRunner: ()=>external_task_runner_js_namespaceObject.TaskRunner,
    escapeContent: ()=>external_dump_index_js_namespaceObject.escapeContent,
    ReportActionDump: ()=>external_types_js_namespaceObject.ReportActionDump,
    GroupedActionDump: ()=>external_types_js_namespaceObject.GroupedActionDump,
    TMultimodalPromptSchema: ()=>external_ai_model_index_js_namespaceObject.TMultimodalPromptSchema,
    reportFileToMarkdown: ()=>external_report_cli_js_namespaceObject.reportFileToMarkdown,
    executionToMarkdown: ()=>external_report_markdown_js_namespaceObject.executionToMarkdown,
    splitReportFile: ()=>external_report_cli_js_namespaceObject.splitReportFile,
    unescapeContent: ()=>external_dump_index_js_namespaceObject.unescapeContent
});
const external_zod_namespaceObject = require("zod");
const index_js_namespaceObject = require("./service/index.js");
var index_js_default = /*#__PURE__*/ __webpack_require__.n(index_js_namespaceObject);
const external_task_runner_js_namespaceObject = require("./task-runner.js");
const external_utils_js_namespaceObject = require("./utils.js");
const external_ai_model_index_js_namespaceObject = require("./ai-model/index.js");
const env_namespaceObject = require("@midscene/shared/env");
const external_types_js_namespaceObject = require("./types.js");
const external_agent_index_js_namespaceObject = require("./agent/index.js");
const external_element_describer_js_namespaceObject = require("./element-describer.js");
const external_dump_index_js_namespaceObject = require("./dump/index.js");
const task_service_dump_js_namespaceObject = require("./dump/task-service-dump.js");
const external_report_generator_js_namespaceObject = require("./report-generator.js");
const external_report_js_namespaceObject = require("./report.js");
const external_report_cli_js_namespaceObject = require("./report-cli.js");
const external_screenshot_item_js_namespaceObject = require("./screenshot-item.js");
const screenshot_store_js_namespaceObject = require("./dump/screenshot-store.js");
const external_report_markdown_js_namespaceObject = require("./report-markdown.js");
const src = index_js_default();
exports.Agent = __webpack_exports__.Agent;
exports.AiLocateElement = __webpack_exports__.AiLocateElement;
exports.ExecutionDump = __webpack_exports__.ExecutionDump;
exports.GroupedActionDump = __webpack_exports__.GroupedActionDump;
exports.MIDSCENE_MODEL_NAME = __webpack_exports__.MIDSCENE_MODEL_NAME;
exports.PointSchema = __webpack_exports__.PointSchema;
exports.RectSchema = __webpack_exports__.RectSchema;
exports.ReportActionDump = __webpack_exports__.ReportActionDump;
exports.ReportGenerator = __webpack_exports__.ReportGenerator;
exports.ReportMergingTool = __webpack_exports__.ReportMergingTool;
exports.ScreenshotItem = __webpack_exports__.ScreenshotItem;
exports.ScreenshotStore = __webpack_exports__.ScreenshotStore;
exports.Service = __webpack_exports__.Service;
exports.ServiceError = __webpack_exports__.ServiceError;
exports.SizeSchema = __webpack_exports__.SizeSchema;
exports.TMultimodalPromptSchema = __webpack_exports__.TMultimodalPromptSchema;
exports.TUserPromptSchema = __webpack_exports__.TUserPromptSchema;
exports.TaskRunner = __webpack_exports__.TaskRunner;
exports.collectDedupedExecutions = __webpack_exports__.collectDedupedExecutions;
exports.createAgent = __webpack_exports__.createAgent;
exports.createReportCliCommands = __webpack_exports__.createReportCliCommands;
exports.dedupeExecutionsKeepLatest = __webpack_exports__.dedupeExecutionsKeepLatest;
exports["default"] = __webpack_exports__["default"];
exports.deriveCaseStatus = __webpack_exports__.deriveCaseStatus;
exports.deriveTaskStatus = __webpack_exports__.deriveTaskStatus;
exports.describeElementAtPoint = __webpack_exports__.describeElementAtPoint;
exports.escapeContent = __webpack_exports__.escapeContent;
exports.executionToMarkdown = __webpack_exports__.executionToMarkdown;
exports.generateDumpScriptTag = __webpack_exports__.generateDumpScriptTag;
exports.generateImageScriptTag = __webpack_exports__.generateImageScriptTag;
exports.getMidsceneLocationSchema = __webpack_exports__.getMidsceneLocationSchema;
exports.getTaskSearchArea = __webpack_exports__.getTaskSearchArea;
exports.getTaskServiceDump = __webpack_exports__.getTaskServiceDump;
exports.getVersion = __webpack_exports__.getVersion;
exports.mergeReportFiles = __webpack_exports__.mergeReportFiles;
exports.nullReportGenerator = __webpack_exports__.nullReportGenerator;
exports.parseDumpScript = __webpack_exports__.parseDumpScript;
exports.parseDumpScriptAttributes = __webpack_exports__.parseDumpScriptAttributes;
exports.parseImageScripts = __webpack_exports__.parseImageScripts;
exports.plan = __webpack_exports__.plan;
exports.reportFileToMarkdown = __webpack_exports__.reportFileToMarkdown;
exports.reportToMarkdown = __webpack_exports__.reportToMarkdown;
exports.restoreImageReferences = __webpack_exports__.restoreImageReferences;
exports.runConnectivityTest = __webpack_exports__.runConnectivityTest;
exports.splitReportFile = __webpack_exports__.splitReportFile;
exports.splitReportHtmlByExecution = __webpack_exports__.splitReportHtmlByExecution;
exports.unescapeContent = __webpack_exports__.unescapeContent;
exports.verifyElementDescriptionAtPoint = __webpack_exports__.verifyElementDescriptionAtPoint;
exports.verifyLocator = __webpack_exports__.verifyLocator;
exports.z = __webpack_exports__.z;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "Agent",
    "AiLocateElement",
    "ExecutionDump",
    "GroupedActionDump",
    "MIDSCENE_MODEL_NAME",
    "PointSchema",
    "RectSchema",
    "ReportActionDump",
    "ReportGenerator",
    "ReportMergingTool",
    "ScreenshotItem",
    "ScreenshotStore",
    "Service",
    "ServiceError",
    "SizeSchema",
    "TMultimodalPromptSchema",
    "TUserPromptSchema",
    "TaskRunner",
    "collectDedupedExecutions",
    "createAgent",
    "createReportCliCommands",
    "dedupeExecutionsKeepLatest",
    "default",
    "deriveCaseStatus",
    "deriveTaskStatus",
    "describeElementAtPoint",
    "escapeContent",
    "executionToMarkdown",
    "generateDumpScriptTag",
    "generateImageScriptTag",
    "getMidsceneLocationSchema",
    "getTaskSearchArea",
    "getTaskServiceDump",
    "getVersion",
    "mergeReportFiles",
    "nullReportGenerator",
    "parseDumpScript",
    "parseDumpScriptAttributes",
    "parseImageScripts",
    "plan",
    "reportFileToMarkdown",
    "reportToMarkdown",
    "restoreImageReferences",
    "runConnectivityTest",
    "splitReportFile",
    "splitReportHtmlByExecution",
    "unescapeContent",
    "verifyElementDescriptionAtPoint",
    "verifyLocator",
    "z"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=index.js.map