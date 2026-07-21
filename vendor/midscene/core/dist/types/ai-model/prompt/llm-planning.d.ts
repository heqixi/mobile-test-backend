import type { DeviceAction } from '../../types';
import type { LocateResultPromptSpec } from '../shared/model-locate-result';
export declare const descriptionForAction: (action: DeviceAction<any>, locateParamTypeDescription: string, includeLocateInPlanning?: boolean, locatePromptSpec?: LocateResultPromptSpec) => string;
export declare function systemPromptToTaskPlanning({ actionSpace, locatePromptSpec, includeLocateInPlanning, includeThought, includeSubGoals, }: {
    actionSpace: DeviceAction<any>[];
    locatePromptSpec?: LocateResultPromptSpec;
    includeLocateInPlanning: boolean;
    includeThought?: boolean;
    includeSubGoals?: boolean;
}): Promise<string>;
