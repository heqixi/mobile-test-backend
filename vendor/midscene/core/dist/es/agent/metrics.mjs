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
const emptyBucket = ()=>({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        calls: 0
    });
const addToBucket = (map, key, prompt, completion, total)=>{
    if (!map[key]) map[key] = emptyBucket();
    const bucket = map[key];
    bucket.promptTokens += prompt;
    bucket.completionTokens += completion;
    bucket.totalTokens += total;
    bucket.calls += 1;
};
class MetricsCollector {
    add(usage) {
        const prompt = usage.prompt_tokens ?? 0;
        const completion = usage.completion_tokens ?? 0;
        const total = usage.total_tokens ?? 0;
        this.totalPromptTokens += prompt;
        this.totalCompletionTokens += completion;
        this.totalTokens += total;
        this.totalCachedInput += usage.cached_input ?? 0;
        this.totalTimeCostMs += usage.time_cost ?? 0;
        this.calls += 1;
        addToBucket(this.byIntent, usage.intent ?? 'unknown', prompt, completion, total);
        addToBucket(this.byModel, usage.model_name ?? 'unknown', prompt, completion, total);
    }
    snapshot() {
        const cloneBuckets = (map)=>{
            const out = {};
            for (const [key, bucket] of Object.entries(map))out[key] = {
                ...bucket
            };
            return out;
        };
        return {
            totalPromptTokens: this.totalPromptTokens,
            totalCompletionTokens: this.totalCompletionTokens,
            totalTokens: this.totalTokens,
            totalCachedInput: this.totalCachedInput,
            totalTimeCostMs: this.totalTimeCostMs,
            calls: this.calls,
            byIntent: cloneBuckets(this.byIntent),
            byModel: cloneBuckets(this.byModel)
        };
    }
    reset() {
        this.totalPromptTokens = 0;
        this.totalCompletionTokens = 0;
        this.totalTokens = 0;
        this.totalCachedInput = 0;
        this.totalTimeCostMs = 0;
        this.calls = 0;
        this.byIntent = {};
        this.byModel = {};
    }
    constructor(){
        _define_property(this, "totalPromptTokens", 0);
        _define_property(this, "totalCompletionTokens", 0);
        _define_property(this, "totalTokens", 0);
        _define_property(this, "totalCachedInput", 0);
        _define_property(this, "totalTimeCostMs", 0);
        _define_property(this, "calls", 0);
        _define_property(this, "byIntent", {});
        _define_property(this, "byModel", {});
    }
}
export { MetricsCollector };

//# sourceMappingURL=metrics.mjs.map