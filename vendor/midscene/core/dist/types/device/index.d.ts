import type { ModelRuntime } from '../ai-model/models';
import type { ActionScrollParam, DeviceAction, ExecutorContext, LocateResultElement } from '../types';
import type { ElementNode } from '@midscene/shared/extractor';
import { z } from 'zod';
import type { ElementCacheFeature, Rect, Size } from '../types';
export interface FileChooserHandler {
    accept(files: string[]): Promise<void>;
}
export interface FileChooserRegistration {
    dispose: () => void;
    getError: () => Error | undefined | Promise<Error | undefined>;
}
export interface MjpegStreamFrame {
    /** Raw base64-encoded image bytes WITHOUT a `data:image/...;base64,` prefix. */
    data: string;
    contentType?: string;
}
export interface MjpegStreamHandle {
    stop(): void | Promise<void>;
}
export interface MjpegStreamOptions {
    signal?: AbortSignal;
    onFrame(frame: MjpegStreamFrame): void;
    onError?(error: unknown): void;
}
/**
 * A cheap, not-yet-decoded handle to one screen frame from a
 * {@link DeviceFrameSource}. `ref` is platform-specific (a raw H.264 keyframe
 * buffer on Android, an already-encoded JPEG data URL on iOS/web) and must not
 * be interpreted by callers — pass it back to `decode()` to materialize.
 */
export interface DeviceFrameRef {
    ref: unknown;
    capturedAt: number;
}
/**
 * A continuous screen-frame source opened via
 * {@link AbstractInterface.openFrameSource}. Designed for deferred decoding:
 * grabbing `latest()` is near-zero cost, so observers can sample at a steady
 * cadence and pay any decode cost only once, for the frames they keep.
 */
export interface DeviceFrameSource {
    /** Latest frame handle, near-zero cost. Null until the first frame arrives. */
    latest(): DeviceFrameRef | null;
    /**
     * Materialize frame handles into `data:image/...;base64,` URLs, preserving
     * order. Possibly expensive (e.g. one ffmpeg run per unique frame on
     * Android) — call once with the sampled handles, never per tick.
     */
    decode(refs: DeviceFrameRef[]): Promise<string[]>;
    /** Release the source (stop streams/subscriptions it started). */
    stop(): Promise<void> | void;
}
/** A point in device-pixel coordinates on the screen. */
export interface PointerPoint {
    x: number;
    y: number;
}
export interface PointerInputPrimitives {
    tap(p: PointerPoint, opts?: {
        duration?: number;
    }): Promise<void>;
    doubleClick?(p: PointerPoint): Promise<void>;
    rightClick?(p: PointerPoint): Promise<void>;
    hover?(p: PointerPoint): Promise<void>;
    longPress?(p: PointerPoint, opts?: {
        duration?: number;
    }): Promise<void>;
    dragAndDrop?(from: PointerPoint, to: PointerPoint): Promise<void>;
}
export interface TouchInputPrimitives {
    swipe(start: PointerPoint, end: PointerPoint, opts?: {
        duration?: number;
        repeat?: number;
    }): Promise<void>;
    pinch?(center: PointerPoint, opts: {
        startDistance: number;
        endDistance: number;
        duration: number;
    }): Promise<void>;
}
export interface KeyboardInputPrimitives {
    keyboardPress(keyName: string, opts?: {
        target?: unknown;
    }): Promise<void>;
    cursorMove?(direction: 'left' | 'right', times?: number): Promise<void>;
    typeText(value: string, opts?: {
        autoDismissKeyboard?: boolean;
        keyboardDismissStrategy?: 'esc-first' | 'back-first';
        keyboardTypeDelay?: number;
        target?: unknown;
        replace?: boolean;
        focusOnly?: boolean;
    }): Promise<void>;
    clearInput(target?: unknown): Promise<void>;
}
export interface ScrollInputPrimitives {
    scroll(param: ActionScrollParam): Promise<void>;
}
export interface SystemInputPrimitives {
    backButton?(): Promise<void>;
    homeButton?(): Promise<void>;
    recentAppsButton?(): Promise<void>;
}
export interface InputPrimitives {
    pointer?: PointerInputPrimitives;
    keyboard?: KeyboardInputPrimitives;
    touch?: TouchInputPrimitives;
    scroll?: ScrollInputPrimitives;
    system?: SystemInputPrimitives;
}
export interface MobileInputPrimitives extends InputPrimitives {
    pointer: PointerInputPrimitives & {
        doubleClick(p: PointerPoint): Promise<void>;
        longPress(p: PointerPoint, opts?: {
            duration?: number;
        }): Promise<void>;
        dragAndDrop(from: PointerPoint, to: PointerPoint): Promise<void>;
    };
    keyboard: KeyboardInputPrimitives;
    touch: TouchInputPrimitives;
}
export interface BrowserInputPrimitives extends InputPrimitives {
    pointer: PointerInputPrimitives & {
        doubleClick(p: PointerPoint): Promise<void>;
        rightClick(p: PointerPoint): Promise<void>;
        hover(p: PointerPoint): Promise<void>;
        dragAndDrop(from: PointerPoint, to: PointerPoint): Promise<void>;
        longPress(p: PointerPoint, opts?: {
            duration?: number;
        }): Promise<void>;
    };
    keyboard: KeyboardInputPrimitives;
    scroll: ScrollInputPrimitives;
    touch: TouchInputPrimitives;
}
export interface ComputerInputPrimitives extends InputPrimitives {
    pointer: PointerInputPrimitives & {
        doubleClick(p: PointerPoint): Promise<void>;
        rightClick(p: PointerPoint): Promise<void>;
        hover(p: PointerPoint): Promise<void>;
        dragAndDrop(from: PointerPoint, to: PointerPoint): Promise<void>;
    };
    keyboard: KeyboardInputPrimitives;
    scroll: ScrollInputPrimitives;
}
export declare abstract class AbstractInterface {
    abstract interfaceType: string;
    abstract screenshotBase64(): Promise<string>;
    abstract size(): Promise<Size>;
    abstract actionSpace(): DeviceAction[];
    abstract cacheFeatureForPoint?(center: [number, number], options?: {
        targetDescription?: string;
        modelRuntime?: ModelRuntime;
    }): Promise<ElementCacheFeature>;
    abstract rectMatchesCacheFeature?(feature: ElementCacheFeature): Promise<Rect>;
    abstract destroy?(): Promise<void>;
    abstract describe?(): string;
    abstract beforeInvokeAction?(actionName: string, param: any): Promise<void>;
    abstract afterInvokeAction?(actionName: string, param: any): Promise<void>;
    registerFileChooserListener?(handler: (chooser: FileChooserHandler) => Promise<void>): Promise<FileChooserRegistration>;
    abstract getElementsNodeTree?: () => Promise<ElementNode>;
    abstract url?: () => string | Promise<string>;
    abstract evaluateJavaScript?<T = any>(script: string): Promise<T>;
    /**
     * Get the current device-local time as a formatted string.
     * Prefer this for user-visible time because timestamps alone do not preserve
     * the target device's timezone when formatted on the host machine.
     */
    getDeviceLocalTimeString?(format?: string): Promise<string>;
    /** URL of native MJPEG stream for real-time screen preview (e.g. WDA MJPEG server) */
    mjpegStreamUrl?: string;
    /**
     * Optional continuous frame source for UI observation (`startObserving`).
     * Devices that maintain a continuous frame stream — scrcpy on Android, WDA
     * MJPEG on iOS, CDP screencast on web — implement this so an observer can
     * sample the screen far faster than repeated `screenshotBase64()` calls,
     * catching short-lived UI (toasts, carousels, transitions).
     *
     * The contract enables DEFERRED decoding: `latest()` returns a cheap opaque
     * handle (e.g. a raw H.264 keyframe on Android) with no per-frame decode
     * cost, and `decode()` materializes only the handles that were actually
     * sampled — once, at the end of the observation window.
     */
    openFrameSource?(): Promise<DeviceFrameSource | undefined>;
    /**
     * Optional in-process MJPEG frame producer. Implementations can push raw
     * base64 frames here when there is no standalone native MJPEG URL, e.g.
     * Chromium CDP Page.startScreencast for web previews.
     */
    startMjpegStream?(options: MjpegStreamOptions): MjpegStreamHandle | undefined | Promise<MjpegStreamHandle | undefined>;
    /**
     * Optional hook used after a UI action to push a fresh frame on the active
     * MJPEG stream. Set `force` after navigation to replace a transient loading
     * frame even when the screencast has already emitted one. Implementations
     * should be a no-op when no stream is active.
     */
    flushPendingVisualUpdate?(force?: boolean): Promise<void>;
    /**
     * Optional non-blocking variant of `flushPendingVisualUpdate`. Keyboard-
     * heavy preview interactions can schedule a coalesced refresh here without
     * stalling the input hot path; `force` preserves a requested navigation
     * refresh while work is already queued.
     */
    schedulePendingVisualUpdate?(force?: boolean): void;
    /**
     * Optional navigation state probe for browser-like interfaces, used to drive
     * loading indicators in playground UIs. Returning `undefined` means the
     * interface does not expose this concept.
     */
    navigationState?(): Promise<{
        isLoading: boolean;
    }>;
    /**
     * Low-level device input surface. Platform implementations expose transport
     * primitives here; higher-level AI actions and manual pointer dispatch should
     * adapt to this instead of duplicating platform gesture logic.
     */
    inputPrimitives?: InputPrimitives;
}
export declare const defineAction: <TSchema extends z.ZodType | undefined = undefined, TRuntime = TSchema extends z.ZodType ? z.infer<TSchema> : undefined, TReturn = any>(config: {
    name: string;
    description: string;
    interfaceAlias?: string;
    paramSchema?: TSchema;
    call: (param: TRuntime, context?: ExecutorContext) => Promise<TReturn> | TReturn;
} & Partial<Omit<DeviceAction<TRuntime, TReturn>, "name" | "description" | "interfaceAlias" | "paramSchema" | "call">>) => DeviceAction<TRuntime, TReturn>;
export declare const actionTapParamSchema: z.ZodObject<{
    locate: z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}>;
export type ActionTapParam = {
    locate: LocateResultElement;
};
export declare const defineActionTap: (tap: PointerInputPrimitives["tap"]) => DeviceAction<ActionTapParam>;
export declare const actionRightClickParamSchema: z.ZodObject<{
    locate: z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}>;
export type ActionRightClickParam = {
    locate: LocateResultElement;
};
export declare const defineActionRightClick: (rightClick: NonNullable<PointerInputPrimitives["rightClick"]>) => DeviceAction<ActionRightClickParam>;
export declare const actionDoubleClickParamSchema: z.ZodObject<{
    locate: z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}>;
export type ActionDoubleClickParam = {
    locate: LocateResultElement;
};
export declare const defineActionDoubleClick: (doubleClick: NonNullable<PointerInputPrimitives["doubleClick"]>) => DeviceAction<ActionDoubleClickParam>;
export declare const actionHoverParamSchema: z.ZodObject<{
    locate: z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}>;
export type ActionHoverParam = {
    locate: LocateResultElement;
};
export declare const defineActionHover: (hover: NonNullable<PointerInputPrimitives["hover"]>) => DeviceAction<ActionHoverParam>;
export declare const actionInputParamSchema: z.ZodObject<{
    value: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    locate: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>>;
    mode: z.ZodDefault<z.ZodEnum<["replace", "clear", "typeOnly"]>>;
    autoDismissKeyboard: z.ZodOptional<z.ZodBoolean>;
    keyboardTypeDelay: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    value: string;
    mode: "replace" | "clear" | "typeOnly";
    locate?: z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    autoDismissKeyboard?: boolean | undefined;
    keyboardTypeDelay?: number | undefined;
}, {
    value: string | number;
    locate?: z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    mode?: "replace" | "clear" | "typeOnly" | undefined;
    autoDismissKeyboard?: boolean | undefined;
    keyboardTypeDelay?: number | undefined;
}>;
export type ActionInputParam = {
    value: string;
    locate?: LocateResultElement;
    mode?: 'replace' | 'clear' | 'typeOnly' | 'append';
    autoDismissKeyboard?: boolean;
    keyboardTypeDelay?: number;
};
export declare const defineActionInput: (keyboard: KeyboardInputPrimitives) => DeviceAction<ActionInputParam>;
export declare const actionKeyboardPressParamSchema: z.ZodObject<{
    locate: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>>;
    keyName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    keyName: string;
    locate?: z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}, {
    keyName: string;
    locate?: z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}>;
export type ActionKeyboardPressParam = {
    locate?: LocateResultElement;
    keyName: string;
};
export declare const defineActionKeyboardPress: (keyboardPress: KeyboardInputPrimitives["keyboardPress"]) => DeviceAction<ActionKeyboardPressParam>;
export declare const actionScrollParamSchema: z.ZodObject<{
    scrollType: z.ZodDefault<z.ZodEnum<["singleAction", "scrollToBottom", "scrollToTop", "scrollToRight", "scrollToLeft"]>>;
    direction: z.ZodDefault<z.ZodEnum<["down", "up", "right", "left"]>>;
    distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    locate: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "strip", z.ZodTypeAny, {
    direction: "left" | "right" | "up" | "down";
    scrollType: "singleAction" | "scrollToBottom" | "scrollToTop" | "scrollToRight" | "scrollToLeft";
    locate?: z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    distance?: number | null | undefined;
}, {
    locate?: z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    distance?: number | null | undefined;
    direction?: "left" | "right" | "up" | "down" | undefined;
    scrollType?: "singleAction" | "scrollToBottom" | "scrollToTop" | "scrollToRight" | "scrollToLeft" | undefined;
}>;
export declare const defineActionScroll: (scroll: ScrollInputPrimitives["scroll"]) => DeviceAction<ActionScrollParam>;
export declare const actionDragAndDropParamSchema: z.ZodObject<{
    from: z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>;
    to: z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    from: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
    to: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}, {
    from: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
    to: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
}>;
export type ActionDragAndDropParam = {
    from: LocateResultElement;
    to: LocateResultElement;
};
export declare const defineActionDragAndDrop: (dragAndDrop: NonNullable<PointerInputPrimitives["dragAndDrop"]>) => DeviceAction<ActionDragAndDropParam>;
export declare const ActionLongPressParamSchema: z.ZodObject<{
    locate: z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
    duration?: number | undefined;
}, {
    locate: {
        prompt: string | ({
            prompt: string;
        } & {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        });
        deepLocate?: boolean | undefined;
        deepThink?: boolean | undefined;
        cacheable?: boolean | undefined;
        xpath?: string | boolean | undefined;
    } & {
        [k: string]: unknown;
    };
    duration?: number | undefined;
}>;
export type ActionLongPressParam = {
    locate: LocateResultElement;
    duration?: number;
};
export declare const defineActionLongPress: (longPress: NonNullable<PointerInputPrimitives["longPress"]>) => DeviceAction<ActionLongPressParam>;
export declare const ActionSwipeParamSchema: z.ZodObject<{
    start: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>>;
    direction: z.ZodOptional<z.ZodEnum<["up", "down", "left", "right"]>>;
    distance: z.ZodOptional<z.ZodNumber>;
    end: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>>;
    duration: z.ZodDefault<z.ZodNumber>;
    repeat: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    duration: number;
    repeat?: number | undefined;
    distance?: number | undefined;
    direction?: "left" | "right" | "up" | "down" | undefined;
    start?: z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    end?: z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}, {
    repeat?: number | undefined;
    distance?: number | undefined;
    direction?: "left" | "right" | "up" | "down" | undefined;
    duration?: number | undefined;
    start?: z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    end?: z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}>;
export type ActionSwipeParam = {
    start?: LocateResultElement;
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
    end?: LocateResultElement;
    duration?: number;
    repeat?: number;
};
export declare function normalizeMobileSwipeParam(param: ActionSwipeParam, screenSize: {
    width: number;
    height: number;
}): {
    startPoint: {
        x: number;
        y: number;
    };
    endPoint: {
        x: number;
        y: number;
    };
    duration: number;
    repeatCount: number;
};
export declare const defineActionSwipe: (config: {
    swipe: TouchInputPrimitives["swipe"];
    size(): Promise<Size>;
}) => DeviceAction<ActionSwipeParam>;
export declare const actionClearInputParamSchema: z.ZodObject<{
    locate: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "strip", z.ZodTypeAny, {
    locate?: z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}, {
    locate?: z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}>;
export type ActionClearInputParam = {
    locate?: LocateResultElement;
};
export declare const defineActionClearInput: (clearInput: KeyboardInputPrimitives["clearInput"]) => DeviceAction<ActionClearInputParam>;
export declare const actionCursorMoveParamSchema: z.ZodObject<{
    direction: z.ZodEnum<["left", "right"]>;
    times: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    direction: "left" | "right";
    times: number;
}, {
    direction: "left" | "right";
    times?: number | undefined;
}>;
export type ActionCursorMoveParam = {
    direction: 'left' | 'right';
    times?: number;
};
export declare const defineActionCursorMove: (config: {
    keyboard: Pick<KeyboardInputPrimitives, "keyboardPress" | "cursorMove">;
    sleep?(timeMs: number): Promise<void>;
}) => DeviceAction<ActionCursorMoveParam>;
export declare const ActionPinchParamSchema: z.ZodObject<{
    locate: z.ZodOptional<z.ZodObject<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough">>>;
    direction: z.ZodEnum<["in", "out"]>;
    distance: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    direction: "in" | "out";
    locate?: z.objectOutputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    distance?: number | undefined;
    duration?: number | undefined;
}, {
    direction: "in" | "out";
    locate?: z.objectInputType<{
        prompt: z.ZodUnion<[z.ZodString, z.ZodIntersection<z.ZodObject<{
            prompt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            prompt: string;
        }, {
            prompt: string;
        }>, z.ZodObject<{
            images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>, "many">>>;
            convertHttpImage2Base64: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }, {
            images?: {
                name: string;
                url: string;
            }[] | undefined;
            convertHttpImage2Base64?: boolean | undefined;
        }>>]>;
        deepLocate: z.ZodOptional<z.ZodBoolean>;
        deepThink: z.ZodOptional<z.ZodBoolean>;
        cacheable: z.ZodOptional<z.ZodBoolean>;
        xpath: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    distance?: number | undefined;
    duration?: number | undefined;
}>;
export type ActionPinchParam = {
    locate?: LocateResultElement;
    direction: 'in' | 'out';
    distance?: number;
    duration?: number;
};
export declare const defineActionPinch: (config: {
    pinch: TouchInputPrimitives["pinch"];
    size(): Promise<Size>;
}) => DeviceAction<ActionPinchParam> | undefined;
export declare function normalizePinchParam(param: ActionPinchParam, screenSize: {
    width: number;
    height: number;
}): {
    centerX: number;
    centerY: number;
    startDistance: number;
    endDistance: number;
    duration: number;
};
export interface MobileInputActionContext {
    input: MobileInputPrimitives;
    size(): Promise<Size>;
    sleep?(timeMs: number): Promise<void>;
    getDefaultAutoDismissKeyboard?(): boolean | undefined;
    systemActions?: SystemInputActionOptions;
}
export interface SystemInputActionConfig {
    name: string;
    description: string;
    interfaceAlias?: string;
    delayBeforeRunner?: number;
    delayAfterRunner?: number;
}
export interface SystemInputActionOptions {
    backButton?: SystemInputActionConfig;
    homeButton?: SystemInputActionConfig;
    recentAppsButton?: SystemInputActionConfig;
}
export interface InputPrimitiveActionOptions {
    size?: () => Promise<Size>;
    sleep?: (timeMs: number) => Promise<void>;
    includeSwipe?: boolean;
    includePinch?: boolean;
    systemActions?: SystemInputActionOptions;
}
export declare function defineActionsFromInputPrimitives(input: InputPrimitives, options?: InputPrimitiveActionOptions): DeviceAction<any>[];
export declare function createDefaultMobileActions(context: MobileInputActionContext): DeviceAction<any>[];
export declare const ActionSleepParamSchema: z.ZodObject<{
    timeMs: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    timeMs?: number | undefined;
}, {
    timeMs?: number | undefined;
}>;
export type ActionSleepParam = {
    timeMs?: number;
};
export declare const defineActionSleep: () => DeviceAction<ActionSleepParam>;
export type { DeviceAction } from '../types';
export type { AndroidDeviceOpt, AndroidDeviceInputOpt, IOSDeviceOpt, IOSDeviceInputOpt, HarmonyDeviceOpt, HarmonyDeviceInputOpt, } from './device-options';
