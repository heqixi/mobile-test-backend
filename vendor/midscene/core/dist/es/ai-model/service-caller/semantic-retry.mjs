async function callAiAndParseWithRetry({ callAi, parseResponse, toParseError, parseRetryTimes = 0, parseRetryInterval = 0, abortSignal, onParseRetry }) {
    const normalizedRetryTimes = Number.isFinite(parseRetryTimes) ? Math.max(0, Math.floor(parseRetryTimes)) : 0;
    const normalizedRetryInterval = Number.isFinite(parseRetryInterval) ? Math.max(0, parseRetryInterval) : 0;
    const callAndParseOnce = async (remainingRetries)=>{
        const response = await callAi();
        try {
            return await parseResponse(response);
        } catch (error) {
            if (remainingRetries > 0 && !abortSignal?.aborted) {
                onParseRetry?.(error, response);
                if (normalizedRetryInterval > 0) await new Promise((resolve)=>setTimeout(resolve, normalizedRetryInterval));
                if (abortSignal?.aborted) throw toParseError(error, response);
                return callAndParseOnce(remainingRetries - 1);
            }
            throw toParseError(error, response);
        }
    };
    return callAndParseOnce(normalizedRetryTimes);
}
export { callAiAndParseWithRetry };

//# sourceMappingURL=semantic-retry.mjs.map