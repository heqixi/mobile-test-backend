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
    systemPromptToLocateElement: ()=>systemPromptToLocateElement,
    findElementPrompt: ()=>findElementPrompt
});
const env_namespaceObject = require("@midscene/shared/env");
const external_locate_grounding_rules_js_namespaceObject = require("./locate-grounding-rules.js");
const external_locate_param_example_js_namespaceObject = require("./locate-param-example.js");
function systemPromptToLocateElement(promptSpec) {
    const preferredLanguage = (0, env_namespaceObject.getPreferredLanguage)();
    const resultKey = promptSpec.resultKey;
    const exampleValueText = (0, external_locate_param_example_js_namespaceObject.formatLocateExampleValue)(promptSpec.exampleValues[0]);
    const resultFieldDescription = `the ${promptSpec.resultNoun} of the element that matches the user's description`;
    return `
## Role:
You are an AI assistant that helps identify UI elements.

## Objective:
- Identify elements in screenshots that match the user's description.
- Provide the coordinates of the element that matches the user's description.

${(0, external_locate_grounding_rules_js_namespaceObject.locateGroundingRules)()}

## Output Format:
\`\`\`json
{
  "${resultKey}": ${promptSpec.resultValueSchema},  // ${promptSpec.resultValueDescription}
  "errors"?: string[]
}
\`\`\`

Fields:
* \`${resultKey}\` is ${resultFieldDescription}
* \`errors\` is an optional array of error messages (if any)

For example, when an element is found:
\`\`\`json
{
  "${resultKey}": ${exampleValueText},
  "errors": []
}
\`\`\`

When no element is found:
\`\`\`json
{
  "${resultKey}": [],
  "errors": ["I can see ..., but {some element} is not found. Use ${preferredLanguage}."]
}
\`\`\`
`;
}
const findElementPrompt = (targetElementDescription)=>`Find: ${targetElementDescription}`;
exports.findElementPrompt = __webpack_exports__.findElementPrompt;
exports.systemPromptToLocateElement = __webpack_exports__.systemPromptToLocateElement;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "findElementPrompt",
    "systemPromptToLocateElement"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=llm-locator.js.map