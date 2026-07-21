import type { UIContext } from '@midscene/core';
import type { ContextProvider } from '../../../types';
/**
 * Base context provider implementation
 */
export declare abstract class BaseContextProvider implements ContextProvider {
    protected cachedContext?: UIContext;
    abstract getUIContext(): Promise<UIContext>;
    refreshContext(): Promise<UIContext>;
}
/**
 * Agent-based context provider for local execution modes
 */
export declare class AgentContextProvider extends BaseContextProvider {
    private getAgent;
    private options?;
    constructor(getAgent: () => any, options?: {
        forceSameTabNavigation?: boolean;
    } | undefined);
    getUIContext(): Promise<UIContext>;
}
/**
 * Static context provider for pre-determined UI contexts
 */
export declare class StaticContextProvider extends BaseContextProvider {
    private context;
    constructor(context: UIContext);
    getUIContext(): Promise<UIContext>;
    refreshContext(): Promise<UIContext>;
}
/**
 * No-op context provider for cases where context preview is disabled
 */
export declare class NoOpContextProvider implements ContextProvider {
    getUIContext(): Promise<UIContext>;
    refreshContext(): Promise<UIContext>;
}
