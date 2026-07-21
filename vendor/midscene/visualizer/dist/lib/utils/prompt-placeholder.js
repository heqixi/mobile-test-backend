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
    getPlaceholderForType: ()=>getPlaceholderForType
});
const getPlaceholderForType = (type)=>{
    if ('aiQuery' === type) return 'What do you want to query?';
    if ('aiAssert' === type) return 'What do you want to assert?';
    if ('aiTap' === type) return 'What element do you want to tap?';
    if ('aiDoubleClick' === type) return 'What element do you want to double-click?';
    if ('aiHover' === type) return 'What element do you want to hover over?';
    if ('aiInput' === type) return 'Format: <value> | <element>\nExample: hello world | search box';
    if ('aiRightClick' === type) return 'What element do you want to right-click?';
    if ('aiKeyboardPress' === type) return 'Format: <key> | <element (optional)>\nExample: Enter | text field';
    if ('aiScroll' === type) return 'Format: <direction> <amount> | <element (optional)>\nExample: down 500 | main content';
    if ('aiLocate' === type) return 'What element do you want to locate?';
    if ('aiBoolean' === type) return 'What do you want to check (returns true/false)?';
    if ('aiNumber' === type) return 'What number do you want to extract?';
    if ('aiString' === type) return 'What text do you want to extract?';
    if ('aiAsk' === type) return 'What do you want to ask?';
    if ('aiWaitFor' === type) return 'What condition do you want to wait for?';
    return 'What do you want to do?';
};
exports.getPlaceholderForType = __webpack_exports__.getPlaceholderForType;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "getPlaceholderForType"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
