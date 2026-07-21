/**
 * Internal-only helpers for CLI argument key aliasing.
 * Not re-exported from the package entry point — keep consumers within
 * `cli/`.
 */
export declare function kebabToCamel(str: string): string;
export declare function camelToKebab(str: string): string;
export declare function getKeyAliases(key: string): string[];
export declare function isRecord(value: unknown): value is Record<string, unknown>;
