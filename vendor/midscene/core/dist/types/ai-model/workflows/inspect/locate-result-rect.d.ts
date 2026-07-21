import type { PixelBbox } from '../../shared/model-locate-result';
import type { Rect } from '../../../types';
export declare function mergePixelBboxesToRect(pixelBboxes: PixelBbox[]): Rect;
export declare function pixelBboxToRect([left, top, right, bottom]: PixelBbox): Rect;
