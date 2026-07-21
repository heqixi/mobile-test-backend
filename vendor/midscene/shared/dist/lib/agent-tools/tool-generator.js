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
    generateCommonTools: ()=>generateCommonTools,
    generateToolsFromActionSpace: ()=>generateToolsFromActionSpace,
    composeUserPrompt: ()=>external_user_prompt_js_namespaceObject.composeUserPrompt
});
const img_namespaceObject = require("@midscene/shared/img");
const external_zod_namespaceObject = require("zod");
const verbose_js_namespaceObject = require("../cli/verbose.js");
const external_zod_schema_utils_js_namespaceObject = require("../zod-schema-utils.js");
const external_error_formatter_js_namespaceObject = require("./error-formatter.js");
const external_user_prompt_js_namespaceObject = require("./user-prompt.js");
function describeActionForTool(action) {
    const actionDesc = action.description || `Execute ${action.name} action`;
    if (!action.paramSchema) return `${action.name} action, ${actionDesc}`;
    const shape = getZodObjectShape(action.paramSchema);
    if (!shape) {
        const typeName = (0, external_zod_schema_utils_js_namespaceObject.getZodTypeName)(action.paramSchema);
        const description = (0, external_zod_schema_utils_js_namespaceObject.getZodDescription)(action.paramSchema);
        const paramDesc = description ? `${typeName} - ${description}` : typeName;
        return `${action.name} action, ${actionDesc}. Parameter: ${paramDesc}`;
    }
    const paramDescriptions = [];
    for (const [key, field] of Object.entries(shape))if (field && 'object' == typeof field) {
        const isFieldOptional = 'function' == typeof field.isOptional && field.isOptional();
        const typeName = (0, external_zod_schema_utils_js_namespaceObject.getZodTypeName)(field);
        const description = (0, external_zod_schema_utils_js_namespaceObject.getZodDescription)(field);
        let paramStr = `${key}${isFieldOptional ? '?' : ''} (${typeName})`;
        if (description) paramStr += ` - ${description}`;
        paramDescriptions.push(paramStr);
    }
    if (0 === paramDescriptions.length) return `${action.name} action, ${actionDesc}`;
    return `${action.name} action, ${actionDesc}. Parameters: ${paramDescriptions.join('; ')}`;
}
function isZodOptional(value) {
    return '_def' in value && value._def?.typeName === 'ZodOptional';
}
function unwrapOptional(value) {
    if (isZodOptional(value)) return {
        innerValue: value._def.innerType,
        isOptional: true
    };
    return {
        innerValue: value,
        isOptional: false
    };
}
function getZodObjectShape(value) {
    if (!value) return;
    const actualValue = (0, external_zod_schema_utils_js_namespaceObject.unwrapZodField)(value);
    if (actualValue._def?.typeName !== 'ZodObject') return;
    if ('function' == typeof actualValue._def.shape) return actualValue._def.shape();
    return actualValue.shape;
}
function isRecord(value) {
    return 'object' == typeof value && null !== value && !Array.isArray(value);
}
function makePromptOptional(shape, wrapInOptional, description) {
    const newShape = {
        ...shape
    };
    newShape.prompt = shape.prompt.optional();
    let newSchema = external_zod_namespaceObject.z.object(newShape).passthrough();
    if (wrapInOptional) newSchema = newSchema.optional();
    if (description) newSchema = newSchema.describe(description);
    return newSchema;
}
function transformSchemaField(key, value) {
    const { innerValue, isOptional } = unwrapOptional(value);
    const shape = getZodObjectShape(innerValue);
    if (shape && (0, external_zod_schema_utils_js_namespaceObject.isMidsceneLocatorField)(innerValue)) return [
        key,
        makePromptOptional(shape, isOptional, (0, external_zod_schema_utils_js_namespaceObject.getZodDescription)(value))
    ];
    return [
        key,
        value
    ];
}
function extractActionSchema(paramSchema, actionName) {
    if (!paramSchema) return {};
    const shape = getZodObjectShape(paramSchema);
    if (!shape) {
        const typeName = paramSchema?._def?.typeName ?? 'unknown';
        throw new Error(`Action "${actionName}" declared a non-object paramSchema (${typeName}). CLI tool schemas must be a ZodObject (e.g. z.object({ uri: z.string() })) or undefined. Wrap primitive fields in an object schema.`);
    }
    return Object.fromEntries(Object.entries(shape).map(([key, value])=>transformSchemaField(key, value)));
}
function getPromptText(prompt) {
    if ('string' == typeof prompt) return prompt;
    if (isRecord(prompt) && 'string' == typeof prompt.prompt) return prompt.prompt;
}
function moveLocateExtrasIntoPrompt(value, locateFieldKeys) {
    const promptText = getPromptText(value.prompt);
    if (!promptText) return value;
    const normalizedPrompt = isRecord(value.prompt) ? {
        ...value.prompt
    } : {
        prompt: promptText
    };
    const normalizedLocate = {};
    let movedExtraField = false;
    for (const [key, fieldValue] of Object.entries(value))if ('prompt' !== key) {
        if (locateFieldKeys.has(key)) {
            normalizedLocate[key] = fieldValue;
            continue;
        }
        movedExtraField = true;
        if (!(key in normalizedPrompt)) normalizedPrompt[key] = fieldValue;
    }
    if (!movedExtraField) return value;
    return {
        ...normalizedLocate,
        prompt: normalizedPrompt
    };
}
function normalizeLocateLikeArg(value, fieldSchema) {
    if ('string' == typeof value) return {
        prompt: value
    };
    if (!isRecord(value)) return value;
    const shape = getZodObjectShape(fieldSchema);
    if (!shape) return value;
    return moveLocateExtrasIntoPrompt(value, new Set(Object.keys(shape)));
}
function normalizeActionArgs(args, paramSchema) {
    if (!paramSchema) return args;
    const shape = getZodObjectShape(paramSchema);
    if (!shape) return args;
    return Object.fromEntries(Object.entries(args).map(([key, value])=>{
        const fieldSchema = shape[key];
        if (!fieldSchema) return [
            key,
            value
        ];
        if ((0, external_zod_schema_utils_js_namespaceObject.isMidsceneLocatorField)(fieldSchema)) return [
            key,
            normalizeLocateLikeArg(value, fieldSchema)
        ];
        return [
            key,
            value
        ];
    }));
}
function mergeLocateDefaults(locate, defaults) {
    let merged;
    for (const [key, value] of Object.entries(defaults))if (void 0 === locate[key]) {
        if ('deepLocate' !== key || void 0 === locate.deepThink) {
            merged = merged ?? {
                ...locate
            };
            merged[key] = value;
        }
    }
    return merged ?? locate;
}
function applyLocateDefaults(args, paramSchema, locateDefaults) {
    if (!paramSchema || 0 === Object.keys(locateDefaults).length) return args;
    const shape = getZodObjectShape(paramSchema);
    if (!shape) return args;
    return Object.fromEntries(Object.entries(args).map(([key, value])=>{
        const fieldSchema = shape[key];
        if (fieldSchema && (0, external_zod_schema_utils_js_namespaceObject.isMidsceneLocatorField)(fieldSchema) && isRecord(value)) return [
            key,
            mergeLocateDefaults(value, locateDefaults)
        ];
        return [
            key,
            value
        ];
    }));
}
function serializeArgsToDescription(args) {
    try {
        return Object.entries(args).map(([key, value])=>{
            if ('object' == typeof value && null !== value) try {
                return `${key}: ${JSON.stringify(value)}`;
            } catch  {
                return `${key}: [object]`;
            }
            return `${key}: "${value}"`;
        }).join(', ');
    } catch (error) {
        const errorMessage = (0, external_error_formatter_js_namespaceObject.getErrorMessage)(error);
        console.error('Error serializing args:', errorMessage);
        return `[args serialization failed: ${errorMessage}]`;
    }
}
function buildActionInstruction(actionName, args) {
    const locatePrompt = isRecord(args.locate) ? getPromptText(args.locate.prompt) : void 0;
    switch(actionName){
        case 'Tap':
            return locatePrompt ? `Tap on "${locatePrompt}"` : 'Tap';
        case 'Input':
            {
                const value = args.value ?? args.content ?? '';
                return locatePrompt ? `Input "${value}" into "${locatePrompt}"` : `Input "${value}"`;
            }
        case 'Scroll':
            {
                const direction = args.direction ?? 'down';
                return locatePrompt ? `Scroll ${direction} on "${locatePrompt}"` : `Scroll ${direction}`;
            }
        case 'Hover':
            return locatePrompt ? `Hover over "${locatePrompt}"` : 'Hover';
        case 'KeyboardPress':
            {
                const key = args.value ?? args.key ?? '';
                return `Press key "${key}"`;
            }
        default:
            {
                const argsDescription = serializeArgsToDescription(args);
                return argsDescription ? `${actionName}: ${argsDescription}` : actionName;
            }
    }
}
async function executeAction(agent, actionName, args) {
    if (agent.callActionInActionSpace) return agent.callActionInActionSpace(actionName, args);
    if (agent.aiAction) {
        const instruction = buildActionInstruction(actionName, args);
        return agent.aiAction(instruction);
    }
    throw new Error(`Action "${actionName}" is not supported by this agent`);
}
async function captureScreenshotResult(agent, actionName, actionResult) {
    const content = [
        {
            type: 'text',
            text: `Action "${actionName}" completed.`
        }
    ];
    if (void 0 !== actionResult) content.push({
        type: 'text',
        text: `Result: ${serializeActionResult(actionResult)}`
    });
    try {
        const screenshot = await agent.page?.screenshotBase64();
        if (!screenshot) return {
            content
        };
        const { mimeType, body } = (0, img_namespaceObject.parseBase64)(screenshot);
        content.push({
            type: 'image',
            data: body,
            mimeType
        });
        return {
            content
        };
    } catch (error) {
        const errorMessage = (0, external_error_formatter_js_namespaceObject.getErrorMessage)(error);
        console.error('Error capturing screenshot:', errorMessage);
        content[0] = {
            type: 'text',
            text: `Action "${actionName}" completed (screenshot unavailable: ${errorMessage})`
        };
        return {
            content
        };
    }
}
function serializeActionResult(actionResult) {
    if ('string' == typeof actionResult) return actionResult;
    try {
        return JSON.stringify(actionResult);
    } catch  {
        return String(actionResult);
    }
}
function createErrorResult(message) {
    return {
        content: [
            {
                type: 'text',
                text: message
            }
        ],
        isError: true
    };
}
async function captureFailureResult(agent, actionName, errorMessage) {
    const warningText = `Warning: Action "${actionName}" failed: ${errorMessage}. Check the screenshot below for the current page state and decide how to proceed.`;
    try {
        const screenshot = await agent.page?.screenshotBase64();
        if (!screenshot) return {
            content: [
                {
                    type: 'text',
                    text: warningText
                }
            ]
        };
        const { mimeType, body } = (0, img_namespaceObject.parseBase64)(screenshot);
        return {
            content: [
                {
                    type: 'text',
                    text: warningText
                },
                {
                    type: 'image',
                    data: body,
                    mimeType
                }
            ]
        };
    } catch  {
        return {
            content: [
                {
                    type: 'text',
                    text: warningText
                }
            ]
        };
    }
}
function mergeToolCliMetadata(base, extra) {
    const options = {
        ...base?.options ?? {},
        ...extra?.options ?? {}
    };
    return Object.keys(options).length > 0 ? {
        options
    } : void 0;
}
function generateToolsFromActionSpace(actionSpace, getAgent, sanitizeArgs = (args)=>args, initArgSchema = {}, initArgCliMetadata, toolDefaults = {}) {
    return actionSpace.map((action)=>{
        const schema = {
            ...extractActionSchema(action.paramSchema, action.name),
            ...initArgSchema
        };
        return {
            name: action.name,
            description: describeActionForTool(action),
            schema,
            cli: initArgCliMetadata,
            handler: async (args)=>{
                try {
                    const agent = await getAgent(args);
                    (0, verbose_js_namespaceObject.emitCliVerboseEvent)({
                        event: 'agent_ready',
                        tool: action.name
                    });
                    const unsubscribeVerbose = (0, verbose_js_namespaceObject.attachCliVerboseDumpListener)(agent, {
                        toolName: action.name
                    });
                    try {
                        let normalizedArgs = normalizeActionArgs(sanitizeArgs(args), action.paramSchema);
                        if (toolDefaults.locate) normalizedArgs = applyLocateDefaults(normalizedArgs, action.paramSchema, toolDefaults.locate);
                        let actionResult;
                        try {
                            actionResult = await executeAction(agent, action.name, normalizedArgs);
                        } catch (error) {
                            const errorMessage = (0, external_error_formatter_js_namespaceObject.getErrorMessage)(error);
                            console.error(`Error executing action "${action.name}":`, errorMessage);
                            return await captureFailureResult(agent, action.name, errorMessage);
                        }
                        return await captureScreenshotResult(agent, action.name, actionResult);
                    } finally{
                        unsubscribeVerbose();
                    }
                } catch (error) {
                    const errorMessage = (0, external_error_formatter_js_namespaceObject.getErrorMessage)(error);
                    console.error(`Error in handler for "${action.name}":`, errorMessage);
                    return createErrorResult(`Failed to get agent or execute action "${action.name}": ${errorMessage}`);
                }
            }
        };
    });
}
function generateCommonTools(getAgent, initArgSchema = {}, initArgCliMetadata, toolDefaults = {}) {
    return [
        {
            name: 'take_screenshot',
            description: 'Capture screenshot of current page/screen',
            schema: {
                ...initArgSchema
            },
            cli: initArgCliMetadata,
            handler: async (args = {})=>{
                try {
                    const agent = await getAgent(args);
                    (0, verbose_js_namespaceObject.emitCliVerboseEvent)({
                        event: 'agent_ready',
                        tool: 'take_screenshot'
                    });
                    const unsubscribeVerbose = (0, verbose_js_namespaceObject.attachCliVerboseDumpListener)(agent, {
                        toolName: 'take_screenshot'
                    });
                    try {
                        const screenshot = await agent.page?.screenshotBase64();
                        if (!screenshot) return createErrorResult('Screenshot not available');
                        await agent.recordToReport?.('take_screenshot', {
                            screenshotBase64: screenshot
                        });
                        const { mimeType, body } = (0, img_namespaceObject.parseBase64)(screenshot);
                        return {
                            content: [
                                {
                                    type: 'image',
                                    data: body,
                                    mimeType
                                }
                            ]
                        };
                    } finally{
                        unsubscribeVerbose();
                    }
                } catch (error) {
                    const errorMessage = (0, external_error_formatter_js_namespaceObject.getErrorMessage)(error);
                    console.error('Error taking screenshot:', errorMessage);
                    return createErrorResult(`Failed to capture screenshot: ${errorMessage}`);
                }
            }
        },
        {
            name: 'act',
            description: 'Execute a natural language action. The AI will plan and perform multi-step operations in a single invocation, useful for transient UI interactions (e.g., Spotlight, dropdown menus) that disappear between separate commands.',
            schema: {
                prompt: external_zod_namespaceObject.z.string().describe('Natural language description of the action to perform, e.g. "press Command+Space, type Safari, press Enter"'),
                deepLocate: external_zod_namespaceObject.z.boolean().optional().describe('Use deep locate for every element this action targets. Improves precision for small or ambiguous targets at the cost of speed. Defaults to the server --deep-locate setting.'),
                deepThink: external_zod_namespaceObject.z.boolean().optional().describe('Plan this action with deep thinking (richer context and sub-goal decomposition). Helps with complex multi-step instructions at the cost of speed. Defaults to the server --deep-think setting.'),
                ...initArgSchema
            },
            cli: mergeToolCliMetadata(void 0, initArgCliMetadata),
            handler: async (args = {})=>{
                const prompt = args.prompt;
                try {
                    const agent = await getAgent(args);
                    (0, verbose_js_namespaceObject.emitCliVerboseEvent)({
                        event: 'agent_ready',
                        tool: 'act'
                    });
                    if (!agent.aiAction) return createErrorResult('act is not supported by this agent');
                    const unsubscribeVerbose = (0, verbose_js_namespaceObject.attachCliVerboseDumpListener)(agent, {
                        toolName: 'act'
                    });
                    try {
                        const actOptions = {
                            deepThink: false,
                            ...toolDefaults.act
                        };
                        if (void 0 !== args.deepLocate) actOptions.deepLocate = args.deepLocate;
                        if (void 0 !== args.deepThink) actOptions.deepThink = args.deepThink;
                        const result = await agent.aiAction(prompt, actOptions);
                        return await captureScreenshotResult(agent, 'act', result);
                    } finally{
                        unsubscribeVerbose();
                    }
                } catch (error) {
                    const errorMessage = (0, external_error_formatter_js_namespaceObject.getErrorMessage)(error);
                    console.error('Error executing act:', errorMessage);
                    return createErrorResult(`Failed to execute act: ${errorMessage}`);
                }
            }
        },
        {
            name: 'assert',
            description: 'Assert a natural language statement against the current page/screen.',
            schema: {
                prompt: external_zod_namespaceObject.z.string().describe('Natural language assertion to verify, e.g. "there is a login button visible"'),
                message: external_zod_namespaceObject.z.string().optional().describe('Custom error message to throw when the assertion fails, e.g. "the login button should be visible".'),
                ...external_user_prompt_js_namespaceObject.promptInputExtraSchema,
                ...initArgSchema
            },
            cli: mergeToolCliMetadata(void 0, initArgCliMetadata),
            handler: async (args = {})=>{
                const prompt = args.prompt;
                const message = args.message;
                try {
                    const agent = await getAgent(args);
                    (0, verbose_js_namespaceObject.emitCliVerboseEvent)({
                        event: 'agent_ready',
                        tool: 'assert'
                    });
                    if (!agent.aiAssert) return createErrorResult('assert is not supported by this agent');
                    const unsubscribeVerbose = (0, verbose_js_namespaceObject.attachCliVerboseDumpListener)(agent, {
                        toolName: 'assert'
                    });
                    try {
                        const userPrompt = (0, external_user_prompt_js_namespaceObject.composeUserPrompt)({
                            prompt,
                            image: args.image,
                            imageName: args.imageName,
                            convertHttpImage2Base64: args.convertHttpImage2Base64
                        });
                        await agent.aiAssert(userPrompt, message);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: 'Assertion passed.'
                                }
                            ]
                        };
                    } finally{
                        unsubscribeVerbose();
                    }
                } catch (error) {
                    const errorMessage = (0, external_error_formatter_js_namespaceObject.getErrorMessage)(error);
                    console.error('Error executing assert:', errorMessage);
                    return createErrorResult(`Failed to execute assert: ${errorMessage}`);
                }
            }
        }
    ];
}
exports.composeUserPrompt = __webpack_exports__.composeUserPrompt;
exports.generateCommonTools = __webpack_exports__.generateCommonTools;
exports.generateToolsFromActionSpace = __webpack_exports__.generateToolsFromActionSpace;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "composeUserPrompt",
    "generateCommonTools",
    "generateToolsFromActionSpace"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
