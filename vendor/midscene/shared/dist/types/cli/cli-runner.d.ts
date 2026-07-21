import type { BaseMidsceneTools } from '../agent-tools/base-tools';
import type { ToolDefinition } from '../agent-tools/types';
export interface CLIExtraCommand {
    name: string;
    def: ToolDefinition;
    aliases?: string[];
    hidden?: boolean;
}
export interface CLIRunnerOptions {
    stripPrefix?: string;
    argv?: string[];
    version?: string;
    extraCommands?: CLIExtraCommand[];
}
export { parseCliArgs, parseValue } from './cli-args';
export { CLIError, reportCLIError } from './cli-error';
export declare function removePrefix(name: string, prefix?: string): string;
type AnyMidsceneTools = BaseMidsceneTools<any, any>;
export declare function runToolsCLI(tools: AnyMidsceneTools, scriptName: string, options?: CLIRunnerOptions): Promise<void>;
