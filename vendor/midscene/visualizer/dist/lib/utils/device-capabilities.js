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
    getDeviceCapabilities: ()=>getDeviceCapabilities,
    hasDeviceSpecificConfig: ()=>hasDeviceSpecificConfig
});
function getDeviceCapabilities(deviceType) {
    return {
        supportsImeStrategy: 'android' === deviceType,
        supportsKeyboardDismissStrategy: 'android' === deviceType || 'harmony' === deviceType,
        supportsAutoDismissKeyboard: 'android' === deviceType || 'ios' === deviceType || 'harmony' === deviceType,
        supportsAlwaysRefreshScreenInfo: 'android' === deviceType
    };
}
function hasDeviceSpecificConfig(deviceType) {
    const capabilities = getDeviceCapabilities(deviceType);
    return Object.values(capabilities).some(Boolean);
}
exports.getDeviceCapabilities = __webpack_exports__.getDeviceCapabilities;
exports.hasDeviceSpecificConfig = __webpack_exports__.hasDeviceSpecificConfig;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "getDeviceCapabilities",
    "hasDeviceSpecificConfig"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
