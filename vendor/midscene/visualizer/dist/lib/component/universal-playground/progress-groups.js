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
    getLastProgressItemIdsByGroup: ()=>getLastProgressItemIdsByGroup
});
function getLastProgressItemIdsByGroup(items) {
    const lastIds = new Set();
    for(let index = 0; index < items.length; index++){
        var _items_;
        const item = items[index];
        if ((null == item ? void 0 : item.type) === 'progress' && (null == (_items_ = items[index + 1]) ? void 0 : _items_.type) !== 'progress') lastIds.add(item.id);
    }
    return lastIds;
}
exports.getLastProgressItemIdsByGroup = __webpack_exports__.getLastProgressItemIdsByGroup;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "getLastProgressItemIdsByGroup"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
