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
    extractJSONFromCodeBlock: ()=>extractJSONFromCodeBlock,
    parseModelResponseJson: ()=>parseModelResponseJson
});
const external_jsonrepair_namespaceObject = require("jsonrepair");
function extractJSONFromCodeBlock(response) {
    try {
        const jsonMatch = response.match(/^\s*(\{[\s\S]*\})\s*$/);
        if (jsonMatch) return jsonMatch[1];
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) return codeBlockMatch[1];
        const jsonLikeMatch = response.match(/\{[\s\S]*\}/);
        if (jsonLikeMatch) return jsonLikeMatch[0];
    } catch  {}
    return response;
}
function trimParsedJsonStrings(obj, context = {}) {
    if (null == obj) return obj;
    if (Array.isArray(obj)) return obj.map((item)=>trimParsedJsonStrings(item, context));
    if ('object' == typeof obj) {
        const normalized = {};
        for (const [key, value] of Object.entries(obj)){
            const trimmedKey = key.trim();
            const preserveStringValue = context.preserveStringValueKeys?.includes(trimmedKey) ?? false;
            const normalizedValue = 'string' == typeof value ? preserveStringValue ? value : value.trim() : trimParsedJsonStrings(value, context);
            normalized[trimmedKey] = normalizedValue;
        }
        return normalized;
    }
    if ('string' == typeof obj) return obj.trim();
    return obj;
}
function repairKnownJsonIssues(jsonBlock, _rawResponse) {
    return jsonBlock;
}
function assertJsonObject(parsed) {
    if (!parsed || 'object' != typeof parsed || Array.isArray(parsed)) throw new Error(`expected parsed LLM response to be a JSON object, got ${JSON.stringify(parsed)}`);
}
function parseJsonWithRepair(jsonStr) {
    try {
        return JSON.parse(jsonStr);
    } catch  {
        return JSON.parse((0, external_jsonrepair_namespaceObject.jsonrepair)(jsonStr));
    }
}
function parseModelResponseJson(raw, context) {
    const cleanJsonString = extractJSONFromCodeBlock(raw);
    const requireObject = context?.requireObject ?? true;
    let parsedObj;
    try {
        parsedObj = parseJsonWithRepair(cleanJsonString);
        if (requireObject) assertJsonObject(parsedObj);
    } catch (e1) {
        const code = repairKnownJsonIssues(cleanJsonString, raw);
        if (code === cleanJsonString) throw new Error(`failed to parse LLM response into JSON. Error - ${String(e1)}. Response - \n ${raw}`);
        try {
            parsedObj = parseJsonWithRepair(code);
            if (requireObject) assertJsonObject(parsedObj);
        } catch (e2) {
            throw new Error(`failed to parse LLM response into JSON. First error - ${String(e1)}. Second error - ${String(e2)}. Response - \n ${raw}`);
        }
    }
    return trimParsedJsonStrings(parsedObj, context);
}
exports.extractJSONFromCodeBlock = __webpack_exports__.extractJSONFromCodeBlock;
exports.parseModelResponseJson = __webpack_exports__.parseModelResponseJson;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "extractJSONFromCodeBlock",
    "parseModelResponseJson"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=json.js.map