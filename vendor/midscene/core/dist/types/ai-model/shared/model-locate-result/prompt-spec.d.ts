import type { LocateResultBbox, LocateResultPromptSpec, ResolvedLocateResultCoordinates } from './types';
export declare function describeLocateResultValueSchema({ shape, }: ResolvedLocateResultCoordinates): string;
export declare function locateResultExampleValue(resolvedCoordinates: ResolvedLocateResultCoordinates, region: LocateResultBbox): number[];
export declare const locateResultExampleRegions: LocateResultBbox[];
export declare function createLocateResultPromptSpec(resolvedCoordinates: ResolvedLocateResultCoordinates): LocateResultPromptSpec;
