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
    withCliVerboseContext: ()=>external_verbose_js_namespaceObject.withCliVerboseContext,
    attachCliVerboseDumpListener: ()=>external_verbose_js_namespaceObject.attachCliVerboseDumpListener,
    emitCliVerboseEvent: ()=>external_verbose_js_namespaceObject.emitCliVerboseEvent,
    getCliVerboseContext: ()=>external_verbose_js_namespaceObject.getCliVerboseContext,
    parseValue: ()=>external_cli_args_js_namespaceObject.parseValue,
    reportCLIError: ()=>external_cli_error_js_namespaceObject.reportCLIError,
    CLIError: ()=>external_cli_error_js_namespaceObject.CLIError,
    parseCliArgs: ()=>external_cli_args_js_namespaceObject.parseCliArgs,
    runToolsCLI: ()=>external_cli_runner_js_namespaceObject.runToolsCLI,
    isCliVerboseEnabled: ()=>external_verbose_js_namespaceObject.isCliVerboseEnabled,
    stripVerboseFlag: ()=>external_verbose_js_namespaceObject.stripVerboseFlag,
    removePrefix: ()=>external_cli_runner_js_namespaceObject.removePrefix
});
const external_cli_error_js_namespaceObject = require("./cli-error.js");
const external_cli_args_js_namespaceObject = require("./cli-args.js");
const external_cli_runner_js_namespaceObject = require("./cli-runner.js");
const external_verbose_js_namespaceObject = require("./verbose.js");
exports.CLIError = __webpack_exports__.CLIError;
exports.attachCliVerboseDumpListener = __webpack_exports__.attachCliVerboseDumpListener;
exports.emitCliVerboseEvent = __webpack_exports__.emitCliVerboseEvent;
exports.getCliVerboseContext = __webpack_exports__.getCliVerboseContext;
exports.isCliVerboseEnabled = __webpack_exports__.isCliVerboseEnabled;
exports.parseCliArgs = __webpack_exports__.parseCliArgs;
exports.parseValue = __webpack_exports__.parseValue;
exports.removePrefix = __webpack_exports__.removePrefix;
exports.reportCLIError = __webpack_exports__.reportCLIError;
exports.runToolsCLI = __webpack_exports__.runToolsCLI;
exports.stripVerboseFlag = __webpack_exports__.stripVerboseFlag;
exports.withCliVerboseContext = __webpack_exports__.withCliVerboseContext;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "CLIError",
    "attachCliVerboseDumpListener",
    "emitCliVerboseEvent",
    "getCliVerboseContext",
    "isCliVerboseEnabled",
    "parseCliArgs",
    "parseValue",
    "removePrefix",
    "reportCLIError",
    "runToolsCLI",
    "stripVerboseFlag",
    "withCliVerboseContext"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
