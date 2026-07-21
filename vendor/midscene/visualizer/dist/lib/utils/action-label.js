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
    actionNameForType: ()=>actionNameForType,
    getPromptInputActionLabel: ()=>getPromptInputActionLabel
});
const actionNameForType = (type)=>{
    if (!type) return '';
    if ('aiAct' === type) return 'Action';
    const typeWithoutAi = type.startsWith('ai') ? type.slice(2) : type;
    if (typeWithoutAi.startsWith('IOS')) return typeWithoutAi.substring(3).replace(/([A-Z])/g, ' $1').replace(/^/, 'IOS').trim();
    const fullName = typeWithoutAi.replace(/([A-Z])/g, ' $1').trim();
    const words = fullName.split(' ');
    const result = words.length > 3 ? words.slice(-3).join(' ') : fullName;
    return result.replace(/\b\w/g, (c)=>c.toUpperCase());
};
const getPromptInputActionLabel = (type, overrideLabel)=>{
    if (overrideLabel) return overrideLabel;
    return actionNameForType(type) || 'Action';
};
exports.actionNameForType = __webpack_exports__.actionNameForType;
exports.getPromptInputActionLabel = __webpack_exports__.getPromptInputActionLabel;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "actionNameForType",
    "getPromptInputActionLabel"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
