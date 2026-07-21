export default function getPhoton(): Promise<{
    PhotonImage: typeof import('@silvia-odwyer/photon').PhotonImage;
    SamplingFilter: typeof import('@silvia-odwyer/photon').SamplingFilter;
    resize: typeof import('@silvia-odwyer/photon').resize;
    crop: typeof import('@silvia-odwyer/photon').crop;
    open_image: typeof import('@silvia-odwyer/photon').open_image;
    base64_to_image: typeof import('@silvia-odwyer/photon').base64_to_image;
    padding_uniform: typeof import('@silvia-odwyer/photon').padding_uniform;
    padding_left: typeof import('@silvia-odwyer/photon').padding_left;
    padding_right: typeof import('@silvia-odwyer/photon').padding_right;
    padding_top: typeof import('@silvia-odwyer/photon').padding_top;
    padding_bottom: typeof import('@silvia-odwyer/photon').padding_bottom;
    watermark: typeof import('@silvia-odwyer/photon').watermark;
    Rgba: typeof import('@silvia-odwyer/photon').Rgba;
}>;
/**
 * Check if we're using the Canvas fallback instead of Photon
 */
export declare function isUsingCanvasFallback(): boolean;
