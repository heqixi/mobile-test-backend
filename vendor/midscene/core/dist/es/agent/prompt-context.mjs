const buildPromptWithContext = (prompt, context)=>{
    const trimmedContext = context?.trim();
    if (!trimmedContext) return prompt;
    const promptText = 'string' == typeof prompt ? prompt : prompt.prompt;
    const promptWithContext = `Context for this request:\n${trimmedContext}\n\n${promptText}`;
    if ('string' == typeof prompt) return promptWithContext;
    return {
        ...prompt,
        prompt: promptWithContext
    };
};
export { buildPromptWithContext };

//# sourceMappingURL=prompt-context.mjs.map