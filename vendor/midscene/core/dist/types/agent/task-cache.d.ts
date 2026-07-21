import type { TUserPrompt } from '../ai-model';
import type { ElementCacheFeature } from '../types';
export declare const debug: import("@midscene/shared/logger").DebugFunction;
export interface PlanningCache {
    type: 'plan';
    prompt: TUserPrompt;
    yamlWorkflow: string;
}
export interface LocateCache {
    type: 'locate';
    prompt: TUserPrompt;
    cache?: ElementCacheFeature;
    /** @deprecated kept for backward compatibility */
    xpaths?: string[];
}
export interface MatchCacheResult<T extends PlanningCache | LocateCache> {
    cacheContent: T;
    cacheUsable: boolean;
    updateFn: (cb: (cache: T) => void) => void;
}
export type CacheFileContent = {
    midsceneVersion: string;
    cacheId: string;
    caches: Array<PlanningCache | LocateCache>;
};
export declare const cacheFileExt = ".cache.yaml";
export declare class TaskCache {
    cacheId: string;
    cacheFilePath?: string;
    cache: CacheFileContent;
    isCacheResultUsed: boolean;
    cacheOriginalLength: number;
    readOnlyMode: boolean;
    writeOnlyMode: boolean;
    private matchedCacheIndices;
    private consumedCacheIndices;
    private staleCacheIndices;
    constructor(cacheId: string, isCacheResultUsed: boolean, cacheFilePath?: string, options?: {
        readOnly?: boolean;
        writeOnly?: boolean;
        cacheDir?: string;
    });
    matchCache(prompt: TUserPrompt, type: 'plan' | 'locate'): MatchCacheResult<PlanningCache | LocateCache> | undefined;
    matchPlanCache(prompt: TUserPrompt): MatchCacheResult<PlanningCache> | undefined;
    matchLocateCache(prompt: TUserPrompt): MatchCacheResult<LocateCache> | undefined;
    appendCache(cache: PlanningCache | LocateCache): void;
    loadCacheFromFile(): CacheFileContent | undefined;
    flushCacheToFile(options?: {
        cleanUnused?: boolean;
    }): void;
    private promptKey;
    private applyRecordInto;
    updateOrAppendCacheRecord(newRecord: PlanningCache | LocateCache, cachedRecord?: MatchCacheResult<PlanningCache | LocateCache>): void;
    /**
     * Mark the most recently consumed locate cache entry for `prompt` as stale.
     * Call this when an action that used the cache-hit element failed and the run
     * is about to replan: the subsequent re-locate then replaces this entry in
     * place instead of appending a duplicate, which would otherwise be matched
     * first on the next run and re-trigger replanning forever (#2529).
     *
     * No-op when nothing was consumed for the prompt, so a plain first-time miss
     * (and any repeated prompt that never failed) still appends normally.
     */
    markLocateCacheStale(prompt: TUserPrompt): void;
    private replaceCacheRecord;
}
