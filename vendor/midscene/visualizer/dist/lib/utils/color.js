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
    colorForName: ()=>colorForName,
    globalThemeConfig: ()=>globalThemeConfig,
    highlightColorForType: ()=>highlightColorForType
});
const elementColor = [
    '#01204E'
];
const highlightColorForSearchArea = '#028391';
const highlightColorForElement = '#fd5907';
function djb2Hash(str) {
    if (!str) str = 'unnamed';
    let hash = 5381;
    for(let i = 0; i < str.length; i++)hash = (hash << 5) + hash + str.charCodeAt(i);
    return hash >>> 0;
}
function colorForName(name) {
    const hashNumber = djb2Hash(name);
    return elementColor[hashNumber % elementColor.length];
}
function highlightColorForType(type) {
    if ('searchArea' === type) return highlightColorForSearchArea;
    return highlightColorForElement;
}
function globalThemeConfig() {
    return {
        token: {
            colorPrimary: '#2B83FF'
        },
        components: {
            Layout: {
                headerHeight: 60,
                headerPadding: '0 30px',
                headerBg: '#FFF',
                bodyBg: '#FFF'
            }
        }
    };
}
exports.colorForName = __webpack_exports__.colorForName;
exports.globalThemeConfig = __webpack_exports__.globalThemeConfig;
exports.highlightColorForType = __webpack_exports__.highlightColorForType;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "colorForName",
    "globalThemeConfig",
    "highlightColorForType"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
