import { paddingToMatchBlockByBase64 } from "@midscene/shared/img";
async function prepareModelImage(options) {
    const { imageBase64, width, height, policy } = options;
    let preparedImageBase64 = imageBase64;
    let modelWidth = width;
    let modelHeight = height;
    if (void 0 !== policy.padBlockSize) {
        const paddedResult = await paddingToMatchBlockByBase64(imageBase64, policy.padBlockSize);
        preparedImageBase64 = paddedResult.imageBase64;
        modelWidth = paddedResult.width;
        modelHeight = paddedResult.height;
    }
    return {
        imageBase64: preparedImageBase64,
        preparedSize: {
            width: modelWidth,
            height: modelHeight
        },
        contentSize: {
            width,
            height
        }
    };
}
export { prepareModelImage };

//# sourceMappingURL=image-preprocess.mjs.map