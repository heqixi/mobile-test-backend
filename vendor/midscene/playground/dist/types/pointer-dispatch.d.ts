import type { InputPrimitives } from '@midscene/core/device';
/**
 * Thrown when an /interact request is malformed (missing field, wrong type)
 * or names an action / capability that the connected device does not support.
 * The route handler maps {400, 404} onto the HTTP response.
 */
export declare class PointerInputError extends Error {
    statusCode: 400 | 404;
    constructor(message: string, statusCode: 400 | 404);
}
/**
 * Translate an `/interact` request body into device input primitive calls.
 *
 * The dispatcher is deliberately a flat switch: each case is HTTP-protocol
 * adaptation (parse + range-check fields, hand them to the typed primitive),
 * not platform business logic.
 */
export declare function dispatchPointer(input: InputPrimitives, body: Record<string, unknown>, getScreenSize: () => Promise<{
    width: number;
    height: number;
}>): Promise<void>;
