import { getDebug } from "@midscene/shared/logger";
import { actionParser } from "@ui-tars/action-parser";
const debug = getDebug('ui-tars-planning');
function parseUiTarsPlanningResponse(rawResponse, shotSize, uiTarsModelVersion) {
    const convertedText = convertBboxToCoordinates(rawResponse);
    const parseResult = actionParser({
        prediction: convertedText,
        factor: [
            1000,
            1000
        ],
        screenContext: {
            width: shotSize.width,
            height: shotSize.height
        },
        modelVer: uiTarsModelVersion
    });
    debug('ui-tars modelVer', uiTarsModelVersion, ', parsed', JSON.stringify(parseResult.parsed));
    return {
        rawResponse,
        actions: parseResult.parsed
    };
}
function convertBboxToCoordinates(text) {
    const pattern = /<bbox>(\d+)\s+(\d+)\s+(\d+)\s+(\d+)<\/bbox>/g;
    function replaceMatch(match, x1, y1, x2, y2) {
        const x1Num = Number.parseInt(x1, 10);
        const y1Num = Number.parseInt(y1, 10);
        const x2Num = Number.parseInt(x2, 10);
        const y2Num = Number.parseInt(y2, 10);
        const x = Math.floor((x1Num + x2Num) / 2);
        const y = Math.floor((y1Num + y2Num) / 2);
        return `(${x},${y})`;
    }
    const cleanedText = text.replace(/\[EOS\]/g, '').replace(/```(?:[a-zA-Z0-9_-]+)?/g, '');
    return cleanedText.replace(pattern, replaceMatch).trim();
}
export { parseUiTarsPlanningResponse };

//# sourceMappingURL=parser.mjs.map