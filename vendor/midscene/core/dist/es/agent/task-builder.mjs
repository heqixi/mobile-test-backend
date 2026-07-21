import { findAllMidsceneLocatorField, parseActionParam } from "../ai-model/index.mjs";
import { findActionInActionSpaceOrThrow } from "../common.mjs";
import { setTimingFieldOnce } from "../task-timing.mjs";
import { ServiceError } from "../types.mjs";
import { sleep } from "../utils.mjs";
import { generateElementByRect } from "@midscene/shared/extractor";
import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
import { withUsageIntent } from "./usage-intent.mjs";
import { ifPlanLocateParamHasLocatedPixelBbox, matchElementFromCache, matchElementFromPlan, transformLogicalElementToScreenshot, transformLogicalRectToScreenshotRect } from "./utils.mjs";
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
const debug = getDebug('agent:task-builder');
function hasNonEmptyCache(cache) {
    return null != cache && 'object' == typeof cache && Object.keys(cache).length > 0;
}
function invalidLocateElementReason(element) {
    const values = [
        element.center?.[0],
        element.center?.[1],
        element.rect?.left,
        element.rect?.top,
        element.rect?.width,
        element.rect?.height
    ];
    if (values.some((value)=>'number' != typeof value || !Number.isFinite(value))) return `Invalid locate result coordinates: ${JSON.stringify(element)}`;
    if (element.rect.width <= 0 || element.rect.height <= 0) return `Invalid locate result rect size: ${JSON.stringify(element)}`;
}
function normalizeLocateParam(param) {
    if ('string' == typeof param) return {
        prompt: param
    };
    const { deepThink, ...rest } = param;
    const deepLocate = rest.deepLocate ?? deepThink;
    return void 0 === deepLocate ? rest : {
        ...rest,
        deepLocate
    };
}
function locatePlanForLocate(param) {
    const locate = normalizeLocateParam(param);
    const locatePlan = {
        type: 'Locate',
        param: locate,
        thought: ''
    };
    return locatePlan;
}
class TaskBuilder {
    async build(plans, planningModel, defaultModel, options) {
        const tasks = [];
        const cacheable = options?.cacheable;
        const context = {
            tasks,
            planningModel,
            defaultModel,
            cacheable,
            deepLocate: options?.deepLocate,
            abortSignal: options?.abortSignal
        };
        const planHandlers = new Map([
            [
                'Locate',
                (plan)=>this.handleLocatePlan(plan, context)
            ],
            [
                'Finished',
                (plan)=>this.handleFinishedPlan(plan, context)
            ]
        ]);
        const defaultHandler = (plan)=>this.handleActionPlan(plan, context);
        for (const plan of plans){
            const handler = planHandlers.get(plan.type) ?? defaultHandler;
            await handler(plan);
        }
        return {
            tasks
        };
    }
    handleFinishedPlan(plan, context) {
        const taskActionFinished = {
            type: 'Action Space',
            subType: 'Finished',
            param: null,
            thought: plan.thought,
            executor: async ()=>{}
        };
        context.tasks.push(taskActionFinished);
    }
    async handleLocatePlan(plan, context) {
        const taskLocate = this.createLocateTask(plan, plan.param, context);
        context.tasks.push(taskLocate);
    }
    async handleActionPlan(plan, context) {
        const planType = plan.type;
        const actionSpace = this.actionSpace;
        const action = findActionInActionSpaceOrThrow(planType, actionSpace);
        const param = plan.param;
        const locateFields = findAllMidsceneLocatorField(action.paramSchema);
        const requiredLocateFields = findAllMidsceneLocatorField(action.paramSchema, true);
        locateFields.forEach((field)=>{
            if (param[field]) {
                const locatePlan = locatePlanForLocate(param[field]);
                debug('will prepend locate param for field', `action.type=${planType}`, `param=${JSON.stringify(param[field])}`, `locatePlan=${JSON.stringify(locatePlan)}`, `hasLocatedPixelBbox=${ifPlanLocateParamHasLocatedPixelBbox(param[field])}`);
                const locateTask = this.createLocateTask(locatePlan, param[field], context, (result)=>{
                    param[field] = result;
                });
                context.tasks.push(locateTask);
            } else {
                assert(!requiredLocateFields.includes(field), `Required locate field '${field}' is not provided for action ${planType}`);
                debug(`field '${field}' is not provided for action ${planType}`);
            }
        });
        const task = {
            type: 'Action Space',
            subType: planType,
            thought: plan.thought,
            param: plan.param,
            executor: async (param, taskContext)=>{
                const timing = taskContext.task.timing;
                debug('executing action', planType, param, `taskContext.element.center: ${taskContext.element?.center}`);
                const uiContext = taskContext.uiContext;
                assert(uiContext, 'uiContext is required for Action task');
                requiredLocateFields.forEach((field)=>{
                    assert(param[field], `field '${field}' is required for action ${planType} but not provided. Cannot execute action ${planType}.`);
                });
                setTimingFieldOnce(timing, 'beforeInvokeActionHookStart');
                const delayBeforeRunner = action.delayBeforeRunner ?? 200;
                try {
                    await Promise.all([
                        (async ()=>{
                            if (this.interface.beforeInvokeAction) {
                                debug(`will call "beforeInvokeAction" for interface with action name ${action.name}`);
                                await this.interface.beforeInvokeAction(action.name, param);
                                debug(`called "beforeInvokeAction" for interface with action name ${action.name}`);
                            }
                        })(),
                        delayBeforeRunner > 0 ? sleep(delayBeforeRunner) : Promise.resolve()
                    ]);
                } catch (originalError) {
                    const originalMessage = originalError?.message || String(originalError);
                    throw new Error(`error in running beforeInvokeAction for ${action.name}: ${originalMessage}`, {
                        cause: originalError
                    });
                }
                setTimingFieldOnce(timing, 'beforeInvokeActionHookEnd');
                const { shrunkShotToLogicalRatio } = uiContext;
                if (void 0 === shrunkShotToLogicalRatio) throw new Error('shrunkShotToLogicalRatio is not defined in Action task');
                if (action.paramSchema) try {
                    param = parseActionParam(param, action.paramSchema, {
                        shrunkShotToLogicalRatio
                    });
                } catch (error) {
                    throw new Error(`Invalid parameters for action ${action.name}: ${error.message}\nParameters: ${JSON.stringify(param)}`, {
                        cause: error
                    });
                }
                setTimingFieldOnce(timing, 'callActionStart');
                debug('calling action', action.name);
                const actionFn = action.call.bind(this.interface);
                const actionResult = await actionFn(param, taskContext);
                setTimingFieldOnce(timing, 'callActionEnd');
                debug('called action', action.name, 'result:', actionResult);
                setTimingFieldOnce(timing, 'afterInvokeActionHookStart');
                const delayAfterRunner = action.delayAfterRunner ?? this.waitAfterAction ?? 300;
                if (delayAfterRunner > 0) await sleep(delayAfterRunner);
                try {
                    if (this.interface.afterInvokeAction) {
                        debug(`will call "afterInvokeAction" for interface with action name ${action.name}`);
                        await this.interface.afterInvokeAction(action.name, param);
                        debug(`called "afterInvokeAction" for interface with action name ${action.name}`);
                    }
                } catch (originalError) {
                    const originalMessage = originalError?.message || String(originalError);
                    throw new Error(`error in running afterInvokeAction for ${action.name}: ${originalMessage}`, {
                        cause: originalError
                    });
                }
                setTimingFieldOnce(timing, 'afterInvokeActionHookEnd');
                return {
                    output: actionResult
                };
            }
        };
        context.tasks.push(task);
    }
    createLocateTask(plan, detailedLocateParam, context, onResult) {
        const { cacheable, defaultModel, deepLocate, abortSignal } = context;
        let locateParam = normalizeLocateParam(detailedLocateParam);
        if (void 0 !== cacheable) locateParam = {
            ...locateParam,
            cacheable
        };
        if (deepLocate && !locateParam.deepLocate) locateParam = {
            ...locateParam,
            deepLocate: true
        };
        const taskLocator = {
            type: 'Planning',
            subType: 'Locate',
            param: locateParam,
            thought: plan.thought,
            executor: async (param, taskContext)=>{
                const { task } = taskContext;
                let { uiContext } = taskContext;
                const paramWithLocatedPixelBbox = ifPlanLocateParamHasLocatedPixelBbox(param) ? param : void 0;
                assert(param?.prompt || paramWithLocatedPixelBbox, `No prompt or id or position or locatedPixelBbox to locate, param=${JSON.stringify(param)}`);
                if (!uiContext) uiContext = await this.service.contextRetrieverFn();
                assert(uiContext, 'uiContext is required for Service task');
                const { shrunkShotToLogicalRatio } = uiContext;
                if (void 0 === shrunkShotToLogicalRatio) throw new Error('shrunkShotToLogicalRatio is not defined in locate task');
                let locateDump;
                let locateResult;
                const applyDump = (dump)=>{
                    if (!dump) return;
                    locateDump = dump;
                    task.log = {
                        dump,
                        rawResponse: dump.taskInfo?.rawResponse,
                        rawChoiceMessage: dump.taskInfo?.rawChoiceMessage,
                        searchAreaRawChoiceMessage: dump.taskInfo?.searchAreaRawChoiceMessage
                    };
                    task.usage = withUsageIntent(dump.taskInfo?.usage, 'default');
                    task.searchArea = dump.taskInfo?.searchArea;
                    if (dump.taskInfo?.searchAreaUsage) task.searchAreaUsage = withUsageIntent(dump.taskInfo.searchAreaUsage, 'default');
                    if (dump.taskInfo?.reasoning_content) task.reasoning_content = dump.taskInfo.reasoning_content;
                };
                const planLocatedElement = paramWithLocatedPixelBbox ? matchElementFromPlan(paramWithLocatedPixelBbox) : void 0;
                const elementFromPlan = param.deepLocate ? void 0 : planLocatedElement;
                const isPlanDirectHit = !!elementFromPlan;
                let rectFromXpath;
                if (!isPlanDirectHit && param.xpath && this.interface.rectMatchesCacheFeature) try {
                    rectFromXpath = await this.interface.rectMatchesCacheFeature({
                        xpaths: [
                            param.xpath
                        ]
                    });
                } catch  {}
                const elementFromXpath = rectFromXpath ? generateElementByRect(transformLogicalRectToScreenshotRect(rectFromXpath, shrunkShotToLogicalRatio), 'string' == typeof param.prompt ? param.prompt : param.prompt?.prompt || '') : void 0;
                const isXpathHit = !!elementFromXpath;
                const cachePrompt = param.prompt;
                const locateCacheRecord = this.taskCache?.matchLocateCache(cachePrompt);
                const cacheEntry = locateCacheRecord?.cacheContent?.cache;
                const elementFromCacheResult = isPlanDirectHit || isXpathHit ? null : await matchElementFromCache({
                    taskCache: this.taskCache,
                    interfaceInstance: this.interface
                }, cacheEntry, cachePrompt, param.cacheable);
                const elementFromCache = elementFromCacheResult ? transformLogicalElementToScreenshot(elementFromCacheResult, shrunkShotToLogicalRatio) : void 0;
                const isCacheHit = !!elementFromCache;
                let elementFromAiLocate;
                const timing = taskContext.task.timing;
                if (!isXpathHit && !isCacheHit && !isPlanDirectHit) try {
                    setTimingFieldOnce(timing, 'callAiStart');
                    locateResult = await this.service.locate(param, {
                        context: uiContext,
                        planLocatedElement
                    }, defaultModel, abortSignal);
                    applyDump(locateResult.dump);
                    elementFromAiLocate = locateResult.element;
                } catch (error) {
                    if (error instanceof ServiceError) applyDump(error.dump);
                    throw error;
                } finally{
                    setTimingFieldOnce(timing, 'callAiEnd');
                }
                const element = elementFromPlan || elementFromXpath || elementFromCache || elementFromAiLocate;
                if (element) {
                    const invalidElementReason = invalidLocateElementReason(element);
                    if (invalidElementReason) {
                        if (locateDump) throw new ServiceError(invalidElementReason, locateDump);
                        throw new Error(invalidElementReason);
                    }
                }
                const locateCacheAlreadyExists = hasNonEmptyCache(locateCacheRecord?.cacheContent?.cache);
                let currentCacheEntry;
                if (element && this.taskCache && !isCacheHit && (!isPlanDirectHit || !locateCacheAlreadyExists) && param?.cacheable !== false) if (this.interface.cacheFeatureForPoint) try {
                    let pointForCache = element.center;
                    if (1 !== shrunkShotToLogicalRatio) {
                        pointForCache = [
                            Math.round(element.center[0] / shrunkShotToLogicalRatio),
                            Math.round(element.center[1] / shrunkShotToLogicalRatio)
                        ];
                        debug('Transformed coordinates for cacheFeatureForPoint: %o -> %o', element.center, pointForCache);
                    }
                    const feature = await this.interface.cacheFeatureForPoint(pointForCache, {
                        targetDescription: 'string' == typeof param.prompt ? param.prompt : param.prompt?.prompt,
                        modelRuntime: defaultModel
                    });
                    if (hasNonEmptyCache(feature)) {
                        debug('update cache, prompt: %s, cache: %o', cachePrompt, feature);
                        currentCacheEntry = feature;
                        this.taskCache.updateOrAppendCacheRecord({
                            type: 'locate',
                            prompt: cachePrompt,
                            cache: feature
                        }, locateCacheRecord);
                    } else debug('no cache data returned, skip cache update, prompt: %s', cachePrompt);
                } catch (error) {
                    debug('cacheFeatureForPoint failed: %s', error);
                }
                else debug('cacheFeatureForPoint is not supported, skip cache update');
                if (!element) {
                    if (locateDump) throw new ServiceError(`Element not found : ${param.prompt}`, locateDump);
                    throw new Error(`Element not found: ${param.prompt}`);
                }
                let hitBy;
                if (isPlanDirectHit && paramWithLocatedPixelBbox) hitBy = {
                    from: 'Plan',
                    context: {
                        locatedPixelBbox: paramWithLocatedPixelBbox.locatedPixelBbox
                    }
                };
                else if (isXpathHit) hitBy = {
                    from: 'User expected path',
                    context: {
                        xpath: param.xpath
                    }
                };
                else if (isCacheHit) hitBy = {
                    from: 'Cache',
                    context: {
                        cacheEntry,
                        cacheToSave: currentCacheEntry
                    }
                };
                onResult?.(element);
                return {
                    output: {
                        element: {
                            ...element,
                            dpr: uiContext.deprecatedDpr
                        }
                    },
                    hitBy
                };
            }
        };
        return taskLocator;
    }
    constructor({ interfaceInstance, service, taskCache, actionSpace, waitAfterAction }){
        _define_property(this, "interface", void 0);
        _define_property(this, "service", void 0);
        _define_property(this, "taskCache", void 0);
        _define_property(this, "actionSpace", void 0);
        _define_property(this, "waitAfterAction", void 0);
        this.interface = interfaceInstance;
        this.service = service;
        this.taskCache = taskCache;
        this.actionSpace = actionSpace;
        this.waitAfterAction = waitAfterAction;
    }
}
export { TaskBuilder, locatePlanForLocate };

//# sourceMappingURL=task-builder.mjs.map