import type { ExternalRunRequest } from '../../types';
export declare function preparePlaygroundExecution({ clearTimeline, clearTimelineBeforeRun, onBeforeExecutionStart, }: {
    clearTimeline: () => Promise<void>;
    clearTimelineBeforeRun?: boolean;
    onBeforeExecutionStart?: () => Promise<void> | void;
}): Promise<void>;
export declare function shouldExecuteExternalRunRequest({ request, handledRequestIds, lastRequestId, sdkReady, messagesInitialized, }: {
    request?: ExternalRunRequest | null;
    handledRequestIds?: ReadonlySet<string>;
    lastRequestId: string | null;
    sdkReady: boolean;
    messagesInitialized: boolean;
}): boolean;
