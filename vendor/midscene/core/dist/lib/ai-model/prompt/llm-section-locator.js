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
    sectionLocatorInstruction: ()=>sectionLocatorInstruction,
    systemPromptToLocateSection: ()=>systemPromptToLocateSection
});
const env_namespaceObject = require("@midscene/shared/env");
const external_locate_param_example_js_namespaceObject = require("./locate-param-example.js");
function systemPromptToLocateSection(promptSpec) {
    const preferredLanguage = (0, env_namespaceObject.getPreferredLanguage)();
    const resultKey = promptSpec.resultKey;
    const exampleValueText = (0, external_locate_param_example_js_namespaceObject.formatLocateExampleValue)(promptSpec.exampleValues[0]);
    const resultJsonProperty = `"${resultKey}": ${promptSpec.resultValueSchema},  // ${promptSpec.resultValueDescription}`;
    const resultValueType = promptSpec.resultValueSchema;
    const resultFieldDescription = `${promptSpec.resultNoun} of the section containing the target element`;
    const referenceFieldDescription = `Optional array of ${promptSpec.resultNounPlural} of reference elements`;
    return `
## Role:
You are an AI assistant that helps identify UI elements.

## Objective:
- Find a section containing the target element
- If the description mentions reference elements, also locate sections containing those references

## Output Format:
\`\`\`json
{
  ${resultJsonProperty}
  "references_${resultKey}"?: [
    ${resultValueType},
    ...
  ],
  "error"?: string
}
\`\`\`

Fields:
* \`${resultKey}\` - ${resultFieldDescription}
* \`references_${resultKey}\` - ${referenceFieldDescription}
* \`error\` - Optional error message if the section cannot be found. Use ${preferredLanguage}.

Example:
If the description is "delete button on the second row with title 'Peter'", return:
\`\`\`json
{
  "${resultKey}": ${exampleValueText},
  "references_${resultKey}": [${exampleValueText}]
}
\`\`\`
`;
}
const sectionLocatorInstruction = (sectionDescription)=>`Find section containing: ${sectionDescription}`;
exports.sectionLocatorInstruction = __webpack_exports__.sectionLocatorInstruction;
exports.systemPromptToLocateSection = __webpack_exports__.systemPromptToLocateSection;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "sectionLocatorInstruction",
    "systemPromptToLocateSection"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=llm-section-locator.js.map