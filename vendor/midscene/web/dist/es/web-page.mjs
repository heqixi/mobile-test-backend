import { z } from "@midscene/core";
import { AbstractInterface, defineAction, defineActionsFromInputPrimitives } from "@midscene/core/device";
import { sleep } from "@midscene/core/utils";
import { transformHotkeyInput } from "@midscene/shared/us-keyboard-layout";
const navigateParamSchema = z.object({
    url: z.string().describe('The URL to navigate to. Must start with https://, file://, or a similar protocol.')
});
function normalizeKeyInputs(value) {
    const inputs = Array.isArray(value) ? value : [
        value
    ];
    const result = [];
    for (const input of inputs){
        if ('string' != typeof input) {
            result.push(input);
            continue;
        }
        const trimmed = input.trim();
        if (!trimmed) {
            result.push(input);
            continue;
        }
        let normalized = trimmed;
        if (normalized.length > 1 && normalized.includes('+')) normalized = normalized.replace(/\s*\+\s*/g, ' ');
        if (/\s/.test(normalized)) normalized = normalized.replace(/\s+/g, ' ');
        const transformed = transformHotkeyInput(normalized);
        if (1 === transformed.length && '' === transformed[0] && '' !== trimmed) {
            result.push(input);
            continue;
        }
        if (0 === transformed.length) {
            result.push(input);
            continue;
        }
        result.push(...transformed);
    }
    return result;
}
function getKeyCommands(value) {
    const keys = normalizeKeyInputs(value);
    return keys.reduce((acc, k)=>{
        const includeMeta = keys.includes('Meta') || keys.includes('Control');
        if (includeMeta && ('a' === k || 'A' === k)) return acc.concat([
            {
                key: k,
                command: 'SelectAll'
            }
        ]);
        if (includeMeta && ('c' === k || 'C' === k)) return acc.concat([
            {
                key: k,
                command: 'Copy'
            }
        ]);
        if (includeMeta && ('v' === k || 'V' === k)) return acc.concat([
            {
                key: k,
                command: 'Paste'
            }
        ]);
        return acc.concat([
            {
                key: k
            }
        ]);
    }, []);
}
class AbstractWebPage extends AbstractInterface {
    get mouse() {
        return {
            click: async (x, y, options)=>{},
            wheel: async (deltaX, deltaY)=>{},
            move: async (x, y)=>{},
            drag: async (from, to)=>{}
        };
    }
    get keyboard() {
        return {
            type: async (text)=>{},
            press: async (action)=>{}
        };
    }
    async clearInput(element) {}
}
function createWebInputPrimitives(page) {
    const scheduleVisualUpdate = ()=>{
        if (page.schedulePendingVisualUpdate) return void page.schedulePendingVisualUpdate();
        const pendingRefresh = page.flushPendingVisualUpdate?.();
        pendingRefresh?.catch(()=>void 0);
    };
    return {
        pointer: {
            tap: async ({ x, y })=>{
                await page.mouse.click(x, y, {
                    button: 'left'
                });
            },
            rightClick: async ({ x, y })=>{
                await page.mouse.click(x, y, {
                    button: 'right'
                });
            },
            doubleClick: async ({ x, y })=>{
                await page.mouse.click(x, y, {
                    button: 'left',
                    count: 2
                });
            },
            hover: async ({ x, y })=>{
                await page.mouse.move(x, y);
            },
            dragAndDrop: async (from, to)=>{
                await page.mouse.drag(from, to);
            },
            longPress: async ({ x, y }, opts)=>{
                await page.longPress(x, y, opts?.duration);
            }
        },
        keyboard: {
            typeText: async (value, opts)=>{
                const element = opts?.target;
                if (element && opts?.replace !== false) {
                    await page.clearInput(element);
                    await page.waitForDomQuiet?.({
                        target: element
                    });
                } else if (element && opts?.focusOnly) {
                    const target = element;
                    await page.mouse.click(target.center[0], target.center[1], {
                        button: 'left'
                    });
                    await page.keyboard.press([
                        {
                            key: 'End'
                        }
                    ]);
                }
                if (opts?.focusOnly) return;
                await page.keyboard.type(value);
                scheduleVisualUpdate();
            },
            keyboardPress: async (keyName, opts)=>{
                const element = opts?.target;
                if (element) await page.mouse.click(element.center[0], element.center[1], {
                    button: 'left'
                });
                const keys = getKeyCommands(keyName);
                await page.keyboard.press(keys);
                scheduleVisualUpdate();
            },
            cursorMove: async (direction, times = 1)=>{
                const arrowKey = 'left' === direction ? 'ArrowLeft' : 'ArrowRight';
                for(let i = 0; i < times; i++){
                    await page.keyboard.press([
                        {
                            key: arrowKey
                        }
                    ]);
                    await sleep(100);
                }
            },
            clearInput: async (target)=>{
                await page.clearInput(target);
            }
        },
        touch: {
            pinch: async ({ x, y }, opts)=>{
                await page.pinch(x, y, opts.startDistance, opts.endDistance, opts.duration);
            },
            swipe: async (from, to, opts)=>{
                await page.swipe(from, to, opts?.duration);
            }
        },
        scroll: {
            scroll: async (param)=>{
                const element = param.locate;
                const startingPoint = element ? {
                    left: element.center[0],
                    top: element.center[1]
                } : void 0;
                const scrollToEventName = param?.scrollType;
                if ('scrollToTop' === scrollToEventName) await page.scrollUntilTop(startingPoint);
                else if ('scrollToBottom' === scrollToEventName) await page.scrollUntilBottom(startingPoint);
                else if ('scrollToRight' === scrollToEventName) await page.scrollUntilRight(startingPoint);
                else if ('scrollToLeft' === scrollToEventName) await page.scrollUntilLeft(startingPoint);
                else if ('singleAction' !== scrollToEventName && scrollToEventName) throw new Error(`Unknown scroll event type: ${scrollToEventName}, param: ${JSON.stringify(param)}`);
                else {
                    if (param?.direction !== 'down' && param && param.direction) if ('up' === param.direction) await page.scrollUp(param.distance || void 0, startingPoint);
                    else if ('left' === param.direction) await page.scrollLeft(param.distance || void 0, startingPoint);
                    else if ('right' === param.direction) await page.scrollRight(param.distance || void 0, startingPoint);
                    else throw new Error(`Unknown scroll direction: ${param.direction}`);
                    else await page.scrollDown(param?.distance || void 0, startingPoint);
                    await sleep(500);
                }
            }
        }
    };
}
const commonWebActionsForWebPage = (page, includeTouchEvents = false)=>{
    const input = createWebInputPrimitives(page);
    return [
        ...defineActionsFromInputPrimitives(input, {
            size: ()=>page.size(),
            includeSwipe: includeTouchEvents
        }),
        defineAction({
            name: 'Navigate',
            description: 'Navigate the browser to a specified URL. Opens the URL in the current tab.',
            paramSchema: navigateParamSchema,
            sample: {
                url: 'https://www.example.com'
            },
            call: async (param)=>{
                if (!page.navigate) throw new Error('Navigate operation is not supported on this page type');
                await page.navigate(param.url);
            }
        }),
        defineAction({
            name: 'Reload',
            description: 'Reload the current page',
            call: async ()=>{
                if (!page.reload) throw new Error('Reload operation is not supported on this page type');
                await page.reload();
            }
        }),
        defineAction({
            name: 'GoBack',
            description: 'Navigate back in browser history',
            call: async ()=>{
                if (!page.goBack) throw new Error('GoBack operation is not supported on this page type');
                await page.goBack();
            }
        }),
        defineAction({
            name: 'GoForward',
            description: 'Navigate forward in browser history',
            call: async ()=>{
                if (!page.goForward) throw new Error('GoForward operation is not supported on this page type');
                await page.goForward();
            }
        })
    ];
};
export { AbstractWebPage, commonWebActionsForWebPage, createWebInputPrimitives, getKeyCommands };

//# sourceMappingURL=web-page.mjs.map