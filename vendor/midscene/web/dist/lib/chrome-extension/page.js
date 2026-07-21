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
    default: ()=>ChromeExtensionProxyPage
});
const external_web_element_js_namespaceObject = require("../web-element.js");
const extractor_namespaceObject = require("@midscene/shared/extractor");
const img_namespaceObject = require("@midscene/shared/img");
const logger_namespaceObject = require("@midscene/shared/logger");
const utils_namespaceObject = require("@midscene/shared/utils");
const cache_helper_js_namespaceObject = require("../common/cache-helper.js");
const external_web_page_js_namespaceObject = require("../web-page.js");
const external_cdpInput_js_namespaceObject = require("./cdpInput.js");
const external_dynamic_scripts_js_namespaceObject = require("./dynamic-scripts.js");
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
const debug = (0, logger_namespaceObject.getDebug)('web:chrome-extension:page');
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
function hasFlatNodeAttribute(attributes, name) {
    if (!attributes) return false;
    for(let i = 0; i < attributes.length; i += 2)if (attributes[i] === name) return true;
    return false;
}
function serializeError(error) {
    return {
        message: error.message,
        name: error.name,
        stack: error.stack
    };
}
class ChromeExtensionProxyPage {
    actionSpace() {
        return (0, external_web_page_js_namespaceObject.commonWebActionsForWebPage)(this);
    }
    async setActiveTabId(tabId) {
        if (this.activeTabId) throw new Error(`Active tab id is already set, which is ${this.activeTabId}, cannot set it to ${tabId}`);
        await chrome.tabs.update(tabId, {
            active: true
        });
        this.activeTabId = tabId;
    }
    async getActiveTabId() {
        return this.activeTabId;
    }
    async getBrowserTabList() {
        const tabs = await chrome.tabs.query({
            currentWindow: true
        });
        return tabs.map((tab)=>({
                id: `${tab.id}`,
                title: tab.title,
                url: tab.url,
                currentActiveTab: tab.active
            })).filter((tab)=>tab.id && tab.title && tab.url);
    }
    async getTabIdOrConnectToCurrentTab() {
        if (this.activeTabId) return this.activeTabId;
        const tabId = await chrome.tabs.query({
            active: true,
            currentWindow: true
        }).then((tabs)=>tabs[0]?.id);
        this.activeTabId = tabId || 0;
        return this.activeTabId;
    }
    async ensureDebuggerAttached() {
        (0, utils_namespaceObject.assert)(!this.destroyed, 'Page is destroyed');
        const url = await this.url();
        if (url.startsWith('chrome://')) throw new Error('Cannot attach debugger to chrome:// pages, please use Midscene in a normal page with http://, https:// or file://');
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        try {
            await chrome.debugger.attach({
                tabId
            }, '1.3');
            console.log('Debugger attached to tab:', tabId);
        } catch (error) {
            const errorMsg = error?.message || '';
            if (errorMsg.includes('Another debugger is already attached')) return void console.log('Debugger already attached to tab:', tabId);
            if (this._continueWhenFailedToAttachDebugger) return void console.warn('Failed to attach debugger, but continuing due to _continueWhenFailedToAttachDebugger flag', error);
            throw error;
        }
        await sleep(500);
        this.enableWaterFlowAnimation().catch((err)=>{
            console.warn('Failed to enable water flow animation:', err);
        });
    }
    async showMousePointer(x, y) {
        const pointerScript = `(() => {
      if(typeof window.midsceneWaterFlowAnimation !== 'undefined') {
        window.midsceneWaterFlowAnimation.enable();
        window.midsceneWaterFlowAnimation.showMousePointer(${x}, ${y});
      } else {
        console.log('midsceneWaterFlowAnimation is not defined');
      }
    })()`;
        await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: `${pointerScript}`
        });
    }
    async hideMousePointer() {
        await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: `(() => {
        if(typeof window.midsceneWaterFlowAnimation !== 'undefined') {
          window.midsceneWaterFlowAnimation.hideMousePointer();
        }
      })()`
        });
    }
    async detachDebugger(tabId) {
        const tabIdToDetach = tabId || await this.getTabIdOrConnectToCurrentTab();
        console.log('detaching debugger from tab:', tabIdToDetach);
        try {
            await this.disableWaterFlowAnimation(tabIdToDetach);
            await sleep(200);
        } catch (error) {
            console.warn('Failed to disable water flow animation', error);
        }
        try {
            await chrome.debugger.detach({
                tabId: tabIdToDetach
            });
            console.log('Debugger detached successfully from tab:', tabIdToDetach);
        } catch (error) {
            console.warn('Failed to detach debugger (may already be detached):', error);
        }
    }
    async enableWaterFlowAnimation() {
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        if (this.forceSameTabNavigation) await chrome.debugger.sendCommand({
            tabId
        }, 'Runtime.evaluate', {
            expression: external_web_element_js_namespaceObject.limitOpenNewTabScript
        });
        const script = await (0, external_dynamic_scripts_js_namespaceObject.injectWaterFlowAnimation)();
        await chrome.debugger.sendCommand({
            tabId
        }, 'Runtime.evaluate', {
            expression: script
        });
    }
    async disableWaterFlowAnimation(tabId) {
        const script = await (0, external_dynamic_scripts_js_namespaceObject.injectStopWaterFlowAnimation)();
        await chrome.debugger.sendCommand({
            tabId
        }, 'Runtime.evaluate', {
            expression: script
        });
    }
    async sendCommandToDebugger(command, params, retryCount = 0) {
        const MAX_RETRIES = 2;
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        try {
            const result = await chrome.debugger.sendCommand({
                tabId
            }, command, params);
            this.enableWaterFlowAnimation().catch((err)=>{
                console.warn('Failed to enable water flow animation:', err);
            });
            return result;
        } catch (error) {
            const errorMsg = error?.message || '';
            const isDetachError = errorMsg.includes('Debugger is not attached') || errorMsg.includes('Cannot access a Target') || errorMsg.includes('No target with given id');
            if (isDetachError && retryCount < MAX_RETRIES) {
                console.log(`Debugger not attached for command "${command}", attempting to attach (retry ${retryCount + 1}/${MAX_RETRIES})`);
                await this.ensureDebuggerAttached();
                return this.sendCommandToDebugger(command, params, retryCount + 1);
            }
            throw error;
        }
    }
    async getPageContentByCDP() {
        const script = await (0, external_dynamic_scripts_js_namespaceObject.getHtmlElementScript)();
        await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: script
        });
        const expression = ()=>{
            const tree = window.midscene_element_inspector.webExtractNodeTree();
            return {
                tree,
                size: {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                }
            };
        };
        const returnValue = await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: `(${expression.toString()})()`,
            returnByValue: true
        });
        if (!returnValue.result.value) {
            const errorDescription = returnValue.exceptionDetails?.exception?.description || '';
            if (!errorDescription) console.error('returnValue from cdp', returnValue);
            throw new Error(`Failed to get page content from page, error: ${errorDescription}`);
        }
        return returnValue.result.value;
    }
    async evaluateJavaScript(script) {
        return this.sendCommandToDebugger('Runtime.evaluate', {
            expression: script,
            awaitPromise: true
        });
    }
    async registerFileChooserListener(handler) {
        const registrationVersion = ++this.fileChooserRegistrationVersion;
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        await this.ensureDebuggerAttached();
        await this.sendCommandToDebugger('Page.enable', {});
        await this.sendCommandToDebugger('DOM.enable', {});
        await this.sendCommandToDebugger('Page.setInterceptFileChooserDialog', {
            enabled: true
        });
        if (this.fileChooserEventHandler) {
            chrome.debugger.onEvent.removeListener(this.fileChooserEventHandler);
            this.fileChooserEventHandler = void 0;
        }
        let capturedError;
        let pendingFileChooserHandling = Promise.resolve();
        const fileChooserEventHandler = (source, method, params)=>{
            if (source.tabId !== tabId || 'Page.fileChooserOpened' !== method) return;
            const event = params;
            if (void 0 === event.backendNodeId) return void debug('chrome extension file chooser opened without backendNodeId, skip');
            const currentFileChooserHandling = (async ()=>{
                try {
                    await handler({
                        accept: async (files)=>{
                            const { node } = await this.sendCommandToDebugger('DOM.describeNode', {
                                backendNodeId: event.backendNodeId
                            });
                            const hasWebkitDirectory = hasFlatNodeAttribute(node.attributes, 'webkitdirectory') || hasFlatNodeAttribute(node.attributes, 'directory');
                            if (hasWebkitDirectory) throw new Error('Directory upload (webkitdirectory) is not supported in Chrome extension bridge mode. Please use Playwright instead, which supports directory upload since version 1.45.');
                            if (files.length > 1 && !hasFlatNodeAttribute(node.attributes, 'multiple')) throw new Error('Non-multiple file input can only accept single file');
                            await this.sendCommandToDebugger('DOM.setFileInputFiles', {
                                files,
                                backendNodeId: event.backendNodeId
                            });
                        }
                    });
                } catch (error) {
                    capturedError = error instanceof Error ? error : new Error(String(error));
                }
            })();
            const previousFileChooserHandling = pendingFileChooserHandling;
            pendingFileChooserHandling = Promise.all([
                previousFileChooserHandling,
                currentFileChooserHandling
            ]).then(()=>{});
        };
        this.fileChooserEventHandler = fileChooserEventHandler;
        chrome.debugger.onEvent.addListener(fileChooserEventHandler);
        return {
            dispose: ()=>{
                if (this.fileChooserEventHandler !== fileChooserEventHandler) return;
                chrome.debugger.onEvent.removeListener(fileChooserEventHandler);
                this.fileChooserEventHandler = void 0;
                Promise.resolve().then(()=>{
                    if (this.fileChooserRegistrationVersion !== registrationVersion) return;
                    return this.sendCommandToDebugger('Page.setInterceptFileChooserDialog', {
                        enabled: false
                    });
                }).catch((error)=>{
                    debug('failed to disable file chooser interception: %O', error);
                });
            },
            getError: async ()=>{
                await pendingFileChooserHandling;
                return capturedError;
            }
        };
    }
    async registerFileChooserAccept(files) {
        this.clearFileChooserAccept();
        const { dispose, getError } = await this.registerFileChooserListener(async (chooser)=>{
            await chooser.accept(files);
        });
        this.bridgeFileChooserDispose = dispose;
        this.bridgeFileChooserGetError = getError;
    }
    clearFileChooserAccept() {
        this.bridgeFileChooserDispose?.();
        this.bridgeFileChooserDispose = void 0;
        this.bridgeFileChooserGetError = void 0;
    }
    async getFileChooserError() {
        const error = await this.bridgeFileChooserGetError?.();
        return error ? serializeError(error) : void 0;
    }
    async beforeInvokeAction() {
        try {
            await this.waitUntilNetworkIdle();
        } catch (error) {}
    }
    async waitUntilNetworkIdle() {
        const timeout = 10000;
        const startTime = Date.now();
        let lastReadyState = '';
        while(Date.now() - startTime < timeout){
            const result = await this.sendCommandToDebugger('Runtime.evaluate', {
                expression: 'document.readyState'
            });
            lastReadyState = result.result.value;
            if ('complete' === lastReadyState) return void await new Promise((resolve)=>setTimeout(resolve, 300));
            await new Promise((resolve)=>setTimeout(resolve, 300));
        }
        throw new Error(`Failed to wait until network idle, last readyState: ${lastReadyState}`);
    }
    async getElementsInfo() {
        const tree = await this.getElementsNodeTree();
        return (0, extractor_namespaceObject.treeToList)(tree);
    }
    async getXpathsByPoint(point, isOrderSensitive = false) {
        const script = await (0, external_dynamic_scripts_js_namespaceObject.getHtmlElementScript)();
        await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: script
        });
        const result = await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: `window.midscene_element_inspector.getXpathsByPoint({left: ${point.left}, top: ${point.top}}, ${isOrderSensitive})`,
            returnByValue: true
        });
        return result.result.value;
    }
    async getElementInfoByXpath(xpath) {
        const script = await (0, external_dynamic_scripts_js_namespaceObject.getHtmlElementScript)();
        await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: script
        });
        const result = await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: `window.midscene_element_inspector.getElementInfoByXpath(${JSON.stringify(xpath)})`,
            returnByValue: true
        });
        return result.result.value;
    }
    async cacheFeatureForPoint(center, options) {
        const point = {
            left: center[0],
            top: center[1]
        };
        try {
            const isOrderSensitive = await (0, cache_helper_js_namespaceObject.judgeOrderSensitive)(options, debug);
            const xpaths = await this.getXpathsByPoint(point, isOrderSensitive);
            return {
                xpaths: (0, cache_helper_js_namespaceObject.sanitizeXpaths)(xpaths)
            };
        } catch (error) {
            debug('cacheFeatureForPoint failed: %O', error);
            return {
                xpaths: []
            };
        }
    }
    async rectMatchesCacheFeature(feature) {
        const xpaths = (0, cache_helper_js_namespaceObject.sanitizeXpaths)(feature.xpaths);
        for (const xpath of xpaths)try {
            const elementInfo = await this.getElementInfoByXpath(xpath);
            if (elementInfo?.rect) return (0, cache_helper_js_namespaceObject.buildRectFromElementInfo)(elementInfo);
        } catch (error) {
            debug('rectMatchesCacheFeature failed for xpath %s: %O', xpath, error);
        }
        throw new Error(`No matching element rect found for cache feature (tried ${xpaths.length} xpath(s))`);
    }
    async getElementsNodeTree() {
        await this.hideMousePointer();
        const content = await this.getPageContentByCDP();
        if (content?.size) this.viewportSize = content.size;
        return content?.tree || {
            node: null,
            children: []
        };
    }
    async size() {
        if (this.viewportSize) return this.viewportSize;
        const result = await this.sendCommandToDebugger('Runtime.evaluate', {
            expression: '({width: window.innerWidth, height: window.innerHeight})',
            returnByValue: true
        });
        const sizeInfo = result.result.value;
        console.log('sizeInfo', sizeInfo);
        this.viewportSize = sizeInfo;
        return sizeInfo;
    }
    async screenshotBase64() {
        await this.hideMousePointer();
        const format = 'jpeg';
        const base64 = await this.sendCommandToDebugger('Page.captureScreenshot', {
            format,
            quality: 90
        });
        return (0, img_namespaceObject.createImgBase64ByFormat)(format, base64.data);
    }
    async url() {
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        const url = await chrome.tabs.get(tabId).then((tab)=>tab.url);
        return url || '';
    }
    async navigate(url) {
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        await chrome.tabs.update(tabId, {
            url
        });
        await this.waitUntilNetworkIdle();
    }
    async reload() {
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        await chrome.tabs.reload(tabId);
        await this.waitUntilNetworkIdle();
    }
    async goBack() {
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        await chrome.tabs.goBack(tabId);
        await this.waitUntilNetworkIdle();
    }
    async goForward() {
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        await chrome.tabs.goForward(tabId);
        await this.waitUntilNetworkIdle();
    }
    async stopLoading() {
        await this.sendCommandToDebugger('Page.stopLoading', {});
    }
    async navigationState() {
        const tabId = await this.getTabIdOrConnectToCurrentTab();
        const tab = await chrome.tabs.get(tabId);
        return {
            isLoading: 'loading' === tab.status
        };
    }
    async scrollUntilTop(startingPoint) {
        if (startingPoint) await this.mouse.move(startingPoint.left, startingPoint.top);
        return this.mouse.wheel(0, -9999999);
    }
    async scrollUntilBottom(startingPoint) {
        if (startingPoint) await this.mouse.move(startingPoint.left, startingPoint.top);
        return this.mouse.wheel(0, 9999999);
    }
    async scrollUntilLeft(startingPoint) {
        if (startingPoint) await this.mouse.move(startingPoint.left, startingPoint.top);
        return this.mouse.wheel(-9999999, 0);
    }
    async scrollUntilRight(startingPoint) {
        if (startingPoint) await this.mouse.move(startingPoint.left, startingPoint.top);
        return this.mouse.wheel(9999999, 0);
    }
    async scrollUp(distance, startingPoint) {
        const { height } = await this.size();
        const scrollDistance = distance || 0.7 * height;
        return this.mouse.wheel(0, -scrollDistance, startingPoint?.left, startingPoint?.top);
    }
    async scrollDown(distance, startingPoint) {
        const { height } = await this.size();
        const scrollDistance = distance || 0.7 * height;
        return this.mouse.wheel(0, scrollDistance, startingPoint?.left, startingPoint?.top);
    }
    async scrollLeft(distance, startingPoint) {
        const { width } = await this.size();
        const scrollDistance = distance || 0.7 * width;
        return this.mouse.wheel(-scrollDistance, 0, startingPoint?.left, startingPoint?.top);
    }
    async scrollRight(distance, startingPoint) {
        const { width } = await this.size();
        const scrollDistance = distance || 0.7 * width;
        return this.mouse.wheel(scrollDistance, 0, startingPoint?.left, startingPoint?.top);
    }
    async clearInput(element) {
        if (!element) return void console.warn('No element to clear input');
        await this.mouse.click(element.center[0], element.center[1]);
        await this.sendCommandToDebugger('Input.dispatchKeyEvent', {
            type: 'keyDown',
            commands: [
                'selectAll'
            ]
        });
        await this.sendCommandToDebugger('Input.dispatchKeyEvent', {
            type: 'keyUp',
            commands: [
                'selectAll'
            ]
        });
        await sleep(100);
        await this.keyboard.press({
            key: 'Backspace'
        });
    }
    async destroy() {
        this.destroyed = true;
        this.clearFileChooserAccept();
        const tabIdToDetach = this.activeTabId;
        this.activeTabId = null;
        if (tabIdToDetach) await this.detachDebugger(tabIdToDetach);
    }
    async longPress(x, y, duration) {
        duration = duration || 500;
        const MIN_LONG_PRESS_DURATION = 300;
        if (duration < MIN_LONG_PRESS_DURATION) duration = MIN_LONG_PRESS_DURATION;
        await this.mouse.move(x, y);
        if (null === this.isMobileEmulation) {
            const result = await this.sendCommandToDebugger('Runtime.evaluate', {
                expression: `(() => {
          return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        })()`,
                returnByValue: true
            });
            this.isMobileEmulation = result?.result?.value;
        }
        if (this.isMobileEmulation) {
            const touchPoints = [
                {
                    x: Math.round(x),
                    y: Math.round(y)
                }
            ];
            await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                type: 'touchStart',
                touchPoints,
                modifiers: 0
            });
            await new Promise((res)=>setTimeout(res, duration));
            await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                type: 'touchEnd',
                touchPoints: [],
                modifiers: 0
            });
        } else {
            await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                type: 'mousePressed',
                x,
                y,
                button: 'left',
                clickCount: 1
            });
            await new Promise((res)=>setTimeout(res, duration));
            await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                type: 'mouseReleased',
                x,
                y,
                button: 'left',
                clickCount: 1
            });
        }
        this.latestMouseX = x;
        this.latestMouseY = y;
    }
    async swipe(from, to, duration) {
        const LONG_PRESS_THRESHOLD = 500;
        const MIN_PRESS_THRESHOLD = 150;
        duration = duration || 300;
        if (duration < MIN_PRESS_THRESHOLD) duration = MIN_PRESS_THRESHOLD;
        if (duration > LONG_PRESS_THRESHOLD) duration = LONG_PRESS_THRESHOLD;
        if (null === this.isMobileEmulation) {
            const result = await this.sendCommandToDebugger('Runtime.evaluate', {
                expression: `(() => {
          return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        })()`,
                returnByValue: true
            });
            this.isMobileEmulation = result?.result?.value;
        }
        const steps = 30;
        const delay = duration / steps;
        if (this.isMobileEmulation) {
            await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                type: 'touchStart',
                touchPoints: [
                    {
                        x: Math.round(from.x),
                        y: Math.round(from.y)
                    }
                ],
                modifiers: 0
            });
            for(let i = 1; i <= steps; i++){
                const x = from.x + (to.x - from.x) * (i / steps);
                const y = from.y + (to.y - from.y) * (i / steps);
                await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                    type: 'touchMove',
                    touchPoints: [
                        {
                            x: Math.round(x),
                            y: Math.round(y)
                        }
                    ],
                    modifiers: 0
                });
                await new Promise((res)=>setTimeout(res, delay));
            }
            await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                type: 'touchEnd',
                touchPoints: [],
                modifiers: 0
            });
        } else {
            await this.mouse.move(from.x, from.y);
            await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                type: 'mousePressed',
                x: from.x,
                y: from.y,
                button: 'left',
                clickCount: 1
            });
            for(let i = 1; i <= steps; i++){
                const x = from.x + (to.x - from.x) * (i / steps);
                const y = from.y + (to.y - from.y) * (i / steps);
                await this.mouse.move(x, y);
                await new Promise((res)=>setTimeout(res, delay));
            }
            await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                type: 'mouseReleased',
                x: to.x,
                y: to.y,
                button: 'left',
                clickCount: 1
            });
        }
        this.latestMouseX = to.x;
        this.latestMouseY = to.y;
    }
    async pinch(centerX, centerY, startDistance, endDistance, duration = 500) {
        const steps = 30;
        const delay = duration / steps;
        const halfStart = startDistance / 2;
        const halfEnd = endDistance / 2;
        await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [
                {
                    x: Math.round(centerX),
                    y: Math.round(centerY - halfStart),
                    id: 0
                },
                {
                    x: Math.round(centerX),
                    y: Math.round(centerY + halfStart),
                    id: 1
                }
            ],
            modifiers: 0
        });
        for(let i = 1; i <= steps; i++){
            const progress = i / steps;
            const currentHalf = halfStart + (halfEnd - halfStart) * progress;
            await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints: [
                    {
                        x: Math.round(centerX),
                        y: Math.round(centerY - currentHalf),
                        id: 0
                    },
                    {
                        x: Math.round(centerX),
                        y: Math.round(centerY + currentHalf),
                        id: 1
                    }
                ],
                modifiers: 0
            });
            await new Promise((res)=>setTimeout(res, delay));
        }
        await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
            modifiers: 0
        });
    }
    constructor(forceSameTabNavigation){
        _define_property(this, "interfaceType", 'chrome-extension-proxy');
        _define_property(this, "forceSameTabNavigation", void 0);
        _define_property(this, "viewportSize", void 0);
        _define_property(this, "activeTabId", null);
        _define_property(this, "destroyed", false);
        _define_property(this, "fileChooserEventHandler", void 0);
        _define_property(this, "fileChooserRegistrationVersion", 0);
        _define_property(this, "bridgeFileChooserDispose", void 0);
        _define_property(this, "bridgeFileChooserGetError", void 0);
        _define_property(this, "isMobileEmulation", null);
        _define_property(this, "_continueWhenFailedToAttachDebugger", false);
        _define_property(this, "latestMouseX", 100);
        _define_property(this, "latestMouseY", 100);
        _define_property(this, "mouse", {
            click: async (x, y, options)=>{
                const { button = 'left', count = 1 } = options || {};
                await this.mouse.move(x, y);
                if (null === this.isMobileEmulation) {
                    const result = await this.sendCommandToDebugger('Runtime.evaluate', {
                        expression: `(() => {
            return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
          })()`,
                        returnByValue: true
                    });
                    this.isMobileEmulation = result?.result?.value;
                }
                if (this.isMobileEmulation && 'left' === button) {
                    const touchPoints = [
                        {
                            x: Math.round(x),
                            y: Math.round(y)
                        }
                    ];
                    await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                        type: 'touchStart',
                        touchPoints,
                        modifiers: 0
                    });
                    await this.sendCommandToDebugger('Input.dispatchTouchEvent', {
                        type: 'touchEnd',
                        touchPoints: [],
                        modifiers: 0
                    });
                } else for(let i = 0; i < count; i++){
                    const clickCount = i + 1;
                    await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                        type: 'mousePressed',
                        x,
                        y,
                        button,
                        clickCount
                    });
                    await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                        type: 'mouseReleased',
                        x,
                        y,
                        button,
                        clickCount
                    });
                    if (i < count - 1) await sleep(50);
                }
            },
            wheel: async (deltaX, deltaY, startX, startY)=>{
                const finalX = startX || this.latestMouseX;
                const finalY = startY || this.latestMouseY;
                await this.showMousePointer(finalX, finalY);
                await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                    type: 'mouseWheel',
                    x: finalX,
                    y: finalY,
                    deltaX,
                    deltaY
                });
                this.latestMouseX = finalX;
                this.latestMouseY = finalY;
            },
            move: async (x, y)=>{
                await this.showMousePointer(x, y);
                await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                    type: 'mouseMoved',
                    x,
                    y
                });
                this.latestMouseX = x;
                this.latestMouseY = y;
            },
            drag: async (from, to)=>{
                await this.mouse.move(from.x, from.y);
                await sleep(200);
                await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                    type: 'mousePressed',
                    x: from.x,
                    y: from.y,
                    button: 'left',
                    clickCount: 1
                });
                await sleep(300);
                await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                    type: 'mouseMoved',
                    x: to.x,
                    y: to.y
                });
                await sleep(500);
                await this.sendCommandToDebugger('Input.dispatchMouseEvent', {
                    type: 'mouseReleased',
                    x: to.x,
                    y: to.y,
                    button: 'left',
                    clickCount: 1
                });
                await sleep(200);
                await this.mouse.move(to.x, to.y);
            }
        });
        _define_property(this, "keyboard", {
            type: async (text)=>{
                const cdpKeyboard = new external_cdpInput_js_namespaceObject.CdpKeyboard({
                    send: this.sendCommandToDebugger.bind(this)
                });
                await cdpKeyboard.type(text, {
                    delay: 0
                });
            },
            press: async (action)=>{
                const cdpKeyboard = new external_cdpInput_js_namespaceObject.CdpKeyboard({
                    send: this.sendCommandToDebugger.bind(this)
                });
                const keys = Array.isArray(action) ? action : [
                    action
                ];
                for (const k of keys){
                    const commands = k.command ? [
                        k.command
                    ] : [];
                    await cdpKeyboard.down(k.key, {
                        commands
                    });
                }
                for (const k of [
                    ...keys
                ].reverse())await cdpKeyboard.up(k.key);
            }
        });
        this.forceSameTabNavigation = forceSameTabNavigation;
    }
}
exports["default"] = __webpack_exports__["default"];
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "default"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=page.js.map