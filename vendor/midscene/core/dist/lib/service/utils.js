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
    DESCRIBE_DEEP_CONTEXT_CONFIG: ()=>DESCRIBE_DEEP_CONTEXT_CONFIG,
    getDescribeDeepContextAreas: ()=>getDescribeDeepContextAreas,
    DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS: ()=>DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS,
    getDescribeDeepLocateResizeSize: ()=>getDescribeDeepLocateResizeSize,
    recoverDescribeResponseFromParseError: ()=>recoverDescribeResponseFromParseError,
    clampRect: ()=>clampRect,
    getRectInCrop: ()=>getRectInCrop,
    DESCRIBE_POINT_MARKER_MAX_SIZE: ()=>DESCRIBE_POINT_MARKER_MAX_SIZE,
    DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH: ()=>DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH,
    getDescribeMarkerBorderThickness: ()=>getDescribeMarkerBorderThickness,
    createServiceDump: ()=>createServiceDump,
    getDescribeMarkerRect: ()=>getDescribeMarkerRect,
    DESCRIBE_RECT_MARKER_BORDER_THICKNESS: ()=>DESCRIBE_RECT_MARKER_BORDER_THICKNESS
});
const index_js_namespaceObject = require("../ai-model/service-caller/index.js");
const external_common_js_namespaceObject = require("../common.js");
const utils_namespaceObject = require("@midscene/shared/utils");
const DESCRIBE_POINT_MARKER_MAX_SIZE = 40;
const DESCRIBE_RECT_MARKER_BORDER_THICKNESS = 1;
const DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS = 2;
const DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH = 100;
const DESCRIBE_WIDE_MARKER_HORIZONTAL_INSET_RATIO = 0.15;
const DESCRIBE_WIDE_MARKER_VERTICAL_INSET_RATIO = 0.1;
const DESCRIBE_DEEP_CONTEXT_CONFIG = {
    resize: {
        cropMaxLongEdge: 1000,
        cropUpscaleMaxRatio: 2
    }
};
function clampRect(rect, size) {
    const width = Math.min(rect.width, size.width);
    const height = Math.min(rect.height, size.height);
    return {
        left: Math.max(0, Math.min(rect.left, size.width - width)),
        top: Math.max(0, Math.min(rect.top, size.height - height)),
        width,
        height
    };
}
function getDescribeDeepContextAreas(rect, screenSize) {
    return [
        {
            kind: 'focused',
            rect: (0, external_common_js_namespaceObject.expandSearchArea)(rect, screenSize)
        }
    ];
}
function getRectInCrop(rect, cropRect, cropSize) {
    return clampRect({
        left: rect.left - cropRect.left,
        top: rect.top - cropRect.top,
        width: rect.width,
        height: rect.height
    }, cropSize);
}
function getDescribeMarkerRect(rect) {
    if (rect.width < DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH) return rect;
    const horizontalInset = Math.round(rect.width * DESCRIBE_WIDE_MARKER_HORIZONTAL_INSET_RATIO);
    const verticalInset = Math.round(rect.height * DESCRIBE_WIDE_MARKER_VERTICAL_INSET_RATIO);
    return {
        left: rect.left + horizontalInset,
        top: rect.top + verticalInset,
        width: Math.max(rect.width - 2 * horizontalInset, 1),
        height: Math.max(rect.height - 2 * verticalInset, 1)
    };
}
function getDescribeMarkerBorderThickness(rect) {
    return rect.width <= DESCRIBE_POINT_MARKER_MAX_SIZE && rect.height <= DESCRIBE_POINT_MARKER_MAX_SIZE ? DESCRIBE_RECT_MARKER_BORDER_THICKNESS : DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS;
}
function getDescribeDeepLocateResizeSize(size) {
    const maxEdge = Math.max(size.width, size.height);
    if (!maxEdge) return;
    const { resize } = DESCRIBE_DEEP_CONTEXT_CONFIG;
    const scale = Math.min(resize.cropUpscaleMaxRatio, resize.cropMaxLongEdge / maxEdge);
    if (scale <= 1.05) return;
    return {
        width: Math.round(size.width * scale),
        height: Math.round(size.height * scale)
    };
}
function createServiceDump(data) {
    const baseData = {
        logTime: Date.now()
    };
    const finalData = {
        logId: (0, utils_namespaceObject.uuid)(),
        ...baseData,
        ...data
    };
    return finalData;
}
function readNextSignificantChar(input, startIndex) {
    let index = startIndex;
    while(index < input.length && /\s/.test(input[index]))index += 1;
    return input[index];
}
function extractPossiblyMalformedStringField(input, fieldName) {
    const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fieldStart = new RegExp(`"${escapedFieldName}"\\s*:\\s*"`).exec(input);
    if (!fieldStart) return;
    let index = fieldStart.index + fieldStart[0].length;
    let escaped = false;
    let valueForJsonParse = '';
    for(; index < input.length; index += 1){
        const char = input[index];
        if (escaped) {
            valueForJsonParse += char;
            escaped = false;
            continue;
        }
        if ('\\' === char) {
            valueForJsonParse += char;
            escaped = true;
            continue;
        }
        if ('"' !== char) {
            valueForJsonParse += char;
            continue;
        }
        const nextSignificantChar = readNextSignificantChar(input, index + 1);
        if (',' === nextSignificantChar || '}' === nextSignificantChar || ']' === nextSignificantChar || void 0 === nextSignificantChar) try {
            return JSON.parse(`"${valueForJsonParse}"`);
        } catch  {
            return valueForJsonParse;
        }
        valueForJsonParse += '\\"';
    }
}
function recoverDescribeResponseFromParseError(error) {
    const message = error instanceof Error ? error.message : String(error);
    const rawResponse = error instanceof index_js_namespaceObject.AIResponseParseError ? error.rawResponse : message.match(/Response -\s*\n\s*([\s\S]*)$/)?.[1];
    if (!rawResponse || !message.includes('failed to parse LLM response into JSON') && !(error instanceof index_js_namespaceObject.AIResponseParseError)) return;
    const jsonLikeResponse = (0, index_js_namespaceObject.extractJSONFromCodeBlock)(rawResponse);
    const description = extractPossiblyMalformedStringField(jsonLikeResponse, "description")?.trim();
    if (!description) return;
    return {
        description
    };
}
exports.DESCRIBE_DEEP_CONTEXT_CONFIG = __webpack_exports__.DESCRIBE_DEEP_CONTEXT_CONFIG;
exports.DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS = __webpack_exports__.DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS;
exports.DESCRIBE_POINT_MARKER_MAX_SIZE = __webpack_exports__.DESCRIBE_POINT_MARKER_MAX_SIZE;
exports.DESCRIBE_RECT_MARKER_BORDER_THICKNESS = __webpack_exports__.DESCRIBE_RECT_MARKER_BORDER_THICKNESS;
exports.DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH = __webpack_exports__.DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH;
exports.clampRect = __webpack_exports__.clampRect;
exports.createServiceDump = __webpack_exports__.createServiceDump;
exports.getDescribeDeepContextAreas = __webpack_exports__.getDescribeDeepContextAreas;
exports.getDescribeDeepLocateResizeSize = __webpack_exports__.getDescribeDeepLocateResizeSize;
exports.getDescribeMarkerBorderThickness = __webpack_exports__.getDescribeMarkerBorderThickness;
exports.getDescribeMarkerRect = __webpack_exports__.getDescribeMarkerRect;
exports.getRectInCrop = __webpack_exports__.getRectInCrop;
exports.recoverDescribeResponseFromParseError = __webpack_exports__.recoverDescribeResponseFromParseError;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "DESCRIBE_DEEP_CONTEXT_CONFIG",
    "DESCRIBE_LARGE_RECT_MARKER_BORDER_THICKNESS",
    "DESCRIBE_POINT_MARKER_MAX_SIZE",
    "DESCRIBE_RECT_MARKER_BORDER_THICKNESS",
    "DESCRIBE_WIDE_MARKER_INSET_MIN_WIDTH",
    "clampRect",
    "createServiceDump",
    "getDescribeDeepContextAreas",
    "getDescribeDeepLocateResizeSize",
    "getDescribeMarkerBorderThickness",
    "getDescribeMarkerRect",
    "getRectInCrop",
    "recoverDescribeResponseFromParseError"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=utils.js.map