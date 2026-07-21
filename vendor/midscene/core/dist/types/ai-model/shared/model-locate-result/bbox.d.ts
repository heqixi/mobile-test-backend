import type { LocateResultBbox, LocateResultContext, PixelBbox, SectionLocatePixelBboxGroup } from './types';
export declare function maxPixelIndex(size: number): number;
export declare function normalizedCoordinateToPixelIndex(value: number, normalizedBy: number, size: number): number;
export declare function mapNormalizedCoordinatesToPixelBbox(coordinates: LocateResultBbox, normalizedBy: number, width: number, height: number): PixelBbox;
export declare function expandPointToBbox(x: number, y: number, maxX: number, maxY: number, halfSize: number): LocateResultBbox;
export declare function finalizePixelBbox(pixelBbox: PixelBbox, rawResult: unknown, { preparedSize, contentSize }: LocateResultContext): PixelBbox;
export declare function finalizeSectionLocatePixelBboxGroup(result: SectionLocatePixelBboxGroup, rawResult: unknown, ctx: LocateResultContext): SectionLocatePixelBboxGroup;
