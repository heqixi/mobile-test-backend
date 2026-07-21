import type { Size } from '../../../types';
import type { UITarsModelVersion } from '@midscene/shared/env';
import { actionParser } from '@ui-tars/action-parser';
type ActionType = 'click' | 'left_double' | 'right_single' | 'drag' | 'type' | 'hotkey' | 'finished' | 'scroll' | 'wait';
export interface UiTarsParsedPlanningResponse {
    rawResponse: string;
    actions: ReturnType<typeof actionParser>['parsed'];
}
export declare function parseUiTarsPlanningResponse(rawResponse: string, shotSize: Size, uiTarsModelVersion: UITarsModelVersion): UiTarsParsedPlanningResponse;
interface BaseAction {
    action_type: ActionType;
    action_inputs: Record<string, any>;
    reflection: string | null;
    thought: string | null;
}
interface ClickAction extends BaseAction {
    action_type: 'click';
    action_inputs: {
        start_box: string;
    };
}
interface DragAction extends BaseAction {
    action_type: 'drag';
    action_inputs: {
        start_box: string;
        end_box: string;
    };
}
interface WaitAction extends BaseAction {
    action_type: 'wait';
    action_inputs: {
        time: string;
    };
}
interface LeftDoubleAction extends BaseAction {
    action_type: 'left_double';
    action_inputs: {
        start_box: string;
    };
}
interface RightSingleAction extends BaseAction {
    action_type: 'right_single';
    action_inputs: {
        start_box: string;
    };
}
interface TypeAction extends BaseAction {
    action_type: 'type';
    action_inputs: {
        content: string;
    };
}
interface HotkeyAction extends BaseAction {
    action_type: 'hotkey';
    action_inputs: {
        key: string;
    };
}
interface ScrollAction extends BaseAction {
    action_type: 'scroll';
    action_inputs: {
        direction: 'up' | 'down';
    };
}
interface FinishedAction extends BaseAction {
    action_type: 'finished';
    action_inputs: {
        content?: string;
    };
}
export type Action = ClickAction | LeftDoubleAction | RightSingleAction | DragAction | TypeAction | HotkeyAction | ScrollAction | FinishedAction | WaitAction;
export {};
