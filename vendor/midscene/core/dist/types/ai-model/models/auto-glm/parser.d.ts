import type { AutoGLMParsedAction } from './actions';
export declare const extractValueAfter: (src: string, key: string) => string;
export declare function parseAutoGLMPlanningAction(response: {
    think: string;
    content: string;
}): AutoGLMParsedAction;
export declare function parseAutoGLMResponse(content: string): {
    think: string;
    content: string;
};
export declare function parseAutoGLMPlanningResponse(content: string): {
    response: ReturnType<typeof parseAutoGLMResponse>;
    action: AutoGLMParsedAction;
};
