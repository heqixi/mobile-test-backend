import type { ElementCacheFeature, Rect } from '@midscene/core';
import type { ModelRuntime } from '@midscene/core/ai-model';
import type { DebugFunction } from '@midscene/shared/logger';
export type WebElementCacheFeature = ElementCacheFeature & {
    xpaths?: string[];
};
export declare const sanitizeXpaths: (xpaths: unknown) => string[];
export interface CacheFeatureOptions {
    targetDescription?: string;
    modelRuntime?: ModelRuntime;
}
export declare function judgeOrderSensitive(options: CacheFeatureOptions | undefined, debug: DebugFunction): Promise<boolean>;
export declare function buildRectFromElementInfo(elementInfo: {
    rect: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
}): Rect;
