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
    parseUiTarsPlanningResponse: ()=>parseUiTarsPlanningResponse
});
const logger_namespaceObject = require("@midscene/shared/logger");
const action_parser_namespaceObject = require("@ui-tars/action-parser");
const debug = (0, logger_namespaceObject.getDebug)('ui-tars-planning');
function parseUiTarsPlanningResponse(rawResponse, shotSize, uiTarsModelVersion) {
    const convertedText = convertBboxToCoordinates(rawResponse);
    const parseResult = (0, action_parser_namespaceObject.actionParser)({
        prediction: convertedText,
        factor: [
            1000,
            1000
        ],
        screenContext: {
            width: shotSize.width,
            height: shotSize.height
        },
        modelVer: uiTarsModelVersion
    });
    debug('ui-tars modelVer', uiTarsModelVersion, ', parsed', JSON.stringify(parseResult.parsed));
    return {
        rawResponse,
        actions: parseResult.parsed
    };
}
function convertBboxToCoordinates(text) {
    const pattern = /<bbox>(\d+)\s+(\d+)\s+(\d+)\s+(\d+)<\/bbox>/g;
    function replaceMatch(match, x1, y1, x2, y2) {
        const x1Num = Number.parseInt(x1, 10);
        const y1Num = Number.parseInt(y1, 10);
        const x2Num = Number.parseInt(x2, 10);
        const y2Num = Number.parseInt(y2, 10);
        const x = Math.floor((x1Num + x2Num) / 2);
        const y = Math.floor((y1Num + y2Num) / 2);
        return `(${x},${y})`;
    }
    const cleanedText = text.replace(/\[EOS\]/g, '').replace(/```(?:[a-zA-Z0-9_-]+)?/g, '');
    return cleanedText.replace(pattern, replaceMatch).trim();
}
exports.parseUiTarsPlanningResponse = __webpack_exports__.parseUiTarsPlanningResponse;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "parseUiTarsPlanningResponse"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=parser.js.map