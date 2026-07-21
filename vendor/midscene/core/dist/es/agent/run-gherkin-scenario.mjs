const stepKeywordPattern = /^(Given|When|Then|And|But)\s+(.+)$/i;
const headerPattern = /^(Scenario):\s*(.*)$/i;
const unsupportedHeaderPattern = /^(Feature|Background|Scenario Outline|Scenario Template|Examples|Rule):/i;
const normalizeStepKeyword = (keyword)=>{
    const lowerKeyword = keyword.toLowerCase();
    if ('given' === lowerKeyword) return 'Given';
    if ('when' === lowerKeyword) return 'When';
    if ('then' === lowerKeyword) return 'Then';
    if ('and' === lowerKeyword) return 'And';
    return 'But';
};
const isPrimaryKeyword = (keyword)=>'Given' === keyword || 'When' === keyword || 'Then' === keyword;
const resolveSteps = (steps)=>{
    let previousPrimaryKeyword;
    return steps.map((step)=>{
        const effectiveKeyword = isPrimaryKeyword(step.keyword) ? step.keyword : previousPrimaryKeyword;
        if (!effectiveKeyword) throw new Error(`runGherkinScenario cannot resolve "${step.keyword}" at line ${step.lineNumber}; use Given, When, or Then before ${step.keyword}.`);
        previousPrimaryKeyword = effectiveKeyword;
        return {
            ...step,
            effectiveKeyword
        };
    });
};
const throwIfAborted = (abortSignal)=>{
    if (!abortSignal?.aborted) return;
    if ('function' == typeof abortSignal.throwIfAborted) abortSignal.throwIfAborted();
    throw new Error(`runGherkinScenario aborted: ${abortSignal.reason || 'signal already aborted'}`);
};
const parseGherkinScenario = (scenarioText)=>{
    const lines = scenarioText.split(/\r?\n/);
    const scenarioSteps = [];
    const anonymousSteps = [];
    let scenario;
    let scenarioCount = 0;
    let section = 'prelude';
    for (const [lineIndex, rawLine] of lines.entries()){
        const lineNumber = lineIndex + 1;
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || line.startsWith('@')) continue;
        if ('"""' === line || "'''" === line) throw new Error(`runGherkinScenario does not support doc strings; found one at line ${lineNumber}.`);
        if (line.startsWith('|')) throw new Error(`runGherkinScenario does not support data tables; found one at line ${lineNumber}.`);
        if (unsupportedHeaderPattern.test(line)) throw new Error(`runGherkinScenario does not support "${line}" at line ${lineNumber}.`);
        const headerMatch = line.match(headerPattern);
        if (headerMatch) {
            scenarioCount += 1;
            scenario = headerMatch[2].trim() || void 0;
            section = 'scenario';
            continue;
        }
        const stepMatch = line.match(stepKeywordPattern);
        if (stepMatch) {
            const step = {
                keyword: normalizeStepKeyword(stepMatch[1]),
                text: stepMatch[2].trim(),
                lineNumber
            };
            if ('scenario' === section) scenarioSteps.push(step);
            else anonymousSteps.push(step);
            continue;
        }
        throw new Error(`runGherkinScenario does not support content at line ${lineNumber}: ${line}`);
    }
    if (scenarioCount > 1) throw new Error(`runGherkinScenario expects exactly one Scenario, but found ${scenarioCount}.`);
    if (1 === scenarioCount && anonymousSteps.length > 0) throw new Error('runGherkinScenario cannot mix anonymous steps with a Scenario block.');
    const rawSteps = 1 === scenarioCount ? scenarioSteps : anonymousSteps;
    if (0 === rawSteps.length) throw new Error('runGherkinScenario requires at least one Gherkin step.');
    return {
        scenario,
        steps: resolveSteps(rawSteps)
    };
};
const buildStepPrompt = (step)=>{
    if ('Given' === step.effectiveKeyword) return `Set up this precondition: ${step.text}`;
    if ('When' === step.effectiveKeyword) return `Perform this user action: ${step.text}`;
    return `Verify that ${step.text}`;
};
const describeStepExecution = (step, action)=>{
    const keywordMapping = step.keyword === step.effectiveKeyword ? step.keyword : `${step.keyword} as ${step.effectiveKeyword}`;
    if ('Given' === step.effectiveKeyword) return `setting up the precondition (${keywordMapping} -> ${action})`;
    if ('When' === step.effectiveKeyword) return `performing the user action (${keywordMapping} -> ${action})`;
    return `verifying the expected result (${keywordMapping} -> ${action})`;
};
const describeErrorCause = (error)=>{
    if (error instanceof Error && error.message) return ` Original error: ${error.message}`;
    return '';
};
const runGherkinScenario = async (agent, scenarioText, opt)=>{
    const parsedScenario = parseGherkinScenario(scenarioText);
    const aiActOptions = {
        ...opt,
        cacheable: false
    };
    for (const step of parsedScenario.steps){
        throwIfAborted(opt?.abortSignal);
        const action = 'Then' === step.effectiveKeyword ? 'aiAssert' : 'aiAct';
        const prompt = buildStepPrompt(step);
        try {
            if ('aiAct' === action) await agent.aiAct(prompt, aiActOptions);
            else if (opt?.context || opt?.abortSignal) await agent.aiAssert(prompt, void 0, {
                context: opt.context,
                abortSignal: opt.abortSignal
            });
            else await agent.aiAssert(prompt);
        } catch (error) {
            throw new Error(`runGherkinScenario failed while ${describeStepExecution(step, action)} at line ${step.lineNumber}: ${step.keyword} ${step.text}.${describeErrorCause(error)}`, {
                cause: error
            });
        }
    }
};
export { parseGherkinScenario, runGherkinScenario };

//# sourceMappingURL=run-gherkin-scenario.mjs.map