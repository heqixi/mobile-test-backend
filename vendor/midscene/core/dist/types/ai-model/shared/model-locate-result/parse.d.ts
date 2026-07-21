import type { BboxLocateResultCoordinates, BboxLocateResultValue, LocateResultValue, PointLocateResultCoordinates, PointLocateResultValue, ResolvedLocateResultCoordinates } from './types';
type CoordinateListLikeInput = number[] | string[] | string | (number[] | string[])[];
export declare function unwrapCoordinateListLikeInput(coordinateList: CoordinateListLikeInput): number[] | string[] | string;
export declare function parseCoordinateList(input: unknown, label: string): number[];
export declare function createLocateResultValue(coordinatesMeta: PointLocateResultCoordinates, coordinates: number[]): PointLocateResultValue;
export declare function createLocateResultValue(coordinatesMeta: BboxLocateResultCoordinates, coordinates: number[]): BboxLocateResultValue;
export declare function parseNumericLocateResult(resolvedCoordinates: ResolvedLocateResultCoordinates, input: unknown): LocateResultValue;
export {};
