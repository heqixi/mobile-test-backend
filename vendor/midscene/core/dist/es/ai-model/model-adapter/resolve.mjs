import { parseModelResponseJson } from "../service-caller/json.mjs";
import { resolveChatCompletion } from "./chat-completion.mjs";
import { resolveLocate } from "./locate.mjs";
import { resolveCustomPlanningDefinition, resolvePlanning } from "./planning.mjs";
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
function resolveJsonParser(jsonParser) {
    if (!jsonParser || 'lenient-json' === jsonParser) return parseModelResponseJson;
    if ('function' == typeof jsonParser) return jsonParser;
    throw new Error(`Unknown json parser preset: ${jsonParser}`);
}
function resolveImagePreprocess(imagePreprocess) {
    return {
        padBlockSize: imagePreprocess?.padBlockSize
    };
}
class ResolvedModelAdapter {
    constructor(config, modelFamily){
        _define_property(this, "jsonParser", void 0);
        _define_property(this, "chatCompletion", void 0);
        _define_property(this, "imagePreprocess", void 0);
        _define_property(this, "planning", void 0);
        _define_property(this, "locate", void 0);
        this.jsonParser = resolveJsonParser(config.jsonParser);
        this.chatCompletion = resolveChatCompletion(config.chatCompletion);
        this.imagePreprocess = resolveImagePreprocess(config.imagePreprocess);
        const customPlanner = config.planning?.kind === 'custom' ? config.planning.planner : void 0;
        const resolvedCustomPlanner = customPlanner ? resolveCustomPlanningDefinition(customPlanner) : void 0;
        this.planning = resolvePlanning(config.planning, resolvedCustomPlanner);
        this.locate = resolveLocate(config.locate, resolvedCustomPlanner);
    }
}
export { ResolvedModelAdapter };

//# sourceMappingURL=resolve.mjs.map