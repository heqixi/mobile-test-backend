import type { DeviceAction } from '../../../device';
import type { PlanningAction } from '../../../types';
import type { LocateResultAdapter, LocateResultContext } from '../../shared/model-locate-result/types';
export declare function normalizePlanningActionLocateFields(actions: PlanningAction[], { actionSpace, includeLocateInPlanning, locateResultAdapter, locateResultContext, }: {
    actionSpace: DeviceAction[];
    includeLocateInPlanning: boolean;
    locateResultAdapter?: LocateResultAdapter;
    locateResultContext: LocateResultContext;
}): void;
