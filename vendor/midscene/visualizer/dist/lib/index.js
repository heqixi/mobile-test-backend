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
    timeStr: ()=>external_utils_index_js_namespaceObject.timeStr,
    allScriptsFromDump: ()=>replay_scripts_js_namespaceObject.allScriptsFromDump,
    staticAgentFromContext: ()=>playground_utils_js_namespaceObject.staticAgentFromContext,
    iconForStatus: ()=>misc_index_js_namespaceObject.iconForStatus,
    useTextTruncation: ()=>useTextTruncation_js_namespaceObject.useTextTruncation,
    notifyError: ()=>external_utils_index_js_namespaceObject.notifyError,
    StorageType: ()=>storage_provider_js_namespaceObject.StorageType,
    detectBestStorageType: ()=>storage_provider_js_namespaceObject.detectBestStorageType,
    StaticContextProvider: ()=>context_provider_js_namespaceObject.StaticContextProvider,
    colorForName: ()=>color_js_namespaceObject.colorForName,
    fullTimeStrWithMilliseconds: ()=>external_utils_index_js_namespaceObject.fullTimeStrWithMilliseconds,
    useSafeOverrideAIConfig: ()=>useSafeOverrideAIConfig_js_namespaceObject.useSafeOverrideAIConfig,
    BaseContextProvider: ()=>context_provider_js_namespaceObject.BaseContextProvider,
    PlaygroundResultView: ()=>playground_result_index_js_namespaceObject.PlaygroundResultView,
    safeOverrideAIConfig: ()=>useSafeOverrideAIConfig_js_namespaceObject.safeOverrideAIConfig,
    highlightColorForType: ()=>color_js_namespaceObject.highlightColorForType,
    useGlobalPreference: ()=>store_js_namespaceObject.useGlobalPreference,
    useServerValid: ()=>useServerValid_js_namespaceObject.useServerValid,
    AgentContextProvider: ()=>context_provider_js_namespaceObject.AgentContextProvider,
    UniversalPlaygroundDefault: ()=>universal_playground_index_js_default(),
    actionNameForType: ()=>playground_utils_js_namespaceObject.actionNameForType,
    EnvConfig: ()=>index_js_namespaceObject.EnvConfig,
    EnvConfigReminder: ()=>env_config_reminder_index_js_namespaceObject.EnvConfigReminder,
    Logo: ()=>logo_index_js_namespaceObject.Logo,
    MemoryStorageProvider: ()=>storage_provider_js_namespaceObject.MemoryStorageProvider,
    Blackboard: ()=>blackboard_index_js_namespaceObject.Blackboard,
    ShinyText: ()=>shiny_text_index_js_default(),
    NoOpStorageProvider: ()=>storage_provider_js_namespaceObject.NoOpStorageProvider,
    LocalStorageProvider: ()=>storage_provider_js_namespaceObject.LocalStorageProvider,
    ScreenshotViewer: ()=>screenshot_viewer_index_js_default(),
    generateAnimationScripts: ()=>replay_scripts_js_namespaceObject.generateAnimationScripts,
    getPlaceholderForType: ()=>playground_utils_js_namespaceObject.getPlaceholderForType,
    IndexedDBStorageProvider: ()=>storage_provider_js_namespaceObject.IndexedDBStorageProvider,
    NoOpContextProvider: ()=>context_provider_js_namespaceObject.NoOpContextProvider,
    ServiceModeControl: ()=>service_mode_control_index_js_namespaceObject.ServiceModeControl,
    globalThemeConfig: ()=>color_js_namespaceObject.globalThemeConfig,
    ContextPreview: ()=>context_preview_index_js_namespaceObject.ContextPreview,
    createStorageProvider: ()=>storage_provider_js_namespaceObject.createStorageProvider,
    extractDumpMetaInfo: ()=>replay_scripts_js_namespaceObject.extractDumpMetaInfo,
    useTheme: ()=>useTheme_js_namespaceObject.useTheme,
    UniversalPlayground: ()=>universal_playground_index_js_namespaceObject.UniversalPlayground,
    Player: ()=>player_index_js_namespaceObject.Player,
    NavActions: ()=>nav_actions_index_js_namespaceObject.NavActions,
    PromptInput: ()=>prompt_input_index_js_namespaceObject.PromptInput,
    filterBase64Value: ()=>external_utils_index_js_namespaceObject.filterBase64Value,
    timeCostStrElement: ()=>misc_index_js_namespaceObject.timeCostStrElement,
    useEnvConfig: ()=>store_js_namespaceObject.useEnvConfig
});
const replay_scripts_js_namespaceObject = require("./utils/replay-scripts.js");
const store_js_namespaceObject = require("./store/store.js");
const color_js_namespaceObject = require("./utils/color.js");
const index_js_namespaceObject = require("./component/env-config/index.js");
const env_config_reminder_index_js_namespaceObject = require("./component/env-config-reminder/index.js");
const nav_actions_index_js_namespaceObject = require("./component/nav-actions/index.js");
const logo_index_js_namespaceObject = require("./component/logo/index.js");
const misc_index_js_namespaceObject = require("./component/misc/index.js");
const useTheme_js_namespaceObject = require("./hooks/useTheme.js");
const useServerValid_js_namespaceObject = require("./hooks/useServerValid.js");
const useTextTruncation_js_namespaceObject = require("./hooks/useTextTruncation.js");
const useSafeOverrideAIConfig_js_namespaceObject = require("./hooks/useSafeOverrideAIConfig.js");
const playground_result_index_js_namespaceObject = require("./component/playground-result/index.js");
const service_mode_control_index_js_namespaceObject = require("./component/service-mode-control/index.js");
const context_preview_index_js_namespaceObject = require("./component/context-preview/index.js");
const prompt_input_index_js_namespaceObject = require("./component/prompt-input/index.js");
const player_index_js_namespaceObject = require("./component/player/index.js");
const blackboard_index_js_namespaceObject = require("./component/blackboard/index.js");
const screenshot_viewer_index_js_namespaceObject = require("./component/screenshot-viewer/index.js");
var screenshot_viewer_index_js_default = /*#__PURE__*/ __webpack_require__.n(screenshot_viewer_index_js_namespaceObject);
const playground_utils_js_namespaceObject = require("./utils/playground-utils.js");
const external_utils_index_js_namespaceObject = require("./utils/index.js");
const shiny_text_index_js_namespaceObject = require("./component/shiny-text/index.js");
var shiny_text_index_js_default = /*#__PURE__*/ __webpack_require__.n(shiny_text_index_js_namespaceObject);
const universal_playground_index_js_namespaceObject = require("./component/universal-playground/index.js");
var universal_playground_index_js_default = /*#__PURE__*/ __webpack_require__.n(universal_playground_index_js_namespaceObject);
const storage_provider_js_namespaceObject = require("./component/universal-playground/providers/storage-provider.js");
const context_provider_js_namespaceObject = require("./component/universal-playground/providers/context-provider.js");
exports.AgentContextProvider = __webpack_exports__.AgentContextProvider;
exports.BaseContextProvider = __webpack_exports__.BaseContextProvider;
exports.Blackboard = __webpack_exports__.Blackboard;
exports.ContextPreview = __webpack_exports__.ContextPreview;
exports.EnvConfig = __webpack_exports__.EnvConfig;
exports.EnvConfigReminder = __webpack_exports__.EnvConfigReminder;
exports.IndexedDBStorageProvider = __webpack_exports__.IndexedDBStorageProvider;
exports.LocalStorageProvider = __webpack_exports__.LocalStorageProvider;
exports.Logo = __webpack_exports__.Logo;
exports.MemoryStorageProvider = __webpack_exports__.MemoryStorageProvider;
exports.NavActions = __webpack_exports__.NavActions;
exports.NoOpContextProvider = __webpack_exports__.NoOpContextProvider;
exports.NoOpStorageProvider = __webpack_exports__.NoOpStorageProvider;
exports.Player = __webpack_exports__.Player;
exports.PlaygroundResultView = __webpack_exports__.PlaygroundResultView;
exports.PromptInput = __webpack_exports__.PromptInput;
exports.ScreenshotViewer = __webpack_exports__.ScreenshotViewer;
exports.ServiceModeControl = __webpack_exports__.ServiceModeControl;
exports.ShinyText = __webpack_exports__.ShinyText;
exports.StaticContextProvider = __webpack_exports__.StaticContextProvider;
exports.StorageType = __webpack_exports__.StorageType;
exports.UniversalPlayground = __webpack_exports__.UniversalPlayground;
exports.UniversalPlaygroundDefault = __webpack_exports__.UniversalPlaygroundDefault;
exports.actionNameForType = __webpack_exports__.actionNameForType;
exports.allScriptsFromDump = __webpack_exports__.allScriptsFromDump;
exports.colorForName = __webpack_exports__.colorForName;
exports.createStorageProvider = __webpack_exports__.createStorageProvider;
exports.detectBestStorageType = __webpack_exports__.detectBestStorageType;
exports.extractDumpMetaInfo = __webpack_exports__.extractDumpMetaInfo;
exports.filterBase64Value = __webpack_exports__.filterBase64Value;
exports.fullTimeStrWithMilliseconds = __webpack_exports__.fullTimeStrWithMilliseconds;
exports.generateAnimationScripts = __webpack_exports__.generateAnimationScripts;
exports.getPlaceholderForType = __webpack_exports__.getPlaceholderForType;
exports.globalThemeConfig = __webpack_exports__.globalThemeConfig;
exports.highlightColorForType = __webpack_exports__.highlightColorForType;
exports.iconForStatus = __webpack_exports__.iconForStatus;
exports.notifyError = __webpack_exports__.notifyError;
exports.safeOverrideAIConfig = __webpack_exports__.safeOverrideAIConfig;
exports.staticAgentFromContext = __webpack_exports__.staticAgentFromContext;
exports.timeCostStrElement = __webpack_exports__.timeCostStrElement;
exports.timeStr = __webpack_exports__.timeStr;
exports.useEnvConfig = __webpack_exports__.useEnvConfig;
exports.useGlobalPreference = __webpack_exports__.useGlobalPreference;
exports.useSafeOverrideAIConfig = __webpack_exports__.useSafeOverrideAIConfig;
exports.useServerValid = __webpack_exports__.useServerValid;
exports.useTextTruncation = __webpack_exports__.useTextTruncation;
exports.useTheme = __webpack_exports__.useTheme;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "AgentContextProvider",
    "BaseContextProvider",
    "Blackboard",
    "ContextPreview",
    "EnvConfig",
    "EnvConfigReminder",
    "IndexedDBStorageProvider",
    "LocalStorageProvider",
    "Logo",
    "MemoryStorageProvider",
    "NavActions",
    "NoOpContextProvider",
    "NoOpStorageProvider",
    "Player",
    "PlaygroundResultView",
    "PromptInput",
    "ScreenshotViewer",
    "ServiceModeControl",
    "ShinyText",
    "StaticContextProvider",
    "StorageType",
    "UniversalPlayground",
    "UniversalPlaygroundDefault",
    "actionNameForType",
    "allScriptsFromDump",
    "colorForName",
    "createStorageProvider",
    "detectBestStorageType",
    "extractDumpMetaInfo",
    "filterBase64Value",
    "fullTimeStrWithMilliseconds",
    "generateAnimationScripts",
    "getPlaceholderForType",
    "globalThemeConfig",
    "highlightColorForType",
    "iconForStatus",
    "notifyError",
    "safeOverrideAIConfig",
    "staticAgentFromContext",
    "timeCostStrElement",
    "timeStr",
    "useEnvConfig",
    "useGlobalPreference",
    "useSafeOverrideAIConfig",
    "useServerValid",
    "useTextTruncation",
    "useTheme"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
