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
    buildPromptWithContext: ()=>buildPromptWithContext
});
const buildPromptWithContext = (prompt, context)=>{
    const trimmedContext = context?.trim();
    if (!trimmedContext) return prompt;
    const promptText = 'string' == typeof prompt ? prompt : prompt.prompt;
    const promptWithContext = `Context for this request:\n${trimmedContext}\n\n${promptText}`;
    if ('string' == typeof prompt) return promptWithContext;
    return {
        ...prompt,
        prompt: promptWithContext
    };
};
exports.buildPromptWithContext = __webpack_exports__.buildPromptWithContext;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "buildPromptWithContext"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=prompt-context.js.map