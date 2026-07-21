import { defineActionsFromInputPrimitives } from "@midscene/core/device";
import { ERROR_CODE_NOT_IMPLEMENTED_AS_DESIGNED } from "@midscene/shared/common";
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
const ThrowNotImplemented = (methodName)=>{
    throw new Error(`The method "${methodName}" is not implemented as designed since this is a static UI context. (${ERROR_CODE_NOT_IMPLEMENTED_AS_DESIGNED})`);
};
class StaticPage {
    actionSpace() {
        return defineActionsFromInputPrimitives(this.inputPrimitives, {
            size: ()=>this.size()
        });
    }
    async evaluateJavaScript(script) {
        return ThrowNotImplemented('evaluateJavaScript');
    }
    async getElementsInfo() {
        return ThrowNotImplemented('getElementsInfo');
    }
    async getElementsNodeTree() {
        return ThrowNotImplemented('getElementsNodeTree');
    }
    async getXpathsByPoint(point) {
        return ThrowNotImplemented('getXpathsByPoint');
    }
    async getElementInfoByXpath(xpath) {
        return ThrowNotImplemented('getElementInfoByXpath');
    }
    async size() {
        return {
            ...this.uiContext.shotSize
        };
    }
    async screenshotBase64() {
        const screenshot = this.uiContext.screenshot;
        if ('object' == typeof screenshot && 'base64' in screenshot) return screenshot.base64;
        return screenshot;
    }
    async url() {
        return Promise.resolve('https://static_page_without_url');
    }
    async scrollUntilTop(startingPoint) {
        return ThrowNotImplemented('scrollUntilTop');
    }
    async scrollUntilBottom(startingPoint) {
        return ThrowNotImplemented('scrollUntilBottom');
    }
    async scrollUntilLeft(startingPoint) {
        return ThrowNotImplemented('scrollUntilLeft');
    }
    async scrollUntilRight(startingPoint) {
        return ThrowNotImplemented('scrollUntilRight');
    }
    async scrollUp(distance, startingPoint) {
        return ThrowNotImplemented('scrollUp');
    }
    async scrollDown(distance, startingPoint) {
        return ThrowNotImplemented('scrollDown');
    }
    async scrollLeft(distance, startingPoint) {
        return ThrowNotImplemented('scrollLeft');
    }
    async scrollRight(distance, startingPoint) {
        return ThrowNotImplemented('scrollRight');
    }
    async clearInput() {
        return ThrowNotImplemented('clearInput');
    }
    async destroy() {}
    updateContext(newContext) {
        this.uiContext = newContext;
    }
    constructor(uiContext){
        _define_property(this, "interfaceType", 'static');
        _define_property(this, "uiContext", void 0);
        _define_property(this, "inputPrimitives", {
            pointer: {
                tap: async ()=>ThrowNotImplemented('Tap'),
                rightClick: async ()=>ThrowNotImplemented('RightClick'),
                hover: async ()=>ThrowNotImplemented('Hover'),
                dragAndDrop: async ()=>ThrowNotImplemented('DragAndDrop')
            },
            keyboard: {
                typeText: async ()=>ThrowNotImplemented('Input'),
                keyboardPress: async ()=>ThrowNotImplemented('KeyboardPress'),
                clearInput: async ()=>ThrowNotImplemented('ClearInput')
            },
            touch: {
                swipe: async ()=>ThrowNotImplemented('Swipe')
            },
            scroll: {
                scroll: async ()=>ThrowNotImplemented('Scroll')
            }
        });
        _define_property(this, "mouse", {
            click: ThrowNotImplemented.bind(null, 'mouse.click'),
            wheel: ThrowNotImplemented.bind(null, 'mouse.wheel'),
            move: ThrowNotImplemented.bind(null, 'mouse.move'),
            drag: ThrowNotImplemented.bind(null, 'mouse.drag')
        });
        _define_property(this, "keyboard", {
            type: ThrowNotImplemented.bind(null, 'keyboard.type'),
            press: ThrowNotImplemented.bind(null, 'keyboard.press')
        });
        this.uiContext = uiContext;
    }
}
export { StaticPage as default };

//# sourceMappingURL=static-page.mjs.map