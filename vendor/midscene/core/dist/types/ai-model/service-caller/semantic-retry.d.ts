export type CallAiAndParseWithRetryOptions<Response, Parsed> = {
    /** Sends a single model request. Request errors are always propagated as-is. */
    callAi: () => Promise<Response>;
    /** Parses a successful model response. Only failures from this callback retry. */
    parseResponse: (response: Response) => Parsed | Promise<Parsed>;
    /** Converts the final parsing failure into the caller's domain error. */
    toParseError: (error: unknown, response: Response) => Error;
    /** Number of additional model requests after a parsing failure. Defaults to 0. */
    parseRetryTimes?: number;
    /** Delay in milliseconds before retrying a parsing failure. Defaults to 0. */
    parseRetryInterval?: number;
    abortSignal?: AbortSignal;
    /** Runs immediately before a parsing failure triggers another model request. */
    onParseRetry?: (error: unknown, response: Response) => void;
};
/**
 * Calls AI and parses its response, retrying only when the response cannot be
 * structurally parsed.
 *
 * Errors thrown by callAi() intentionally bypass this retry mechanism and are
 * propagated as-is. Only a successful callAi() response that fails the
 * parseResponse() callback triggers another model request.
 */
export declare function callAiAndParseWithRetry<Response, Parsed>({ callAi, parseResponse, toParseError, parseRetryTimes, parseRetryInterval, abortSignal, onParseRetry, }: CallAiAndParseWithRetryOptions<Response, Parsed>): Promise<Parsed>;
