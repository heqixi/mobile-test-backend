export interface OpenAIErrorResponseContext {
    responseRequestIds?: Array<{
        attempt: number;
        requestId: string;
        status: number;
        ok: boolean;
    }>;
    rawResponseBodies?: Array<{
        attempt: number;
        body: string;
    }>;
    fetchErrors?: Array<{
        attempt: number;
        error: string;
    }>;
}
export declare function wrapOpenAICompatibleFetch(context: OpenAIErrorResponseContext): typeof fetch;
export declare function formatOpenAIAPIErrorDetails(_error: unknown, context: OpenAIErrorResponseContext): string;
