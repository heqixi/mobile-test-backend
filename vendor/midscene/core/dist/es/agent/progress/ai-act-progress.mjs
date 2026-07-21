function isRecord(value) {
    return 'object' == typeof value && null !== value && !Array.isArray(value);
}
const maxCompactStringLength = 180;
function compactProgressValue(value) {
    if (null == value) return value;
    if ('string' == typeof value) return value.length > maxCompactStringLength ? `${value.slice(0, maxCompactStringLength - 3)}...` : value;
    if ('number' == typeof value || 'boolean' == typeof value) return value;
    if (Array.isArray(value)) return value.slice(0, 5).map(compactProgressValue);
    if (isRecord(value) && 'string' == typeof value.prompt) return compactProgressValue(value.prompt);
    if (!isRecord(value)) return String(value);
    const entries = Object.entries(value).slice(0, 6);
    return Object.fromEntries(entries.map(([key, entryValue])=>[
            key,
            compactProgressValue(entryValue)
        ]));
}
function summarizeParam(param) {
    if (!param || 'object' != typeof param) return compactProgressValue(param);
    const record = param;
    if ('string' == typeof record.prompt) return compactProgressValue(record.prompt);
    if (record.locate && 'object' == typeof record.locate && null !== record.locate) {
        const locate = record.locate;
        return {
            locate: compactProgressValue(locate.prompt),
            ...Object.fromEntries(Object.entries(record).filter(([key])=>'locate' !== key).slice(0, 4).map(([key, value])=>[
                    key,
                    compactProgressValue(value)
                ]))
        };
    }
    return compactProgressValue(record);
}
function errorMessageForAiAct(error) {
    return error instanceof Error ? error.message : String(error);
}
function numberFromUnknown(value) {
    return 'number' == typeof value && Number.isFinite(value) ? value : void 0;
}
function bboxArrayFromProperty(value, key) {
    const bbox = value[key];
    if (!Array.isArray(bbox) || bbox.length < 4) return;
    const left = numberFromUnknown(bbox[0]);
    const top = numberFromUnknown(bbox[1]);
    const right = numberFromUnknown(bbox[2]);
    const bottom = numberFromUnknown(bbox[3]);
    if (void 0 === left || void 0 === top || void 0 === right || void 0 === bottom) return;
    return [
        left,
        top,
        right,
        bottom
    ];
}
function centerPointFromBbox(bbox) {
    return [
        Math.floor((bbox[0] + bbox[2]) / 2),
        Math.floor((bbox[1] + bbox[3]) / 2)
    ];
}
function pointFromLocateLike(value) {
    const center = value.center;
    if (Array.isArray(center) && center.length >= 2) {
        const x = numberFromUnknown(center[0]);
        const y = numberFromUnknown(center[1]);
        if (void 0 !== x && void 0 !== y) return [
            x,
            y
        ];
    }
    const point = value.point;
    if (Array.isArray(point) && point.length >= 2) {
        const x = numberFromUnknown(point[0]);
        const y = numberFromUnknown(point[1]);
        if (void 0 !== x && void 0 !== y) return [
            x,
            y
        ];
    }
    const locatedPixelBbox = bboxArrayFromProperty(value, 'locatedPixelBbox');
    if (locatedPixelBbox) return centerPointFromBbox(locatedPixelBbox);
    const bbox = bboxArrayFromProperty(value, 'bbox');
    if (bbox) return centerPointFromBbox(bbox);
}
function bboxFromLocateLike(value) {
    const locatedPixelBbox = bboxArrayFromProperty(value, 'locatedPixelBbox');
    if (locatedPixelBbox) return locatedPixelBbox;
    const bbox = bboxArrayFromProperty(value, 'bbox');
    if (bbox) return bbox;
    if (!isRecord(value.rect)) return;
    const left = numberFromUnknown(value.rect.left);
    const top = numberFromUnknown(value.rect.top);
    const width = numberFromUnknown(value.rect.width);
    const height = numberFromUnknown(value.rect.height);
    if (void 0 === left || void 0 === top || void 0 === width || void 0 === height) return;
    return [
        left,
        top,
        left + width,
        top + height
    ];
}
function targetTextFromLocateLike(value) {
    if ('string' == typeof value.description) return value.description;
    if ('string' == typeof value.prompt) return value.prompt;
    return '';
}
function isLocateLike(value) {
    if (!isRecord(value)) return false;
    return 'center' in value || 'rect' in value || 'point' in value || 'bbox' in value || 'prompt' in value || "description" in value;
}
const locatorParamKeys = [
    'locate',
    'from',
    'to',
    'start',
    'end'
];
function firstLocateLikeParam(param) {
    if (!isRecord(param)) return;
    for (const key of locatorParamKeys){
        const value = param[key];
        if (isLocateLike(value)) return value;
    }
    return Object.values(param).find(isLocateLike);
}
function hasUnresolvedLocateLikeParam(param) {
    if (!isRecord(param)) return false;
    return Object.entries(param).some(([key, value])=>{
        if (locatorParamKeys.includes(key) && 'string' == typeof value) return true;
        return isLocateLike(value) && !pointFromLocateLike(value) && !bboxFromLocateLike(value);
    });
}
function extractProgressAction(task) {
    if ('Action Space' !== task.type || 'Finished' === task.subType || 'Error' === task.subType) return;
    const name = 'string' == typeof task.subType && task.subType.length > 0 ? task.subType : 'Action';
    const locate = firstLocateLikeParam(task.param);
    if (locate) {
        const point = pointFromLocateLike(locate);
        if (point) {
            const bbox = bboxFromLocateLike(locate);
            const target = targetTextFromLocateLike(locate);
            return {
                name,
                ...target ? {
                    target
                } : {},
                point,
                ...bbox ? {
                    bbox
                } : {}
            };
        }
    }
    if (hasUnresolvedLocateLikeParam(task.param)) return;
    const param = summarizeParam(task.param);
    return {
        name,
        ...void 0 !== param && '' !== param ? {
            param
        } : {}
    };
}
function createAiActActionReporter(planIndex, planLimit, emit) {
    return async (event)=>{
        const action = extractProgressAction(event.task);
        if (!action) return;
        const base = {
            planIndex,
            planLimit,
            action
        };
        const durationMs = event.task.timing?.cost;
        switch(event.kind){
            case 'start':
                await emit('plan_action', base);
                await emit('action_running', base);
                break;
            case 'finish':
                await emit('action_done', {
                    ...base,
                    durationMs
                });
                break;
            case 'error':
                await emit('action_failed', {
                    ...base,
                    durationMs,
                    error: event.task.errorMessage
                });
                break;
            default:
                break;
        }
    };
}
export { createAiActActionReporter, errorMessageForAiAct, extractProgressAction };

//# sourceMappingURL=ai-act-progress.mjs.map