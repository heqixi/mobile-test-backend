import type { LocateResultValue, PixelBbox } from './types';
export declare function mapLocateResultToPixelBboxByCoordinates(result: LocateResultValue, { preparedSize }: {
    preparedSize: {
        width: number;
        height: number;
    };
}): PixelBbox;
