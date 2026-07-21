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
    shouldRenderCustomEmptyState: ()=>shouldRenderCustomEmptyState
});
function shouldRenderCustomEmptyState(infoList, emptyState) {
    var _infoList_;
    return void 0 !== emptyState && 1 === infoList.length && (null == (_infoList_ = infoList[0]) ? void 0 : _infoList_.id) === 'welcome';
}
exports.shouldRenderCustomEmptyState = __webpack_exports__.shouldRenderCustomEmptyState;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "shouldRenderCustomEmptyState"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
