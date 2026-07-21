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
    prepareModelImage: ()=>prepareModelImage
});
const img_namespaceObject = require("@midscene/shared/img");
async function prepareModelImage(options) {
    const { imageBase64, width, height, policy } = options;
    let preparedImageBase64 = imageBase64;
    let modelWidth = width;
    let modelHeight = height;
    if (void 0 !== policy.padBlockSize) {
        const paddedResult = await (0, img_namespaceObject.paddingToMatchBlockByBase64)(imageBase64, policy.padBlockSize);
        preparedImageBase64 = paddedResult.imageBase64;
        modelWidth = paddedResult.width;
        modelHeight = paddedResult.height;
    }
    return {
        imageBase64: preparedImageBase64,
        preparedSize: {
            width: modelWidth,
            height: modelHeight
        },
        contentSize: {
            width,
            height
        }
    };
}
exports.prepareModelImage = __webpack_exports__.prepareModelImage;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "prepareModelImage"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=image-preprocess.js.map