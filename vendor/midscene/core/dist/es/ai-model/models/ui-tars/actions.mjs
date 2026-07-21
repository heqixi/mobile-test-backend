import { getDebug } from "@midscene/shared/logger";
import { transformHotkeyInput } from "@midscene/shared/us-keyboard-layout";
import { assert } from "@midscene/shared/utils";
const debug = getDebug('ui-tars-planning');
const warnLog = getDebug('ui-tars-planning', {
    console: true
});
function transformUiTarsActions(parsedPlanningResponse) {
    const transformActions = [];
    const unhandledActions = [];
    parsedPlanningResponse.actions.forEach((action)=>{
        const actionType = (action.action_type || '').toLowerCase();
        if ('click' === actionType) {
            assert(action.action_inputs.start_box, 'start_box is required');
            const point = getPoint(action.action_inputs.start_box);
            const locate = {
                point,
                prompt: action.thought || ''
            };
            transformActions.push({
                type: 'Tap',
                param: {
                    locate
                }
            });
        } else if ('left_double' === actionType) {
            assert(action.action_inputs.start_box, 'start_box is required');
            const point = getPoint(action.action_inputs.start_box);
            const locate = {
                point,
                prompt: action.thought || ''
            };
            transformActions.push({
                type: 'DoubleClick',
                param: {
                    locate
                },
                thought: action.thought || ''
            });
        } else if ('right_single' === actionType) {
            assert(action.action_inputs.start_box, 'start_box is required');
            const point = getPoint(action.action_inputs.start_box);
            const locate = {
                point,
                prompt: action.thought || ''
            };
            transformActions.push({
                type: 'RightClick',
                param: {
                    locate
                },
                thought: action.thought || ''
            });
        } else if ('drag' === actionType) {
            assert(action.action_inputs.start_box, 'start_box is required');
            assert(action.action_inputs.end_box, 'end_box is required');
            const startPoint = getPoint(action.action_inputs.start_box);
            const endPoint = getPoint(action.action_inputs.end_box);
            transformActions.push({
                type: 'DragAndDrop',
                param: {
                    from: {
                        point: startPoint,
                        prompt: action.thought || ''
                    },
                    to: {
                        point: endPoint,
                        prompt: action.thought || ''
                    }
                },
                thought: action.thought || ''
            });
        } else if ('type' === actionType) transformActions.push({
            type: 'Input',
            param: {
                value: action.action_inputs.content
            },
            thought: action.thought || ''
        });
        else if ('scroll' === actionType) transformActions.push({
            type: 'Scroll',
            param: {
                direction: action.action_inputs.direction
            },
            thought: action.thought || ''
        });
        else if ('finished' === actionType) transformActions.push({
            type: 'Finished',
            param: {},
            thought: action.action_inputs.content || action.thought || ''
        });
        else if ('hotkey' === actionType) if (action.action_inputs.key) {
            const keys = transformHotkeyInput(action.action_inputs.key);
            transformActions.push({
                type: 'KeyboardPress',
                param: {
                    keyName: keys.join('+')
                },
                thought: action.thought || ''
            });
        } else warnLog('No key found in action: hotkey. Will not perform action.');
        else if ('wait' === actionType) transformActions.push({
            type: 'Sleep',
            param: {
                timeMs: 1000
            },
            thought: action.thought || ''
        });
        else if (actionType) {
            unhandledActions.push({
                type: actionType,
                thought: action.thought || ''
            });
            debug('Unhandled action type:', actionType, 'thought:', action.thought);
        }
    });
    if (0 === transformActions.length) throw new Error(buildNoUiTarsActionsError(parsedPlanningResponse.rawResponse, parsedPlanningResponse.actions, unhandledActions));
    debug('transformActions', JSON.stringify(transformActions, null, 2));
    return transformActions;
}
function getPoint(startBox) {
    const [x, y] = JSON.parse(startBox);
    assert('number' == typeof x && Number.isFinite(x) && 'number' == typeof y && Number.isFinite(y), `invalid point data for ui-tars planning: ${startBox}`);
    return [
        x,
        y
    ];
}
function buildNoUiTarsActionsError(rawResponse, actions, unhandledActions) {
    const errorDetails = [];
    if (0 === actions.length) {
        errorDetails.push('Action parser returned no actions');
        if (rawResponse.includes('Thought:') && !rawResponse.includes('Action:')) errorDetails.push('Response contains "Thought:" but missing "Action:" line');
        else errorDetails.push('Response may be malformed or empty');
    }
    if (unhandledActions.length > 0) {
        const types = unhandledActions.map((a)=>a.type).join(', ');
        errorDetails.push(`Unhandled action types: ${types}`);
    }
    return [
        'No actions found in UI-TARS response.',
        ...errorDetails
    ].join('\n');
}
export { transformUiTarsActions };

//# sourceMappingURL=actions.mjs.map