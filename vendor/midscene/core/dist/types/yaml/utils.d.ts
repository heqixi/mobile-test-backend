import type { TUserPrompt } from '../common';
import type { DetailedLocateParam, LocateOption, MidsceneYamlScript, MidsceneYamlScriptWebEnv } from '../types';
export type WebTargetSource = 'page' | 'browser' | 'web' | 'target';
export type ResolvedWebTarget = {
    source: WebTargetSource;
    target: Partial<MidsceneYamlScriptWebEnv> & {
        mode: 'page' | 'browser';
    };
    mode: 'page' | 'browser';
};
export type WebTargetConfig = Partial<Record<WebTargetSource, Partial<MidsceneYamlScriptWebEnv>>>;
export declare function resolveWebTarget(config: WebTargetConfig): ResolvedWebTarget | undefined;
export declare function interpolateEnvVars(content: string): string;
export declare function parseYamlScript(content: string, filePath?: string): MidsceneYamlScript;
export declare function buildDetailedLocateParam(locatePrompt: TUserPrompt, opt?: LocateOption): DetailedLocateParam | undefined;
export declare function buildDetailedLocateParamAndRestParams(locatePrompt: TUserPrompt, opt: LocateOption | undefined, excludeKeys?: string[]): {
    locateParam: DetailedLocateParam | undefined;
    restParams: Record<string, any>;
};
