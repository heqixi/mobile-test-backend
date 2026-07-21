const actionNameForType = (type)=>{
    if (!type) return '';
    if ('aiAct' === type) return 'Action';
    const typeWithoutAi = type.startsWith('ai') ? type.slice(2) : type;
    if (typeWithoutAi.startsWith('IOS')) return typeWithoutAi.substring(3).replace(/([A-Z])/g, ' $1').replace(/^/, 'IOS').trim();
    const fullName = typeWithoutAi.replace(/([A-Z])/g, ' $1').trim();
    const words = fullName.split(' ');
    const result = words.length > 3 ? words.slice(-3).join(' ') : fullName;
    return result.replace(/\b\w/g, (c)=>c.toUpperCase());
};
const getPromptInputActionLabel = (type, overrideLabel)=>{
    if (overrideLabel) return overrideLabel;
    return actionNameForType(type) || 'Action';
};
export { actionNameForType, getPromptInputActionLabel };
