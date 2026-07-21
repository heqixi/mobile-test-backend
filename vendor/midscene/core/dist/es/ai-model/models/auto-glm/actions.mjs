import { getDebug } from "@midscene/shared/logger";
const debug = getDebug('auto-glm-actions');
const BACK_BUTTON_NAMES = [
    'AndroidBackButton',
    'HarmonyBackButton'
];
const HOME_BUTTON_NAMES = [
    'AndroidHomeButton',
    'HarmonyHomeButton'
];
function findActionName(actionSpace, knownNames, defaultName) {
    if (!actionSpace) return defaultName;
    const match = actionSpace.find((a)=>knownNames.includes(a.name));
    return match ? match.name : defaultName;
}
function transformAutoGLMAction(action, { actionSpace, coordinateDistanceToPixels }) {
    try {
        switch(action._metadata){
            case 'finish':
                {
                    const finishAction = action;
                    debug('Transform finish action:', finishAction);
                    return [
                        {
                            type: 'Finished',
                            param: {},
                            thought: finishAction.message
                        }
                    ];
                }
            case 'do':
                {
                    const doAction = action;
                    switch(doAction.action){
                        case 'Tap':
                            {
                                const tapAction = doAction;
                                debug('Transform Tap action:', tapAction);
                                return [
                                    {
                                        type: 'Tap',
                                        param: {
                                            locate: {
                                                point: tapAction.element,
                                                prompt: ''
                                            }
                                        }
                                    }
                                ];
                            }
                        case 'Double Tap':
                            {
                                const doubleTapAction = doAction;
                                debug('Transform Double Tap action:', doubleTapAction);
                                return [
                                    {
                                        type: 'DoubleClick',
                                        param: {
                                            locate: {
                                                point: doubleTapAction.element,
                                                prompt: ''
                                            }
                                        }
                                    }
                                ];
                            }
                        case 'Type':
                            {
                                const typeAction = doAction;
                                debug('Transform Type action:', typeAction);
                                return [
                                    {
                                        type: 'Input',
                                        param: {
                                            value: typeAction.text
                                        }
                                    }
                                ];
                            }
                        case 'Swipe':
                            {
                                const swipeAction = doAction;
                                debug('Transform Swipe action:', swipeAction);
                                const deltaX = swipeAction.end[0] - swipeAction.start[0];
                                const deltaY = swipeAction.end[1] - swipeAction.start[1];
                                let direction;
                                let distance;
                                const absDeltaX = Math.abs(deltaX);
                                const absDeltaY = Math.abs(deltaY);
                                if (absDeltaY > absDeltaX) {
                                    distance = coordinateDistanceToPixels(deltaY, 'y');
                                    direction = deltaY > 0 ? 'up' : 'down';
                                } else {
                                    distance = coordinateDistanceToPixels(deltaX, 'x');
                                    direction = deltaX > 0 ? 'left' : 'right';
                                }
                                debug(`Calculate swipe direction: ${direction}, distance: ${distance}`);
                                return [
                                    {
                                        type: 'Scroll',
                                        param: {
                                            locate: {
                                                point: swipeAction.start,
                                                prompt: ''
                                            },
                                            distance,
                                            direction
                                        },
                                        thought: swipeAction.think || ''
                                    }
                                ];
                            }
                        case 'Long Press':
                            {
                                const longPressAction = doAction;
                                debug('Transform Long Press action:', longPressAction);
                                return [
                                    {
                                        type: 'LongPress',
                                        param: {
                                            locate: {
                                                point: longPressAction.element,
                                                prompt: ''
                                            }
                                        },
                                        thought: longPressAction.think || ''
                                    }
                                ];
                            }
                        case 'Back':
                            {
                                const backAction = doAction;
                                debug('Transform Back action:', backAction);
                                return [
                                    {
                                        type: findActionName(actionSpace, BACK_BUTTON_NAMES, 'AndroidBackButton'),
                                        param: {},
                                        thought: backAction.think || ''
                                    }
                                ];
                            }
                        case 'Home':
                            {
                                const homeAction = doAction;
                                debug('Transform Home action:', homeAction);
                                return [
                                    {
                                        type: findActionName(actionSpace, HOME_BUTTON_NAMES, 'AndroidHomeButton'),
                                        param: {},
                                        thought: homeAction.think || ''
                                    }
                                ];
                            }
                        case 'Wait':
                            {
                                const waitAction = doAction;
                                debug('Transform Wait action:', waitAction);
                                return [
                                    {
                                        type: 'Sleep',
                                        param: {
                                            timeMs: waitAction.durationMs
                                        },
                                        thought: waitAction.think || ''
                                    }
                                ];
                            }
                        case 'Launch':
                            {
                                const launchAction = doAction;
                                debug('Transform Launch action:', launchAction);
                                return [
                                    {
                                        type: 'Launch',
                                        param: {
                                            uri: launchAction.app
                                        },
                                        thought: launchAction.think || ''
                                    }
                                ];
                            }
                        case 'Interact':
                            throw new Error('Action "Interact" from auto-glm is not supported in the current implementation.');
                        case 'Call_API':
                            throw new Error('Action "Call_API" from auto-glm is not supported in the current implementation.');
                        case 'Take_over':
                            throw new Error('Action "Take_over" from auto-glm is not supported in the current implementation.');
                        case 'Note':
                            throw new Error('Action "Note" from auto-glm is not supported in the current implementation.');
                        default:
                            throw new Error(`Unknown do() action type: ${doAction.action}`);
                    }
                }
            default:
                throw new Error(`Unknown action metadata: ${action._metadata}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debug('Transform error:', errorMessage);
        throw new Error(`Failed to transform action: ${errorMessage}`);
    }
}
export { transformAutoGLMAction };

//# sourceMappingURL=actions.mjs.map