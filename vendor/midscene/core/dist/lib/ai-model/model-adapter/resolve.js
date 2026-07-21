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
    ResolvedModelAdapter: ()=>ResolvedModelAdapter
});
const json_js_namespaceObject = require("../service-caller/json.js");
const external_chat_completion_js_namespaceObject = require("./chat-completion.js");
const external_locate_js_namespaceObject = require("./locate.js");
const external_planning_js_namespaceObject = require("./planning.js");
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
function resolveJsonParser(jsonParser) {
    if (!jsonParser || 'lenient-json' === jsonParser) return json_js_namespaceObject.parseModelResponseJson;
    if ('function' == typeof jsonParser) return jsonParser;
    throw new Error(`Unknown json parser preset: ${jsonParser}`);
}
function resolveImagePreprocess(imagePreprocess) {
    return {
        padBlockSize: imagePreprocess?.padBlockSize
    };
}
class ResolvedModelAdapter {
    constructor(config, modelFamily){
        _define_property(this, "jsonParser", void 0);
        _define_property(this, "chatCompletion", void 0);
        _define_property(this, "imagePreprocess", void 0);
        _define_property(this, "planning", void 0);
        _define_property(this, "locate", void 0);
        this.jsonParser = resolveJsonParser(config.jsonParser);
        this.chatCompletion = (0, external_chat_completion_js_namespaceObject.resolveChatCompletion)(config.chatCompletion);
        this.imagePreprocess = resolveImagePreprocess(config.imagePreprocess);
        const customPlanner = config.planning?.kind === 'custom' ? config.planning.planner : void 0;
        const resolvedCustomPlanner = customPlanner ? (0, external_planning_js_namespaceObject.resolveCustomPlanningDefinition)(customPlanner) : void 0;
        this.planning = (0, external_planning_js_namespaceObject.resolvePlanning)(config.planning, resolvedCustomPlanner);
        this.locate = (0, external_locate_js_namespaceObject.resolveLocate)(config.locate, resolvedCustomPlanner);
    }
}
exports.ResolvedModelAdapter = __webpack_exports__.ResolvedModelAdapter;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "ResolvedModelAdapter"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=resolve.js.map