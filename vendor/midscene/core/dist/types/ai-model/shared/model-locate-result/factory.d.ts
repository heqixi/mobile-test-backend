import type { LocateResultAdapter, LocateResultAdapterDefinition, LocateResultCoordinates, ResolvedLocateResultCoordinates } from './types';
export declare function resolveLocateResultCoordinates(coordinates: LocateResultCoordinates): ResolvedLocateResultCoordinates;
export declare function createLocateResultAdapter(config: LocateResultAdapterDefinition): LocateResultAdapter;
