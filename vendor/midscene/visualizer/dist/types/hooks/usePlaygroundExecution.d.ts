import type { DeviceAction } from '@midscene/core';
import type { ExecutionReportDisplay, FormValue, InfoListItem, PlaygroundSDKLike, StorageProvider } from '../types';
/**
 * Format error object to string
 */
export declare function formatPlaygroundError(error: unknown): string;
export interface UsePlaygroundExecutionOptions {
    playgroundSDK: PlaygroundSDKLike | null;
    storage: StorageProvider | undefined | null;
    actionSpace: DeviceAction<unknown>[];
    loading: boolean;
    setLoading: (loading: boolean) => void;
    setInfoList: React.Dispatch<React.SetStateAction<InfoListItem[]>>;
    replayCounter: number;
    setReplayCounter: React.Dispatch<React.SetStateAction<number>>;
    verticalMode: boolean;
    currentRunningIdRef: React.MutableRefObject<number | null>;
    interruptedFlagRef: React.MutableRefObject<Record<number, boolean>>;
    deviceType?: string;
}
export interface RunActionOptions {
    displayContent?: string;
    reportDisplay?: ExecutionReportDisplay;
}
interface CancelExecutionOptions {
    appendStopMessage?: boolean;
}
/**
 * Hook for handling playground execution logic
 */
export declare function usePlaygroundExecution(options: UsePlaygroundExecutionOptions): {
    cancelCurrentExecution: ({ appendStopMessage }?: CancelExecutionOptions) => Promise<void>;
    handleRun: (value: FormValue, runOptions?: RunActionOptions) => Promise<void>;
    handleStop: () => Promise<void>;
    canStop: boolean;
};
export {};
