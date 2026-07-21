import type { Size } from '../../../types';
import type { ResolvedLocateResultCoordinates } from './types';
export type CoordinateDistanceAxis = 'x' | 'y';
export declare function createCoordinateDistanceToPixels(size: Size, coordinateSystem: ResolvedLocateResultCoordinates): (delta: number, axis: CoordinateDistanceAxis) => number;
