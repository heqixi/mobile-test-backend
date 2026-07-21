const getPlaceholderForType = (type)=>{
    if ('aiQuery' === type) return 'What do you want to query?';
    if ('aiAssert' === type) return 'What do you want to assert?';
    if ('aiTap' === type) return 'What element do you want to tap?';
    if ('aiDoubleClick' === type) return 'What element do you want to double-click?';
    if ('aiHover' === type) return 'What element do you want to hover over?';
    if ('aiInput' === type) return 'Format: <value> | <element>\nExample: hello world | search box';
    if ('aiRightClick' === type) return 'What element do you want to right-click?';
    if ('aiKeyboardPress' === type) return 'Format: <key> | <element (optional)>\nExample: Enter | text field';
    if ('aiScroll' === type) return 'Format: <direction> <amount> | <element (optional)>\nExample: down 500 | main content';
    if ('aiLocate' === type) return 'What element do you want to locate?';
    if ('aiBoolean' === type) return 'What do you want to check (returns true/false)?';
    if ('aiNumber' === type) return 'What number do you want to extract?';
    if ('aiString' === type) return 'What text do you want to extract?';
    if ('aiAsk' === type) return 'What do you want to ask?';
    if ('aiWaitFor' === type) return 'What condition do you want to wait for?';
    return 'What do you want to do?';
};
export { getPlaceholderForType };
