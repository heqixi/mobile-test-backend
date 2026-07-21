"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    markdownToAiActPrompt: ()=>markdownToAiActPrompt
});
const external_node_path_namespaceObject = require("node:path");
const MAX_MARKDOWN_IMAGES = 20;
const REFERENCE_IMAGE_PREFIX = '参考图片';
const imageNameForIndex = (index)=>`${REFERENCE_IMAGE_PREFIX}-${String(index + 1).padStart(3, '0')}`;
const formatSource = (sourcePath)=>sourcePath ? ` in ${sourcePath}` : '';
const hasUrlScheme = (url)=>/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url);
const resolveMarkdownImageUrl = (url, sourcePath)=>{
    if (!sourcePath || hasUrlScheme(url) || (0, external_node_path_namespaceObject.isAbsolute)(url)) return url;
    return (0, external_node_path_namespaceObject.resolve)((0, external_node_path_namespaceObject.dirname)(sourcePath), url);
};
const replaceMarkdownImages = (tree, sourcePath)=>{
    const images = [];
    const visitChildren = (node)=>{
        if (!Array.isArray(node.children)) return;
        node.children = node.children.map((child)=>{
            if ('imageReference' === child.type) {
                const identifier = child.identifier || child.label || 'unknown';
                throw new Error(`runMarkdown does not support reference-style image "${identifier}"${formatSource(sourcePath)}. Use direct image syntax instead.`);
            }
            if ('image' === child.type) {
                const name = imageNameForIndex(images.length);
                if (!child.url) throw new Error(`Markdown image ${name}${formatSource(sourcePath)} is missing a URL.`);
                images.push({
                    name,
                    url: resolveMarkdownImageUrl(child.url, sourcePath)
                });
                if (images.length > MAX_MARKDOWN_IMAGES) throw new Error(`runMarkdown supports at most ${MAX_MARKDOWN_IMAGES} images, but found ${images.length} images${formatSource(sourcePath)}.`);
                return {
                    type: 'text',
                    value: name
                };
            }
            visitChildren(child);
            return child;
        });
    };
    visitChildren(tree);
    return images;
};
const markdownToAiActPrompt = async (markdown, sourcePath)=>{
    const fromMarkdownModuleName = 'mdast-util-from-markdown';
    const toMarkdownModuleName = 'mdast-util-to-markdown';
    const { fromMarkdown } = await import(fromMarkdownModuleName);
    const { toMarkdown } = await import(toMarkdownModuleName);
    const tree = fromMarkdown(markdown);
    const images = replaceMarkdownImages(tree, sourcePath);
    if (0 === images.length) return {
        prompt: markdown,
        imageCount: 0
    };
    return {
        prompt: {
            prompt: toMarkdown(tree),
            images,
            convertHttpImage2Base64: true
        },
        imageCount: images.length
    };
};
exports.markdownToAiActPrompt = __webpack_exports__.markdownToAiActPrompt;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "markdownToAiActPrompt"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=run-markdown.js.map