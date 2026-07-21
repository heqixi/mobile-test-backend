const elementColor = [
    '#01204E'
];
const highlightColorForSearchArea = '#028391';
const highlightColorForElement = '#fd5907';
function djb2Hash(str) {
    if (!str) str = 'unnamed';
    let hash = 5381;
    for(let i = 0; i < str.length; i++)hash = (hash << 5) + hash + str.charCodeAt(i);
    return hash >>> 0;
}
function colorForName(name) {
    const hashNumber = djb2Hash(name);
    return elementColor[hashNumber % elementColor.length];
}
function highlightColorForType(type) {
    if ('searchArea' === type) return highlightColorForSearchArea;
    return highlightColorForElement;
}
function globalThemeConfig() {
    return {
        token: {
            colorPrimary: '#2B83FF'
        },
        components: {
            Layout: {
                headerHeight: 60,
                headerPadding: '0 30px',
                headerBg: '#FFF',
                bodyBg: '#FFF'
            }
        }
    };
}
export { colorForName, globalThemeConfig, highlightColorForType };
