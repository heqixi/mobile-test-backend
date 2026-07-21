import type { PixelBbox } from '../../shared/model-locate-result';
import type { SearchAreaImageMapping } from './types';
export declare function mapSearchAreaPixelBboxToOriginalPixelBbox([left, top, right, bottom]: PixelBbox, mapping?: SearchAreaImageMapping): PixelBbox;
