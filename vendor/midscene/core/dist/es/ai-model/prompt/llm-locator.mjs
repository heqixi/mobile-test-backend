import { getPreferredLanguage } from "@midscene/shared/env";
import { locateGroundingRules } from "./locate-grounding-rules.mjs";
import { formatLocateExampleValue } from "./locate-param-example.mjs";
function systemPromptToLocateElement(promptSpec) {
    const preferredLanguage = getPreferredLanguage();
    const resultKey = promptSpec.resultKey;
    const exampleValueText = formatLocateExampleValue(promptSpec.exampleValues[0]);
    const resultFieldDescription = `the ${promptSpec.resultNoun} of the element that matches the user's description`;
    return `
## Role:
You are an AI assistant that helps identify UI elements.

## Objective:
- Identify elements in screenshots that match the user's description.
- Provide the coordinates of the element that matches the user's description.

${locateGroundingRules()}

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
export { findElementPrompt, systemPromptToLocateElement };

//# sourceMappingURL=llm-locator.mjs.map