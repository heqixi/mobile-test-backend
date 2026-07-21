/**
 * Extract the JSON portion from a model response.
 *
 * This mainly handles fenced JSON like ```json { ... } ``` by removing the
 * fence. If that does not produce a JSON object, it falls back to a greedy regex
 * that extracts from the first "{" to the last "}". If that still fails, the
 * original response is returned.
 *
 * Expected model responses are JSON objects, possibly wrapped in markdown
 * fences. Natural language mixed with JSON, or arrays like
 * [{"type":"Tap"}, {"type":"Hover"}], are outside the supported contract and
 * are not reliably recoverable.
 *
 * This legacy extractor is also used by extraction responses that can be any
 * JSON value. In those cases, arrays/strings/numbers have no object braces and
 * pass through unchanged.
 */
export declare function extractJSONFromCodeBlock(response: string): string;
export type JsonParserSource = 'generic-object' | 'planning-action-param' | 'locate' | 'section-locator';
export interface JsonParserContext {
    source: JsonParserSource;
    preserveStringValueKeys?: string[];
    requireObject?: boolean;
}
export type JsonParser = (raw: string, context?: JsonParserContext) => unknown;
export declare function parseModelResponseJson(raw: string, context?: JsonParserContext): any;
