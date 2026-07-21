function formatLocateExampleValue(value) {
    return Array.isArray(value) ? `[${value.join(', ')}]` : JSON.stringify(value);
}
function locateParamExample(prompt, promptSpec, exampleValue) {
    if (!promptSpec) return `{
    "prompt": ${JSON.stringify(prompt)}
  }`;
    return `{
    "prompt": ${JSON.stringify(prompt)},
    "${promptSpec.resultKey}": ${formatLocateExampleValue(exampleValue ?? promptSpec.exampleValues[0])}
  }`;
}
export { formatLocateExampleValue, locateParamExample };

//# sourceMappingURL=locate-param-example.mjs.map