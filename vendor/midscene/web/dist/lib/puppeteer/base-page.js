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
    forceClosePopup: ()=>forceClosePopup,
    Page: ()=>Page,
    forceChromeSelectRendering: ()=>forceChromeSelectRendering,
    BROWSER_NAVIGATION_ERROR_PATTERN: ()=>BROWSER_NAVIGATION_ERROR_PATTERN,
    debugPage: ()=>debugPage
});
const utils_namespaceObject = require("@midscene/core/utils");
const constants_namespaceObject = require("@midscene/shared/constants");
const extractor_namespaceObject = require("@midscene/shared/extractor");
const img_namespaceObject = require("@midscene/shared/img");
const logger_namespaceObject = require("@midscene/shared/logger");
const node_namespaceObject = require("@midscene/shared/node");
const shared_utils_namespaceObject = require("@midscene/shared/utils");
const cache_helper_js_namespaceObject = require("../common/cache-helper.js");
const external_web_page_js_namespaceObject = require("../web-page.js");
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
const debugPage = (0, logger_namespaceObject.getDebug)('web:page');
const warnPage = (0, logger_namespaceObject.getDebug)('web:page', {
    console: true
});
const BROWSER_NAVIGATION_ERROR_PATTERN = /execution context was destroyed|frame was detached|target closed|page has been closed|context was destroyed|net::ERR_ABORTED/i;
const CDP_SCREENCAST_QUALITY = 70;
const CDP_SCREENCAST_EVERY_NTH_FRAME = 1;
const FLUSH_VISUAL_UPDATE_TIMEOUT_MS = 50;
const DATA_URL_BASE64_PREFIX = /^data:image\/\w+;base64,/;
function isClosedPageError(error) {
    if (!(error instanceof Error)) return false;
    return /target page, context or browser has been closed|page has been closed|target closed|browser has been closed/i.test(error.message);
}
class Page {
    actionSpace() {
        const defaultActions = (0, external_web_page_js_namespaceObject.commonWebActionsForWebPage)(this, this.enableTouchEventsInActionSpace);
        const customActions = this.customActions || [];
        return [
            ...defaultActions,
            ...customActions
        ];
    }
    async evaluate(pageFunction, arg) {
        let result;
        debugPage('evaluate function begin');
        this.interfaceType, result = await this.underlyingPage.evaluate(pageFunction, arg);
        debugPage('evaluate function end');
        return result;
    }
    async evaluateJavaScript(script) {
        return this.evaluate(script);
    }
    async waitForNavigation(moment, actionName) {
        if (0 === this.waitForNavigationTimeout) return void debugPage('waitForNavigation timeout is 0, skip waiting');
        if ('puppeteer' === this.interfaceType || 'playwright' === this.interfaceType) {
            debugPage(`waitForNavigation begin at moment ${moment} with timeout: ${this.waitForNavigationTimeout} and actionName: ${actionName}`);
            try {
                await this.underlyingPage.waitForSelector('html', {
                    timeout: this.waitForNavigationTimeout
                });
            } catch (error) {
                console.warn('[midscene:warning] Waiting for the "navigation" has timed out, but Midscene will continue execution. Please check https://midscenejs.com/faq.html#customize-the-network-timeout for more information on customizing the network timeout');
            }
            debugPage('waitForNavigation end');
        }
    }
    async waitForNetworkIdle(moment, actionName) {
        if ('puppeteer' === this.interfaceType) {
            if (0 === this.waitForNetworkIdleTimeout) return void debugPage('waitForNetworkIdle timeout is 0, skip waiting');
            debugPage(`waitForNetworkIdle begin at moment ${moment} with timeout: ${this.waitForNetworkIdleTimeout} and concurrency: ${constants_namespaceObject.DEFAULT_WAIT_FOR_NETWORK_IDLE_CONCURRENCY} and actionName: ${actionName}`);
            try {
                await this.underlyingPage.waitForNetworkIdle({
                    idleTime: 200,
                    concurrency: constants_namespaceObject.DEFAULT_WAIT_FOR_NETWORK_IDLE_CONCURRENCY,
                    timeout: this.waitForNetworkIdleTimeout
                });
            } catch (error) {
                console.warn('[midscene:warning] Waiting for the "network idle" has timed out, but Midscene will continue execution. Please check https://midscenejs.com/faq.html#customize-the-network-timeout for more information on customizing the network timeout');
            }
            debugPage('waitForNetworkIdle end');
        } else if (!this.playwrightNetworkIdleWarningShown) {
            this.playwrightNetworkIdleWarningShown = true;
            warnPage('[midscene:warning] waitForNetworkIdle is skipped for Playwright. Playwright does not provide an equivalent underlying capability for the intended post-action network idle behavior here.');
        }
    }
    async getElementsInfo() {
        await this.waitForNavigation('getElementsInfo');
        debugPage('getElementsInfo begin');
        const tree = await this.getElementsNodeTree();
        debugPage('getElementsInfo end');
        return (0, extractor_namespaceObject.treeToList)(tree);
    }
    async getXpathsByPoint(point, isOrderSensitive) {
        const elementInfosScriptContent = (0, node_namespaceObject.getElementInfosScriptContent)();
        return this.evaluateJavaScript(`${elementInfosScriptContent}midscene_element_inspector.getXpathsByPoint({left: ${point.left}, top: ${point.top}}, ${isOrderSensitive})`);
    }
    async getElementInfoByXpath(xpath) {
        const elementInfosScriptContent = (0, node_namespaceObject.getElementInfosScriptContent)();
        return this.evaluateJavaScript(`${elementInfosScriptContent}midscene_element_inspector.getElementInfoByXpath(${JSON.stringify(xpath)})`);
    }
    async cacheFeatureForPoint(center, options) {
        const point = {
            left: center[0],
            top: center[1]
        };
        try {
            const isOrderSensitive = await (0, cache_helper_js_namespaceObject.judgeOrderSensitive)(options, debugPage);
            const xpaths = await this.getXpathsByPoint(point, isOrderSensitive);
            const sanitized = (0, cache_helper_js_namespaceObject.sanitizeXpaths)(xpaths);
            if (!sanitized.length) debugPage('cacheFeatureForPoint: no xpath found at point %o', center);
            return {
                xpaths: sanitized
            };
        } catch (error) {
            debugPage('cacheFeatureForPoint failed: %s', error);
            return {
                xpaths: []
            };
        }
    }
    async rectMatchesCacheFeature(feature) {
        const xpaths = (0, cache_helper_js_namespaceObject.sanitizeXpaths)(feature.xpaths);
        debugPage('rectMatchesCacheFeature: trying %d xpath(s)', xpaths.length);
        for (const xpath of xpaths)try {
            debugPage('rectMatchesCacheFeature: evaluating xpath: %s', xpath);
            const elementInfo = await this.getElementInfoByXpath(xpath);
            if (elementInfo?.rect) {
                debugPage('rectMatchesCacheFeature: found element, rect: %o', elementInfo.rect);
                return (0, cache_helper_js_namespaceObject.buildRectFromElementInfo)(elementInfo);
            }
            debugPage('rectMatchesCacheFeature: element found but no rect (elementInfo: %o)', elementInfo);
        } catch (error) {
            debugPage('rectMatchesCacheFeature failed for xpath %s: %s', xpath, error);
        }
        throw new Error(`No matching element rect found for the provided cache feature (tried ${xpaths.length} xpath(s): ${xpaths.join(', ')})`);
    }
    async getElementsNodeTree() {
        await this.waitForNavigation('getElementsNodeTree');
        const scripts = await (0, node_namespaceObject.getExtraReturnLogic)(true);
        (0, shared_utils_namespaceObject.assert)(scripts, "scripts should be set before writing report in browser");
        const startTime = Date.now();
        const captureElementSnapshot = await this.evaluate(scripts);
        const endTime = Date.now();
        debugPage(`getElementsNodeTree end, cost: ${endTime - startTime}ms`);
        return captureElementSnapshot;
    }
    async size() {
        if (this.viewportSize) return this.viewportSize;
        const sizeInfo = await this.evaluate(()=>({
                width: window.innerWidth,
                height: window.innerHeight
            }));
        this.viewportSize = sizeInfo;
        return sizeInfo;
    }
    async screenshotBase64() {
        const imgType = 'jpeg';
        const quality = 90;
        const startTime = Date.now();
        debugPage('screenshotBase64 begin');
        let base64;
        if ('puppeteer' === this.interfaceType) {
            const result = await this.underlyingPage.screenshot({
                type: imgType,
                quality,
                encoding: 'base64'
            });
            base64 = (0, img_namespaceObject.createImgBase64ByFormat)(imgType, result);
        } else if ('playwright' === this.interfaceType) {
            const page = this.underlyingPage;
            try {
                const buffer = await page.screenshot({
                    type: imgType,
                    quality,
                    timeout: 10000
                });
                base64 = (0, img_namespaceObject.createImgBase64ByFormat)(imgType, buffer.toString('base64'));
            } catch (error) {
                if (isClosedPageError(error) || page.isClosed()) throw error;
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.warn(`[Midscene] Playwright screenshot failed: ${errorMsg}. Falling back to CDP screenshot.`);
                debugPage('playwright screenshot failed, trying CDP fallback: %s', error);
                base64 = await this.screenshotBase64ByPlaywrightCdp(imgType, quality);
            }
        } else throw new Error('Unsupported page type for screenshot');
        const endTime = Date.now();
        debugPage(`screenshotBase64 end, cost: ${endTime - startTime}ms`);
        return base64;
    }
    async screenshotBase64ByPlaywrightCdp(imgType, quality) {
        const client = await this.createPageCdpSession('CDP screenshot fallback');
        try {
            const result = await new Promise((resolve, reject)=>{
                const timeoutId = setTimeout(()=>{
                    reject(new Error('CDP screenshot timeout after 10000ms.'));
                }, 10000);
                client.send('Page.captureScreenshot', {
                    format: imgType,
                    ...quality ? {
                        quality
                    } : {}
                }).then((value)=>{
                    clearTimeout(timeoutId);
                    resolve(value);
                }, (error)=>{
                    clearTimeout(timeoutId);
                    reject(error);
                });
            });
            return (0, img_namespaceObject.createImgBase64ByFormat)(imgType, result.data);
        } finally{
            client.detach().catch((error)=>{
                debugPage('failed to detach CDP screenshot session: %s', error);
            });
        }
    }
    async createPageCdpSession(featureName) {
        if ('puppeteer' === this.interfaceType) {
            const page = this.underlyingPage;
            const pageWithCdp = page;
            if ('function' == typeof pageWithCdp.createCDPSession) return await pageWithCdp.createCDPSession();
            const target = page.target?.();
            if ('function' == typeof target?.createCDPSession) return await target.createCDPSession();
            throw new Error(`${featureName} requires a browser page with CDP session support.`);
        }
        const page = this.underlyingPage;
        const browserName = page.context().browser()?.browserType().name();
        if (browserName && 'chromium' !== browserName) throw new Error(`${featureName} requires Chromium-based browser, but current browser is "${browserName}".`);
        return await page.context().newCDPSession(page);
    }
    async waitForDomQuiet(opts) {
        const quietMs = opts?.quietMs ?? 100;
        const timeoutMs = opts?.timeoutMs ?? 500;
        const targetCenter = opts?.target?.center;
        try {
            await this.evaluate(([q, total, center])=>new Promise((resolve)=>{
                    let settleTimer;
                    const done = ()=>{
                        obs.disconnect();
                        clearTimeout(hardTimer);
                        if (settleTimer) clearTimeout(settleTimer);
                        resolve();
                    };
                    const target = center && Number.isFinite(center[0]) && Number.isFinite(center[1]) ? document.elementFromPoint(center[0], center[1]) : null;
                    const observeRoot = target?.closest('form') ?? target?.parentElement ?? document.body;
                    const obs = new MutationObserver(()=>{
                        if (settleTimer) clearTimeout(settleTimer);
                        settleTimer = setTimeout(done, q);
                    });
                    obs.observe(observeRoot, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        characterData: true
                    });
                    const hardTimer = setTimeout(done, total);
                }), [
                quietMs,
                timeoutMs,
                targetCenter
            ]);
        } catch (error) {
            debugPage('waitForDomQuiet failed: %s', error);
        }
    }
    async flushPendingVisualUpdate() {
        const activeStream = this.activeMjpegStream;
        if (!activeStream) return;
        try {
            await this.evaluate((timeoutMs)=>new Promise((resolve)=>{
                    let done = false;
                    const finish = ()=>{
                        if (done) return;
                        done = true;
                        resolve();
                    };
                    setTimeout(finish, timeoutMs);
                    requestAnimationFrame(()=>requestAnimationFrame(finish));
                }), FLUSH_VISUAL_UPDATE_TIMEOUT_MS);
            const dataUrl = await this.screenshotBase64();
            if (this.activeMjpegStream?.token !== activeStream.token) return;
            activeStream.onFrame({
                data: dataUrl.replace(DATA_URL_BASE64_PREFIX, ''),
                contentType: 'image/jpeg'
            });
        } catch (error) {
            debugPage('screencast visual refresh failed: %s', error);
            activeStream.onError?.(error);
        }
    }
    schedulePendingVisualUpdate() {
        if (!this.activeMjpegStream) return;
        if (this.visualUpdateFlushInFlight) {
            this.visualUpdateFlushQueued = true;
            return;
        }
        const flushTask = (async ()=>{
            do {
                this.visualUpdateFlushQueued = false;
                await this.flushPendingVisualUpdate();
            }while (this.visualUpdateFlushQueued);
        })().catch((error)=>{
            debugPage('scheduled screencast visual refresh failed: %s', error);
        }).finally(()=>{
            if (this.visualUpdateFlushInFlight === flushTask) this.visualUpdateFlushInFlight = null;
            this.visualUpdateFlushQueued = false;
        });
        this.visualUpdateFlushInFlight = flushTask;
    }
    async startMjpegStream(options) {
        const { signal, onFrame, onError } = options;
        if ('function' == typeof this.underlyingPage.bringToFront) await this.underlyingPage.bringToFront();
        const client = await this.createPageCdpSession('CDP screencast');
        let stopped = false;
        const streamToken = Symbol('mjpeg-stream');
        const reportStreamError = (error)=>{
            try {
                onError?.(error);
            } catch (callbackError) {
                debugPage('mjpeg onError callback threw: %s', callbackError);
            }
        };
        const handleFrame = (event)=>{
            (async ()=>{
                if (stopped) return;
                try {
                    onFrame({
                        data: event.data,
                        contentType: 'image/jpeg'
                    });
                } catch (error) {
                    reportStreamError(error);
                }
                try {
                    await client.send('Page.screencastFrameAck', {
                        sessionId: event.sessionId
                    });
                } catch (error) {
                    if (!stopped) reportStreamError(error);
                }
            })();
        };
        const removeFrameListener = ()=>{
            if (client.off) client.off('Page.screencastFrame', handleFrame);
            else if (client.removeListener) client.removeListener('Page.screencastFrame', handleFrame);
        };
        const stop = async ()=>{
            if (stopped) return;
            stopped = true;
            if (this.activeMjpegStream?.token === streamToken) this.activeMjpegStream = void 0;
            signal?.removeEventListener('abort', abortHandler);
            removeFrameListener();
            await client.send('Page.stopScreencast').catch((error)=>{
                debugPage('Page.stopScreencast failed: %s', error);
            });
            await client.detach().catch((error)=>{
                debugPage('CDP screencast session detach failed: %s', error);
            });
        };
        const abortHandler = ()=>{
            stop();
        };
        try {
            client.on('Page.screencastFrame', handleFrame);
            this.activeMjpegStream = {
                token: streamToken,
                onFrame,
                onError
            };
            signal?.addEventListener('abort', abortHandler, {
                once: true
            });
            if (signal?.aborted) {
                await stop();
                return {
                    stop
                };
            }
            await client.send('Page.enable');
            try {
                const { width, height } = await this.size();
                await client.send('Emulation.setVisibleSize', {
                    width,
                    height
                });
            } catch (error) {
                debugPage('CDP screencast visible size sync failed: %s', error);
            }
            await client.send('Page.startScreencast', {
                format: 'jpeg',
                quality: CDP_SCREENCAST_QUALITY,
                everyNthFrame: CDP_SCREENCAST_EVERY_NTH_FRAME
            });
            this.flushPendingVisualUpdate();
            return {
                stop
            };
        } catch (error) {
            await stop();
            throw error;
        }
    }
    async url() {
        return this.underlyingPage.url();
    }
    describe() {
        const url = this.underlyingPage.url();
        return url || '';
    }
    get mouse() {
        return {
            click: async (x, y, options)=>{
                await this.mouse.move(x, y);
                const { button = 'left', count = 1 } = options || {};
                debugPage(`mouse click ${x}, ${y}, ${button}, ${count}`);
                if (2 === count && 'playwright' === this.interfaceType) await this.underlyingPage.mouse.dblclick(x, y, {
                    button
                });
                else if ('puppeteer' === this.interfaceType) {
                    const page = this.underlyingPage;
                    if ('left' === button && 1 === count) await page.mouse.click(x, y);
                    else await page.mouse.click(x, y, {
                        button,
                        count
                    });
                } else if ('playwright' === this.interfaceType) await this.underlyingPage.mouse.click(x, y, {
                    button,
                    clickCount: count
                });
            },
            wheel: async (deltaX, deltaY)=>{
                debugPage(`mouse wheel ${deltaX}, ${deltaY}`);
                if ('puppeteer' === this.interfaceType) await this.underlyingPage.mouse.wheel({
                    deltaX,
                    deltaY
                });
                else if ('playwright' === this.interfaceType) await this.underlyingPage.mouse.wheel(deltaX, deltaY);
            },
            move: async (x, y)=>{
                this.everMoved = true;
                debugPage(`mouse move to ${x}, ${y}`);
                return this.underlyingPage.mouse.move(x, y);
            },
            drag: async (from, to)=>{
                debugPage(`begin mouse drag from ${from.x}, ${from.y} to ${to.x}, ${to.y}`);
                await this.underlyingPage.mouse.move(from.x, from.y);
                await (0, utils_namespaceObject.sleep)(200);
                await this.underlyingPage.mouse.down();
                await (0, utils_namespaceObject.sleep)(300);
                await this.underlyingPage.mouse.move(to.x, to.y, {
                    steps: 20
                });
                await (0, utils_namespaceObject.sleep)(500);
                await this.underlyingPage.mouse.up();
                await (0, utils_namespaceObject.sleep)(200);
                debugPage(`end mouse drag from ${from.x}, ${from.y} to ${to.x}, ${to.y}`);
            }
        };
    }
    get keyboard() {
        return {
            type: async (text)=>{
                const delay = this.keyboardTypeDelay;
                debugPage(`keyboard type ${text}${void 0 !== delay ? ` (delay: ${delay}ms)` : ''}`);
                return this.underlyingPage.keyboard.type(text, {
                    delay
                });
            },
            press: async (action)=>{
                const keys = Array.isArray(action) ? action : [
                    action
                ];
                debugPage('keyboard press', keys);
                for (const k of keys){
                    const commands = k.command ? [
                        k.command
                    ] : [];
                    await this.underlyingPage.keyboard.down(k.key, {
                        commands
                    });
                }
                for (const k of [
                    ...keys
                ].reverse())await this.underlyingPage.keyboard.up(k.key);
            },
            down: async (key)=>{
                debugPage(`keyboard down ${key}`);
                return this.underlyingPage.keyboard.down(key);
            },
            up: async (key)=>{
                debugPage(`keyboard up ${key}`);
                return this.underlyingPage.keyboard.up(key);
            }
        };
    }
    async selectAllByCdp() {
        const client = await this.createPageCdpSession('clearInput');
        try {
            await client.send('Input.dispatchKeyEvent', {
                type: 'rawKeyDown',
                commands: [
                    'selectAll'
                ]
            });
            await client.send('Input.dispatchKeyEvent', {
                type: 'keyUp'
            });
        } finally{
            await client.detach().catch(()=>void 0);
        }
    }
    async clearInput(element) {
        const backspace = async ()=>{
            await (0, utils_namespaceObject.sleep)(100);
            await this.keyboard.press([
                {
                    key: 'Backspace'
                }
            ]);
        };
        debugPage('clearInput begin');
        element && await this.mouse.click(element.center[0], element.center[1]);
        try {
            await this.selectAllByCdp();
            await backspace();
        } catch (error) {
            debugPage('clearInput cdp selectAll failed', error);
            throw error;
        } finally{
            debugPage('clearInput end');
        }
    }
    async moveToPointBeforeScroll(point) {
        if (point) await this.mouse.move(point.left, point.top);
        else if (!this.everMoved) {
            const size = await this.size();
            const targetX = Math.floor(size.width / 2);
            const targetY = Math.floor(size.height / 2);
            await this.mouse.move(targetX, targetY);
        }
    }
    async scrollUntilTop(startingPoint) {
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(0, -9999999);
    }
    async scrollUntilBottom(startingPoint) {
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(0, 9999999);
    }
    async scrollUntilLeft(startingPoint) {
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(-9999999, 0);
    }
    async scrollUntilRight(startingPoint) {
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(9999999, 0);
    }
    async scrollUp(distance, startingPoint) {
        const innerHeight = await this.evaluate(()=>window.innerHeight);
        const scrollDistance = distance || 0.7 * innerHeight;
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(0, -scrollDistance);
    }
    async scrollDown(distance, startingPoint) {
        const innerHeight = await this.evaluate(()=>window.innerHeight);
        const scrollDistance = distance || 0.7 * innerHeight;
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(0, scrollDistance);
    }
    async scrollLeft(distance, startingPoint) {
        const innerWidth = await this.evaluate(()=>window.innerWidth);
        const scrollDistance = distance || 0.7 * innerWidth;
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(-scrollDistance, 0);
    }
    async scrollRight(distance, startingPoint) {
        const innerWidth = await this.evaluate(()=>window.innerWidth);
        const scrollDistance = distance || 0.7 * innerWidth;
        await this.moveToPointBeforeScroll(startingPoint);
        return this.mouse.wheel(scrollDistance, 0);
    }
    async navigate(url) {
        debugPage(`navigate to ${url}`);
        if ('puppeteer' === this.interfaceType) await this.underlyingPage.goto(url);
        else if ('playwright' === this.interfaceType) await this.underlyingPage.goto(url);
        else throw new Error('Unsupported page type for navigate');
    }
    async reload() {
        debugPage('reload page');
        if ('puppeteer' === this.interfaceType) await this.underlyingPage.reload();
        else if ('playwright' === this.interfaceType) await this.underlyingPage.reload();
        else throw new Error('Unsupported page type for reload');
    }
    async goBack() {
        debugPage('go back');
        if ('puppeteer' === this.interfaceType) await this.underlyingPage.goBack();
        else if ('playwright' === this.interfaceType) await this.underlyingPage.goBack();
        else throw new Error('Unsupported page type for go back');
    }
    async goForward() {
        debugPage('go forward');
        if ('puppeteer' === this.interfaceType) await this.underlyingPage.goForward();
        else if ('playwright' === this.interfaceType) await this.underlyingPage.goForward();
        else throw new Error('Unsupported page type for go forward');
    }
    async stopLoading() {
        debugPage('stop loading');
        if ('puppeteer' === this.interfaceType) {
            const client = await this.createPageCdpSession('stopLoading');
            try {
                await client.send('Page.stopLoading');
            } finally{
                await client.detach();
            }
        } else if ('playwright' === this.interfaceType) await this.underlyingPage.evaluate(()=>window.stop());
        else throw new Error('Unsupported page type for stop loading');
    }
    async navigationState() {
        try {
            const readyState = await this.evaluate(()=>document.readyState);
            return {
                isLoading: 'complete' !== readyState
            };
        } catch (error) {
            debugPage('failed to query navigation state: %s', error);
            return {
                isLoading: false
            };
        }
    }
    async beforeInvokeAction(name, param) {
        if (this.onBeforeInvokeAction) await this.onBeforeInvokeAction(name, param);
    }
    async afterInvokeAction(name, param) {
        await Promise.all([
            this.waitForNavigation('afterInvokeAction', name),
            this.waitForNetworkIdle('afterInvokeAction', name)
        ]);
        if (this.onAfterInvokeAction) await this.onAfterInvokeAction(name, param);
    }
    async destroy() {}
    async swipe(from, to, duration) {
        const LONG_PRESS_THRESHOLD = 500;
        const MIN_PRESS_THRESHOLD = 150;
        duration = duration || 100;
        if (duration < MIN_PRESS_THRESHOLD) duration = MIN_PRESS_THRESHOLD;
        if (duration > LONG_PRESS_THRESHOLD) duration = LONG_PRESS_THRESHOLD;
        debugPage(`mouse swipe from ${from.x}, ${from.y} to ${to.x}, ${to.y} with duration ${duration}ms`);
        if ('puppeteer' === this.interfaceType) {
            const page = this.underlyingPage;
            await page.mouse.move(from.x, from.y);
            await page.mouse.down({
                button: 'left'
            });
            const steps = 30;
            const delay = duration / steps;
            for(let i = 1; i <= steps; i++){
                const x = from.x + (to.x - from.x) * (i / steps);
                const y = from.y + (to.y - from.y) * (i / steps);
                await page.mouse.move(x, y);
                await new Promise((resolve)=>setTimeout(resolve, delay));
            }
            await page.mouse.up({
                button: 'left'
            });
        } else if ('playwright' === this.interfaceType) {
            const page = this.underlyingPage;
            await page.mouse.move(from.x, from.y);
            await page.mouse.down();
            const steps = 30;
            const delay = duration / steps;
            for(let i = 1; i <= steps; i++){
                const x = from.x + (to.x - from.x) * (i / steps);
                const y = from.y + (to.y - from.y) * (i / steps);
                await page.mouse.move(x, y);
                await page.waitForTimeout(delay);
            }
            await page.mouse.up({
                button: 'left'
            });
        }
    }
    async longPress(x, y, duration) {
        duration = duration || 500;
        const MIN_LONG_PRESS_DURATION = 300;
        if (duration < MIN_LONG_PRESS_DURATION) duration = MIN_LONG_PRESS_DURATION;
        debugPage(`mouse longPress at ${x}, ${y} for ${duration}ms`);
        if ('puppeteer' === this.interfaceType) {
            const page = this.underlyingPage;
            await page.mouse.move(x, y);
            await page.mouse.down({
                button: 'left'
            });
            await new Promise((res)=>setTimeout(res, duration));
            await page.mouse.up({
                button: 'left'
            });
        } else if ('playwright' === this.interfaceType) {
            const page = this.underlyingPage;
            await page.mouse.move(x, y);
            await page.mouse.down({
                button: 'left'
            });
            await page.waitForTimeout(duration);
            await page.mouse.up({
                button: 'left'
            });
        }
    }
    async pinch(centerX, centerY, startDistance, endDistance, duration = 500) {
        const steps = 30;
        const delay = duration / steps;
        const halfStart = startDistance / 2;
        const halfEnd = endDistance / 2;
        const client = await this.createPageCdpSession('Pinch gesture');
        try {
            await client.send('Input.dispatchTouchEvent', {
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
                ]
            });
            for(let i = 1; i <= steps; i++){
                const currentHalf = halfStart + i / steps * (halfEnd - halfStart);
                await client.send('Input.dispatchTouchEvent', {
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
                    ]
                });
                await new Promise((res)=>setTimeout(res, delay));
            }
            await client.send('Input.dispatchTouchEvent', {
                type: 'touchEnd',
                touchPoints: []
            });
        } finally{
            await client.detach();
        }
    }
    async ensurePuppeteerFileChooserSession() {
        if (this.puppeteerFileChooserSession) return this.puppeteerFileChooserSession;
        const session = await this.createPageCdpSession('Puppeteer file chooser');
        await session.send('Page.enable');
        await session.send('DOM.enable');
        await session.send('Page.setInterceptFileChooserDialog', {
            enabled: true
        });
        this.puppeteerFileChooserSession = session;
        return session;
    }
    async registerFileChooserListener(handler) {
        if ('puppeteer' !== this.interfaceType) throw new Error('registerFileChooserListener is only supported in Puppeteer');
        const session = await this.ensurePuppeteerFileChooserSession();
        if (this.puppeteerFileChooserHandler) session.off('Page.fileChooserOpened', this.puppeteerFileChooserHandler);
        let capturedError;
        this.puppeteerFileChooserHandler = async (event)=>{
            if (void 0 === event.backendNodeId) return void debugPage('puppeteer file chooser opened without backendNodeId, skip');
            try {
                await handler({
                    accept: async (files)=>{
                        const { node } = await session.send('DOM.describeNode', {
                            backendNodeId: event.backendNodeId
                        });
                        const hasWebkitDirectory = node.attributes?.includes('webkitdirectory') || node.attributes?.includes('directory');
                        if (hasWebkitDirectory) throw new Error('Directory upload (webkitdirectory) is not supported in Puppeteer. Please use Playwright instead, which supports directory upload since version 1.45.');
                        if (files.length > 1) {
                            const hasMultiple = node.attributes?.includes('multiple');
                            if (!hasMultiple) throw new Error('Non-multiple file input can only accept single file');
                        }
                        await session.send('DOM.setFileInputFiles', {
                            files,
                            backendNodeId: event.backendNodeId
                        });
                    }
                });
            } catch (error) {
                capturedError = error;
            }
        };
        session.on('Page.fileChooserOpened', this.puppeteerFileChooserHandler);
        return {
            dispose: ()=>{
                if (this.puppeteerFileChooserHandler) session.off('Page.fileChooserOpened', this.puppeteerFileChooserHandler);
                session.detach();
                this.puppeteerFileChooserHandler = void 0;
                if (this.puppeteerFileChooserSession === session) this.puppeteerFileChooserSession = void 0;
            },
            getError: ()=>capturedError
        };
    }
    constructor(underlyingPage, interfaceType, opts){
        _define_property(this, "underlyingPage", void 0);
        _define_property(this, "waitForNavigationTimeout", void 0);
        _define_property(this, "waitForNetworkIdleTimeout", void 0);
        _define_property(this, "viewportSize", void 0);
        _define_property(this, "onBeforeInvokeAction", void 0);
        _define_property(this, "onAfterInvokeAction", void 0);
        _define_property(this, "customActions", void 0);
        _define_property(this, "enableTouchEventsInActionSpace", void 0);
        _define_property(this, "keyboardTypeDelay", void 0);
        _define_property(this, "puppeteerFileChooserSession", void 0);
        _define_property(this, "puppeteerFileChooserHandler", void 0);
        _define_property(this, "playwrightNetworkIdleWarningShown", false);
        _define_property(this, "activeMjpegStream", void 0);
        _define_property(this, "visualUpdateFlushInFlight", null);
        _define_property(this, "visualUpdateFlushQueued", false);
        _define_property(this, "interfaceType", void 0);
        _define_property(this, "everMoved", false);
        this.underlyingPage = underlyingPage;
        this.interfaceType = interfaceType;
        this.waitForNavigationTimeout = opts?.waitForNavigationTimeout ?? constants_namespaceObject.DEFAULT_WAIT_FOR_NAVIGATION_TIMEOUT;
        this.waitForNetworkIdleTimeout = opts?.waitForNetworkIdleTimeout ?? constants_namespaceObject.DEFAULT_WAIT_FOR_NETWORK_IDLE_TIMEOUT;
        this.onBeforeInvokeAction = opts?.beforeInvokeAction;
        this.onAfterInvokeAction = opts?.afterInvokeAction;
        this.customActions = opts?.customActions;
        this.enableTouchEventsInActionSpace = opts?.enableTouchEventsInActionSpace ?? false;
        this.keyboardTypeDelay = opts?.keyboardTypeDelay;
    }
}
function forceClosePopup(page, debugProfile) {
    page.on('popup', async (popup)=>{
        if (!popup) return void console.warn('got a popup event, but the popup is not ready yet, skip');
        const url = await popup.url();
        console.log(`Popup opened: ${url}`);
        if (popup.isClosed()) debugProfile(`popup is already closed, skip close ${url}`);
        else try {
            await popup.close();
        } catch (error) {
            debugProfile(`failed to close popup ${url}, error: ${error}`);
        }
        if (page.isClosed()) debugProfile(`page is already closed, skip goto ${url}`);
        else try {
            await page.goto(url);
        } catch (error) {
            debugProfile(`failed to goto ${url}, error: ${error}`);
        }
    });
}
const forceSelectRenderingPages = new WeakSet();
function forceChromeSelectRendering(page) {
    if (forceSelectRenderingPages.has(page)) return;
    forceSelectRenderingPages.add(page);
    const styleContent = `
/* Add by Midscene because of forceChromeSelectRendering is enabled*/
select {
  &, &::picker(select) {
    appearance: base-select !important;
  }
}`;
    const styleId = 'midscene-force-select-rendering';
    const injectStyle = async ()=>{
        try {
            await page.evaluate(({ id, content })=>{
                if (document.getElementById(id)) return;
                const style = document.createElement('style');
                style.id = id;
                style.textContent = content;
                document.head.appendChild(style);
            }, {
                id: styleId,
                content: styleContent
            });
            debugPage('Midscene - Added base-select appearance style for select elements because of forceChromeSelectRendering is enabled');
        } catch (err) {
            console.log('Midscene - Failed to add base-select appearance style:', err);
        }
    };
    injectStyle();
    page.on('load', ()=>{
        injectStyle();
    });
}
exports.BROWSER_NAVIGATION_ERROR_PATTERN = __webpack_exports__.BROWSER_NAVIGATION_ERROR_PATTERN;
exports.Page = __webpack_exports__.Page;
exports.debugPage = __webpack_exports__.debugPage;
exports.forceChromeSelectRendering = __webpack_exports__.forceChromeSelectRendering;
exports.forceClosePopup = __webpack_exports__.forceClosePopup;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "BROWSER_NAVIGATION_ERROR_PATTERN",
    "Page",
    "debugPage",
    "forceChromeSelectRendering",
    "forceClosePopup"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=base-page.js.map