const TOOL_BEHAVIOR_FLAGS = [
    {
        cli: 'deep-locate',
        description: 'Force deep locate for every locating operation (better precision for small/ambiguous targets, a bit slower).',
        defaults: {
            locate: {
                deepLocate: true
            },
            act: {
                deepLocate: true
            }
        }
    },
    {
        cli: 'deep-think',
        description: 'Plan the act tool with deep thinking (richer context and sub-goal decomposition, a bit slower).',
        defaults: {
            act: {
                deepThink: true
            }
        }
    }
];
function mergeToolDefaults(a, b) {
    const locate = {
        ...a.locate,
        ...b.locate
    };
    const act = {
        ...a.act,
        ...b.act
    };
    const result = {};
    if (Object.keys(locate).length > 0) result.locate = locate;
    if (Object.keys(act).length > 0) result.act = act;
    return result;
}
function resolveToolDefaults(isEnabled) {
    return TOOL_BEHAVIOR_FLAGS.reduce((acc, flag)=>isEnabled(flag.cli) ? mergeToolDefaults(acc, flag.defaults) : acc, {});
}
function stripBehaviorFlags(argv) {
    const enabled = new Set();
    const rawArgs = [];
    for (const arg of argv){
        const flag = TOOL_BEHAVIOR_FLAGS.find((f)=>arg === `--${f.cli}`);
        if (flag) enabled.add(flag.cli);
        else rawArgs.push(arg);
    }
    return {
        rawArgs,
        toolDefaults: resolveToolDefaults((cli)=>enabled.has(cli))
    };
}
export { TOOL_BEHAVIOR_FLAGS, mergeToolDefaults, resolveToolDefaults, stripBehaviorFlags };
