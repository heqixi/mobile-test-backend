import { Agent } from "@midscene/core/agent";
import { getDebug } from "@midscene/shared/logger";
import { assert } from "@midscene/shared/utils";
import { commonWebActionsForWebPage } from "../web-page.mjs";
import { BridgeEvent, BridgePageType, DefaultBridgeServerHost, DefaultBridgeServerPort, KeyboardEvent, MouseEvent, getBridgeServerHost } from "./common.mjs";
import { BridgeServer } from "./io-server.mjs";
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
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
const debug = getDebug('web:bridge:agent-cli-side');
function deserializeBridgeError(error) {
    const result = new Error(error.message);
    result.name = error.name || 'Error';
    result.stack = error.stack;
    return result;
}
const getBridgePageInCliSide = (options)=>{
    const host = options?.host || DefaultBridgeServerHost;
    const port = options?.port || DefaultBridgeServerPort;
    const server = new BridgeServer(host, port, void 0, void 0, options?.closeConflictServer);
    server.listen({
        timeout: options?.timeout
    });
    let fileChooserEnabled = false;
    let fileChooserError;
    const fileChooserBridgeMethods = new Set([
        BridgeEvent.RegisterFileChooserAccept,
        BridgeEvent.ClearFileChooserAccept,
        BridgeEvent.GetFileChooserError
    ]);
    const syncFileChooserError = async ()=>{
        if (!fileChooserEnabled) return;
        try {
            const error = await server.call(BridgeEvent.GetFileChooserError, [], 5000);
            if (error) fileChooserError = deserializeBridgeError(error);
        } catch (error) {
            fileChooserError = error instanceof Error ? error : new Error(String(error));
        }
    };
    const bridgeCaller = (method, timeout)=>async (...args)=>{
            try {
                const response = await server.call(method, args, timeout);
                if (!fileChooserBridgeMethods.has(method)) await syncFileChooserError();
                return response;
            } catch (error) {
                if (!fileChooserBridgeMethods.has(method)) await syncFileChooserError();
                throw error;
            }
        };
    const page = {
        showStatusMessage: async (message)=>{
            await server.call(BridgeEvent.UpdateAgentStatus, [
                message
            ]);
        }
    };
    const proxyPage = new Proxy(page, {
        get (target, prop, receiver) {
            assert('string' == typeof prop, 'prop must be a string');
            if ('toJSON' === prop) return ()=>({
                    interfaceType: BridgePageType
                });
            if ('interfaceType' === prop) return BridgePageType;
            if ('actionSpace' === prop) return ()=>commonWebActionsForWebPage(proxyPage);
            if (Object.keys(page).includes(prop)) return page[prop];
            if ('registerFileChooserListener' === prop) return async (handler)=>{
                fileChooserEnabled = true;
                fileChooserError = void 0;
                try {
                    await handler({
                        accept: async (files)=>{
                            await server.call(BridgeEvent.RegisterFileChooserAccept, [
                                files
                            ]);
                        }
                    });
                } catch (error) {
                    fileChooserEnabled = false;
                    fileChooserError = error instanceof Error ? error : new Error(String(error));
                    throw fileChooserError;
                }
                return {
                    dispose: ()=>{
                        fileChooserEnabled = false;
                        server.call(BridgeEvent.ClearFileChooserAccept, [], 5000).catch((error)=>{
                            debug('failed to clear bridge file chooser accept: %O', error);
                        });
                    },
                    getError: async ()=>{
                        await syncFileChooserError();
                        return fileChooserError;
                    }
                };
            };
            if ('mouse' === prop) {
                const mouse = {
                    click: bridgeCaller(MouseEvent.Click),
                    wheel: bridgeCaller(MouseEvent.Wheel),
                    move: bridgeCaller(MouseEvent.Move),
                    drag: bridgeCaller(MouseEvent.Drag)
                };
                return mouse;
            }
            if ('keyboard' === prop) {
                const keyboard = {
                    type: bridgeCaller(KeyboardEvent.Type),
                    press: bridgeCaller(KeyboardEvent.Press)
                };
                return keyboard;
            }
            if ('destroy' === prop) return async (...args)=>{
                try {
                    const caller = bridgeCaller('destroy');
                    await caller(...args);
                } catch (e) {}
                return server.close();
            };
            if ('connectNewTabWithUrl' === prop) return async (url, options)=>{
                const timeout = options?.timeout;
                const caller = bridgeCaller(prop, timeout);
                return await caller(url, options);
            };
            if ('connectCurrentTab' === prop) return async (options)=>{
                const timeout = options?.timeout;
                const caller = bridgeCaller(prop, timeout);
                return await caller(options);
            };
            return bridgeCaller(prop);
        }
    });
    return proxyPage;
};
class AgentOverChromeBridge extends Agent {
    async setDestroyOptionsAfterConnect() {
        if (this.destroyAfterDisconnectFlag) this.page.setDestroyOptions({
            closeTab: true
        });
    }
    async connectNewTabWithUrl(url, options) {
        await this.page.connectNewTabWithUrl(url, options);
        await sleep(500);
        await this.setDestroyOptionsAfterConnect();
    }
    async getBrowserTabList() {
        return await this.page.getBrowserTabList();
    }
    async setActiveTabId(tabId) {
        return await this.page.setActiveTabId(Number.parseInt(tabId));
    }
    async connectCurrentTab(options) {
        await this.page.connectCurrentTab(options);
        await sleep(500);
        await this.setDestroyOptionsAfterConnect();
    }
    async destroy(closeNewTabsAfterDisconnect) {
        if ('boolean' == typeof closeNewTabsAfterDisconnect) await this.page.setDestroyOptions({
            closeTab: closeNewTabsAfterDisconnect
        });
        await super.destroy();
    }
    constructor(opts){
        const host = getBridgeServerHost({
            host: opts?.host,
            allowRemoteAccess: opts?.allowRemoteAccess
        });
        const page = getBridgePageInCliSide({
            host,
            port: opts?.port,
            timeout: opts?.serverListeningTimeout,
            closeConflictServer: opts?.closeConflictServer
        });
        const originalOnTaskStartTip = opts?.onTaskStartTip;
        super(page, Object.assign(opts || {}, {
            onTaskStartTip: (tip)=>{
                this.page.showStatusMessage(tip);
                if (originalOnTaskStartTip) originalOnTaskStartTip?.call(this, tip);
            }
        })), _define_property(this, "destroyAfterDisconnectFlag", void 0);
        this.destroyAfterDisconnectFlag = opts?.closeNewTabsAfterDisconnect;
    }
}
export { AgentOverChromeBridge, getBridgePageInCliSide };

//# sourceMappingURL=agent-cli-side.mjs.map