import { normalizePinchParam } from "@midscene/core/device";
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
class PointerInputError extends Error {
    constructor(message, statusCode){
        super(message), _define_property(this, "statusCode", void 0), this.statusCode = statusCode;
        this.name = 'PointerInputError';
    }
}
function requireNumber(value, field) {
    if ('number' != typeof value || Number.isNaN(value)) throw new PointerInputError(`${field} must be a number`, 400);
    return value;
}
function optionalNumber(value, field) {
    if (void 0 === value) return;
    return requireNumber(value, field);
}
function requireString(value, field) {
    if ('string' != typeof value) throw new PointerInputError(`${field} must be a string`, 400);
    return value;
}
function requirePoint(body, xField = 'x', yField = 'y') {
    return {
        x: requireNumber(body[xField], xField),
        y: requireNumber(body[yField], yField)
    };
}
function ensureCapability(fn, actionType) {
    if ('function' != typeof fn) throw new PointerInputError(`${actionType} is not supported on this device`, 404);
    return fn;
}
function getPointerInput(input) {
    if (!input.pointer) throw new PointerInputError('Pointer input is not supported on this device', 404);
    return input.pointer;
}
function getKeyboardInput(input) {
    if (!input.keyboard) throw new PointerInputError('Keyboard input is not supported on this device', 404);
    return input.keyboard;
}
function getTouchInput(input) {
    if (!input.touch) throw new PointerInputError('Touch input is not supported on this device', 404);
    return input.touch;
}
function getScrollInput(input) {
    if (!input.scroll) throw new PointerInputError('Scroll input is not supported on this device', 404);
    return input.scroll;
}
async function dispatchPointer(input, body, getScreenSize) {
    const { actionType } = body;
    if ('string' != typeof actionType || !actionType) throw new PointerInputError('actionType is required', 400);
    switch(actionType){
        case 'Tap':
            {
                const pointer = getPointerInput(input);
                return ensureCapability(pointer.tap, 'Tap')(requirePoint(body), {
                    duration: optionalNumber(body.duration, 'duration')
                });
            }
        case 'DoubleClick':
            {
                const pointer = getPointerInput(input);
                return ensureCapability(pointer.doubleClick, 'DoubleClick')(requirePoint(body));
            }
        case 'LongPress':
            {
                const pointer = getPointerInput(input);
                return ensureCapability(pointer.longPress, 'LongPress')(requirePoint(body), {
                    duration: optionalNumber(body.duration, 'duration')
                });
            }
        case 'Swipe':
            {
                const touch = getTouchInput(input);
                return ensureCapability(touch.swipe, 'Swipe')(requirePoint(body), requirePoint(body, 'endX', 'endY'), {
                    duration: optionalNumber(body.duration, 'duration'),
                    repeat: optionalNumber(body.repeat, 'repeat')
                });
            }
        case 'DragAndDrop':
            {
                const pointer = getPointerInput(input);
                return ensureCapability(pointer.dragAndDrop, 'DragAndDrop')(requirePoint(body), requirePoint(body, 'endX', 'endY'));
            }
        case 'KeyboardPress':
            {
                const keyboard = getKeyboardInput(input);
                return ensureCapability(keyboard.keyboardPress, 'KeyboardPress')(requireString(body.keyName, 'keyName'));
            }
        case 'Input':
            {
                const keyboard = getKeyboardInput(input);
                const value = requireString(body.value, 'value');
                const at = 'number' == typeof body.x && 'number' == typeof body.y ? requirePoint(body) : void 0;
                const mode = 'string' == typeof body.mode ? body.mode : void 0;
                const autoDismissKeyboard = 'boolean' == typeof body.autoDismissKeyboard ? body.autoDismissKeyboard : void 0;
                const target = at ? {
                    center: [
                        at.x,
                        at.y
                    ],
                    rect: {
                        left: at.x,
                        top: at.y,
                        width: 1,
                        height: 1
                    },
                    description: 'manual input target'
                } : void 0;
                if ('clear' === mode) return void await ensureCapability(keyboard.clearInput, 'ClearInput')(target);
                if (!value) return;
                return ensureCapability(keyboard.typeText, 'Input')(value, {
                    autoDismissKeyboard,
                    target,
                    replace: 'typeOnly' !== mode
                });
            }
        case 'Scroll':
            {
                const scroll = getScrollInput(input);
                const x = 'number' == typeof body.x ? requireNumber(body.x, 'x') : void 0;
                const y = 'number' == typeof body.y ? requireNumber(body.y, 'y') : void 0;
                const direction = 'up' === body.direction || 'down' === body.direction || 'left' === body.direction || 'right' === body.direction ? body.direction : 'down';
                const scrollType = 'scrollToBottom' === body.scrollType || 'scrollToTop' === body.scrollType || 'scrollToLeft' === body.scrollType || 'scrollToRight' === body.scrollType || 'singleAction' === body.scrollType ? body.scrollType : 'singleAction';
                const distance = 'number' == typeof body.distance ? requireNumber(body.distance, 'distance') : void 0;
                return ensureCapability(scroll.scroll, 'Scroll')({
                    direction,
                    scrollType,
                    distance,
                    locate: void 0 !== x && void 0 !== y ? {
                        center: [
                            x,
                            y
                        ],
                        rect: {
                            left: x,
                            top: y,
                            width: 1,
                            height: 1
                        },
                        description: 'manual scroll target'
                    } : void 0
                });
            }
        case 'Pinch':
            {
                const center = requirePoint(body);
                const direction = (()=>{
                    const d = body.direction;
                    if ('in' !== d && 'out' !== d) throw new PointerInputError('direction must be "in" or "out"', 400);
                    return d;
                })();
                const touch = getTouchInput(input);
                const { startDistance, endDistance, duration } = normalizePinchParam({
                    locate: {
                        center: [
                            center.x,
                            center.y
                        ],
                        rect: {
                            left: center.x,
                            top: center.y,
                            width: 1,
                            height: 1
                        },
                        description: 'manual pinch target'
                    },
                    direction,
                    distance: optionalNumber(body.distance, 'distance'),
                    duration: optionalNumber(body.duration, 'duration')
                }, await getScreenSize());
                return ensureCapability(touch.pinch, 'Pinch')(center, {
                    startDistance,
                    endDistance,
                    duration
                });
            }
        default:
            throw new PointerInputError(`Unknown actionType "${actionType}"`, 404);
    }
}
export { PointerInputError, dispatchPointer };

//# sourceMappingURL=pointer-dispatch.mjs.map