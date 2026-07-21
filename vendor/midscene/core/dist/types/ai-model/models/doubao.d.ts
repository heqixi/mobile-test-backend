import type { ModelAdapterDefinition } from '../model-adapter/types';
import { type LocateResultValue } from '../shared/model-locate-result';
export declare function parseDoubaoRawLocateValue(input: unknown): LocateResultValue;
export declare const doubaoAdapters: {
    'doubao-vision': ModelAdapterDefinition;
    'doubao-seed': ModelAdapterDefinition;
};
