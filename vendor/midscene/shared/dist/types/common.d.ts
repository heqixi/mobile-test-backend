export declare const defaultRunDirName = "midscene_run";
/**
 * Sets the run directory for the current process without changing the
 * environment. Callers that do not set it keep the existing environment-based
 * behavior.
 */
export declare const setMidsceneRunDir: (runDir: string | undefined) => void;
export declare const getMidsceneRunDir: () => string;
export declare const getMidsceneRunBaseDir: () => string;
/**
 * Get the path to the midscene_run directory or a subdirectory within it.
 * Creates the directory if it doesn't exist.
 *
 * @param subdir - Optional subdirectory name (e.g., 'log', 'report')
 * @returns The absolute path to the requested directory
 */
export declare const getMidsceneRunSubDir: (subdir: "dump" | "cache" | "report" | "tmp" | "log" | "output") => string;
export declare const ERROR_CODE_NOT_IMPLEMENTED_AS_DESIGNED = "NOT_IMPLEMENTED_AS_DESIGNED";
