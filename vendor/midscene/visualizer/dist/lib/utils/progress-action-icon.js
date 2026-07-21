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
    defaultProgressErrorIcon: ()=>defaultProgressErrorIcon,
    defaultProgressActionIcon: ()=>defaultProgressActionIcon,
    resolveProgressActionIcon: ()=>resolveProgressActionIcon
});
const external_react_namespaceObject = require("react");
function CompletedActionIcon() {
    return /*#__PURE__*/ (0, external_react_namespaceObject.createElement)('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        focusable: false
    }, /*#__PURE__*/ (0, external_react_namespaceObject.createElement)('path', {
        d: 'M3 7.99984L6.33333 11.3332L13 4.6665',
        stroke: '#188F4D',
        strokeWidth: '1.2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    }));
}
function FailedActionIcon() {
    return /*#__PURE__*/ (0, external_react_namespaceObject.createElement)('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        focusable: false
    }, /*#__PURE__*/ (0, external_react_namespaceObject.createElement)('path', {
        d: 'M5 5L11 11M11 5L5 11',
        stroke: '#FF4D4F',
        strokeWidth: '1.2',
        strokeLinecap: 'round'
    }));
}
function defaultProgressActionIcon(_kind) {
    return /*#__PURE__*/ (0, external_react_namespaceObject.createElement)(CompletedActionIcon);
}
function defaultProgressErrorIcon() {
    return /*#__PURE__*/ (0, external_react_namespaceObject.createElement)(FailedActionIcon);
}
function resolveProgressActionIcon(kind, override) {
    if (!kind) return null;
    if (override) {
        const custom = override(kind);
        if (void 0 !== custom) return custom;
    }
    return defaultProgressActionIcon(kind);
}
exports.defaultProgressActionIcon = __webpack_exports__.defaultProgressActionIcon;
exports.defaultProgressErrorIcon = __webpack_exports__.defaultProgressErrorIcon;
exports.resolveProgressActionIcon = __webpack_exports__.resolveProgressActionIcon;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "defaultProgressActionIcon",
    "defaultProgressErrorIcon",
    "resolveProgressActionIcon"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
