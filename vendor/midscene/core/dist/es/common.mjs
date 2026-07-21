import { NodeType } from "@midscene/shared/constants";
import { treeToList } from "@midscene/shared/extractor";
import { compositeElementInfoImg, preProcessImageUrl } from "@midscene/shared/img";
import { assert, isPlainObject } from "@midscene/shared/utils";
import { z } from "zod";
function expandSearchArea(rect, screenSize) {
    const minArea = 160000;
    const expandSize = 100;
    const expandedLeft = Math.max(rect.left - expandSize, 0);
    const expandedTop = Math.max(rect.top - expandSize, 0);
    const expandRect = {
        left: expandedLeft,
        top: expandedTop,
        width: Math.min(rect.left - expandedLeft + rect.width + expandSize, screenSize.width - expandedLeft),
        height: Math.min(rect.top - expandedTop + rect.height + expandSize, screenSize.height - expandedTop)
    };
    const currentArea = expandRect.width * expandRect.height;
    if (currentArea >= minArea) return expandRect;
    const centerX = expandRect.left + expandRect.width / 2;
    const centerY = expandRect.top + expandRect.height / 2;
    const scaleFactor = Math.sqrt(minArea / currentArea);
    const newWidth = Math.round(expandRect.width * scaleFactor);
    const newHeight = Math.round(expandRect.height * scaleFactor);
    const newLeft = Math.round(centerX - newWidth / 2);
    const newTop = Math.round(centerY - newHeight / 2);
    const left = Math.max(newLeft, 0);
    const top = Math.max(newTop, 0);
    return {
        left,
        top,
        width: Math.min(newWidth, screenSize.width - left),
        height: Math.min(newHeight, screenSize.height - top)
    };
}
async function markupImageForLLM(screenshotBase64, tree, size) {
    const elementsInfo = treeToList(tree);
    const elementsPositionInfoWithoutText = elementsInfo.filter((elementInfo)=>{
        if (elementInfo.attributes.nodeType === NodeType.TEXT) return false;
        return true;
    });
    const imagePayload = await compositeElementInfoImg({
        inputImgBase64: screenshotBase64,
        elementsPositionInfo: elementsPositionInfoWithoutText,
        size
    });
    return imagePayload;
}
function findActionInActionSpaceOrThrow(planType, actionSpace) {
    const action = actionSpace.find((item)=>item.name === planType);
    if (!action) {
        const available = actionSpace.map((item)=>item.name).join(', ');
        throw new Error(`Action type '${planType}' is not in the current action space. Available actions: ${available || '(none)'}`);
    }
    return action;
}
function buildYamlFlowFromPlans(plans, actionSpace) {
    const flow = [];
    for (const plan of plans){
        const verb = plan.type;
        const action = findActionInActionSpaceOrThrow(verb, actionSpace);
        const flowKey = action.interfaceAlias || verb;
        const flowParam = action.paramSchema ? dumpActionParam(plan.param || {}, action.paramSchema) : {};
        const shortcutField = 'Launch' === action.name || 'launch' === action.interfaceAlias ? 'uri' : 'Terminate' === action.name || 'terminate' === action.interfaceAlias ? 'uri' : 'RunAdbShell' === action.name || 'runAdbShell' === action.interfaceAlias || 'RunHdcShell' === action.name || 'runHdcShell' === action.interfaceAlias ? 'command' : void 0;
        const shortcutKeys = shortcutField ? Object.keys(flowParam) : [];
        const canInlineShortcut = shortcutField && 1 === shortcutKeys.length && shortcutKeys[0] === shortcutField && 'string' == typeof flowParam[shortcutField];
        const flowItem = canInlineShortcut ? {
            [flowKey]: flowParam[shortcutField]
        } : {
            [flowKey]: '',
            ...flowParam
        };
        flow.push(flowItem);
    }
    return flow;
}
const PointSchema = z.object({
    left: z.number(),
    top: z.number()
});
const SizeSchema = z.object({
    width: z.number(),
    height: z.number()
});
const RectSchema = PointSchema.and(SizeSchema).and(z.object({
    zoom: z.number().optional()
}));
const TMultimodalPromptSchema = z.object({
    images: z.array(z.object({
        name: z.string(),
        url: z.string()
    })).optional(),
    convertHttpImage2Base64: z.boolean().optional()
});
const TUserPromptSchema = z.union([
    z.string(),
    z.object({
        prompt: z.string()
    }).and(TMultimodalPromptSchema.partial())
]);
const userPromptToString = (prompt)=>'string' == typeof prompt ? prompt : prompt.prompt;
const userPromptToMultimodalPrompt = (prompt)=>{
    if ('string' == typeof prompt || !prompt.images) return;
    return {
        images: prompt.images,
        convertHttpImage2Base64: !!prompt.convertHttpImage2Base64
    };
};
const multimodalPromptToChatMessages = async (multimodalPrompt)=>{
    const msgs = [];
    if (multimodalPrompt?.images?.length) {
        msgs.push({
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: 'Next, I will provide all the reference images. These reference images are supporting context only, not the current screenshot being evaluated, unless the task explicitly asks for comparison or matching.'
                }
            ]
        });
        for (const item of multimodalPrompt.images){
            const imagePayload = await preProcessImageUrl(item.url, !!multimodalPrompt.convertHttpImage2Base64);
            msgs.push({
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `this is the reference image named '${item.name}'. It is a reference image, not the current screenshot:`
                    }
                ]
            });
            msgs.push({
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: imagePayload,
                            detail: 'high'
                        }
                    }
                ]
            });
        }
    }
    return msgs;
};
const MidsceneLocationInput = z.object({
    prompt: TUserPromptSchema,
    deepLocate: z.boolean().optional(),
    deepThink: z.boolean().optional().describe('@deprecated Use `deepLocate` instead.'),
    cacheable: z.boolean().optional(),
    xpath: z.union([
        z.string(),
        z.boolean()
    ]).optional()
}).passthrough();
const getMidsceneLocationSchema = ()=>MidsceneLocationInput;
const ifMidsceneLocatorField = (field)=>{
    let actualField = field;
    if (actualField._def?.typeName === 'ZodOptional') actualField = actualField._def.innerType;
    if (actualField._def?.typeName === 'ZodObject') {
        const shape = actualField._def.shape();
        if ('prompt' in shape && shape.prompt) return true;
    }
    return false;
};
const formatPromptWithImages = (promptObj)=>{
    let promptString = promptObj.prompt;
    if (Array.isArray(promptObj.images) && promptObj.images.length > 0) {
        const imageCount = promptObj.images.length;
        promptString += ` (with ${imageCount} image${imageCount > 1 ? 's' : ''})`;
    }
    return promptString;
};
const dumpMidsceneLocatorField = (field)=>{
    assert(ifMidsceneLocatorField(field), 'field is not a midscene locator field');
    if ('string' == typeof field) return field;
    if (field && 'object' == typeof field && field.prompt) {
        if ('string' == typeof field.prompt) return field.prompt;
        if ('object' == typeof field.prompt && field.prompt.prompt) return formatPromptWithImages(field.prompt);
    }
    return String(field);
};
const findAllMidsceneLocatorField = (zodType, requiredOnly)=>{
    if (!zodType) return [];
    const zodObject = zodType;
    if (zodObject._def?.typeName === 'ZodObject' && zodObject.shape) {
        const keys = Object.keys(zodObject.shape);
        return keys.filter((key)=>{
            const field = zodObject.shape[key];
            if (!ifMidsceneLocatorField(field)) return false;
            if (requiredOnly) return field._def?.typeName !== 'ZodOptional';
            return true;
        });
    }
    return [];
};
const dumpActionParam = (jsonObject, zodSchema)=>{
    if (!isPlainObject(jsonObject)) return {};
    const locatorFields = findAllMidsceneLocatorField(zodSchema);
    const result = {
        ...jsonObject
    };
    for (const fieldName of locatorFields){
        const fieldValue = result[fieldName];
        if (fieldValue) {
            if ('string' == typeof fieldValue) result[fieldName] = fieldValue;
            else if ('object' == typeof fieldValue) {
                if (fieldValue.prompt) {
                    if ('string' == typeof fieldValue.prompt) result[fieldName] = fieldValue.prompt;
                    else if ('object' == typeof fieldValue.prompt && fieldValue.prompt.prompt) result[fieldName] = formatPromptWithImages(fieldValue.prompt);
                }
            }
        }
    }
    return result;
};
const parseActionParam = (rawParam, zodSchema, options)=>{
    if (!zodSchema) return;
    const param = rawParam ?? {};
    const locateFields = findAllMidsceneLocatorField(zodSchema);
    if (0 === locateFields.length) return zodSchema.parse(param);
    const locateFieldValues = {};
    for (const fieldName of locateFields)if (fieldName in param) locateFieldValues[fieldName] = param[fieldName];
    const paramsForValidation = {};
    for(const key in param)if (locateFields.includes(key)) paramsForValidation[key] = {
        prompt: '_dummy_'
    };
    else paramsForValidation[key] = param[key];
    const validated = zodSchema.parse(paramsForValidation);
    const ratio = options?.shrunkShotToLogicalRatio;
    for(const fieldName in locateFieldValues){
        let value = locateFieldValues[fieldName];
        if (void 0 !== ratio && 1 !== ratio && value && 'object' == typeof value && value.center && value.rect) value = {
            ...value,
            center: [
                Math.round(value.center[0] / ratio),
                Math.round(value.center[1] / ratio)
            ],
            rect: {
                ...value.rect,
                left: Math.round(value.rect.left / ratio),
                top: Math.round(value.rect.top / ratio),
                width: Math.round(value.rect.width / ratio),
                height: Math.round(value.rect.height / ratio)
            }
        };
        validated[fieldName] = value;
    }
    return validated;
};
const finalizeActionName = 'Finalize';
const getReadableTimeString = (format = 'YYYY-MM-DD HH:mm:ss', timestamp)=>{
    const now = void 0 !== timestamp ? new Date(timestamp) : new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day).replace('HH', hours).replace('mm', minutes).replace('ss', seconds);
    return `${timeString} (${format})`;
};
export { PointSchema, RectSchema, SizeSchema, TMultimodalPromptSchema, TUserPromptSchema, buildYamlFlowFromPlans, dumpActionParam, dumpMidsceneLocatorField, expandSearchArea, finalizeActionName, findActionInActionSpaceOrThrow, findAllMidsceneLocatorField, getMidsceneLocationSchema, getReadableTimeString, ifMidsceneLocatorField, markupImageForLLM, multimodalPromptToChatMessages, parseActionParam, userPromptToMultimodalPrompt, userPromptToString };

//# sourceMappingURL=common.mjs.map