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
    Logo: ()=>Logo,
    LogoUrl: ()=>LogoUrl
});
const jsx_runtime_namespaceObject = require("react/jsx-runtime");
const useTheme_js_namespaceObject = require("../../hooks/useTheme.js");
require("./index.css");
const LogoUrl = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/vhaeh7vhabf/Midscene.png';
const LogoUrlLight = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/nupipfups/Midscene/midscene_with_text_light.png';
const LogoUrlDark = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/nupipfups/Midscene/midscene_with_text_dark.png';
const Logo = ({ hideLogo = false })=>{
    const { isDarkMode } = (0, useTheme_js_namespaceObject.useTheme)();
    if (hideLogo) return null;
    const logoSrc = isDarkMode ? LogoUrlDark : LogoUrlLight;
    return /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("div", {
        className: "logo",
        children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("a", {
            href: "https://midscenejs.com/",
            target: "_blank",
            rel: "noreferrer",
            children: /*#__PURE__*/ (0, jsx_runtime_namespaceObject.jsx)("img", {
                alt: "Midscene_logo",
                src: logoSrc
            })
        })
    });
};
exports.Logo = __webpack_exports__.Logo;
exports.LogoUrl = __webpack_exports__.LogoUrl;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "Logo",
    "LogoUrl"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
