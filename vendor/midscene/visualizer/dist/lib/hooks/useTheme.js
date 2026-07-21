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
    useTheme: ()=>useTheme
});
const external_react_namespaceObject = require("react");
function useTheme() {
    const [isDarkMode, setIsDarkMode] = (0, external_react_namespaceObject.useState)(false);
    (0, external_react_namespaceObject.useEffect)(()=>{
        const checkTheme = ()=>{
            var _document_querySelector;
            const theme = null == (_document_querySelector = document.querySelector('[data-theme]')) ? void 0 : _document_querySelector.getAttribute('data-theme');
            setIsDarkMode('dark' === theme);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        const target = document.querySelector('[data-theme]') || document.documentElement;
        observer.observe(target, {
            attributes: true,
            attributeFilter: [
                'data-theme'
            ]
        });
        return ()=>observer.disconnect();
    }, []);
    return {
        isDarkMode
    };
}
exports.useTheme = __webpack_exports__.useTheme;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "useTheme"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
