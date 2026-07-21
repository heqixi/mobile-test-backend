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
    isTextTruncated: ()=>isTextTruncated,
    useTextTruncation: ()=>useTextTruncation
});
const external_react_namespaceObject = require("react");
function isTextTruncated(element, mode) {
    if (!element) return false;
    if ('multi-line' === mode) return element.scrollHeight - element.clientHeight > 1;
    return element.scrollWidth > element.clientWidth;
}
function useTextTruncation(content, mode) {
    const ref = (0, external_react_namespaceObject.useRef)(null);
    const [truncated, setTruncated] = (0, external_react_namespaceObject.useState)(false);
    const update = (0, external_react_namespaceObject.useCallback)(()=>{
        setTruncated(isTextTruncated(ref.current, mode));
    }, [
        mode
    ]);
    (0, external_react_namespaceObject.useLayoutEffect)(()=>{
        update();
        window.addEventListener('resize', update);
        if ('undefined' == typeof ResizeObserver || !ref.current) return ()=>window.removeEventListener('resize', update);
        const observer = new ResizeObserver(update);
        observer.observe(ref.current);
        return ()=>{
            window.removeEventListener('resize', update);
            observer.disconnect();
        };
    }, [
        content,
        update
    ]);
    return {
        ref,
        truncated
    };
}
exports.isTextTruncated = __webpack_exports__.isTextTruncated;
exports.useTextTruncation = __webpack_exports__.useTextTruncation;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "isTextTruncated",
    "useTextTruncation"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
