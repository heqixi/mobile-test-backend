import { getDebug } from "@midscene/shared/logger";
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
const DATA_URL_BASE64_PREFIX = /^data:image\/\w+;base64,/;
const noopDebug = ()=>{};
function writeMjpegFrame(res, boundary, frame) {
    const raw = frame.data.replace(DATA_URL_BASE64_PREFIX, '');
    const buf = Buffer.from(raw, 'base64');
    let writable = res.write(`--${boundary}\r\n`);
    writable = res.write(`Content-Type: ${frame.contentType || 'image/jpeg'}\r\n`) && writable;
    writable = res.write(`Content-Length: ${buf.length}\r\n\r\n`) && writable;
    writable = res.write(buf) && writable;
    writable = res.write('\r\n') && writable;
    return writable;
}
function endMjpegResponse(res) {
    try {
        res.end();
    } catch  {}
}
class InterfaceMjpegHub {
    async streamRequest(req, res, activeInterface, recoverActiveAgent) {
        return this.streamRequestInternal(req, res, activeInterface, recoverActiveAgent, true);
    }
    stopProducer() {
        this.stopProducerInternal(this.producer);
    }
    shutdown() {
        const producer = this.producer;
        if (!producer) return;
        for (const [subscriber, res] of producer.responses){
            producer.subscribers.delete(subscriber);
            try {
                res.destroy();
            } catch  {}
        }
        producer.responses.clear();
        this.stopProducerInternal(producer);
    }
    getLastFrame() {
        return this.producer?.lastFrame;
    }
    async streamRequestInternal(req, res, activeInterface, recoverActiveAgent, allowRecovery) {
        const producer = this.getOrCreateProducer(activeInterface);
        if (!producer) return false;
        const hasInitialFrame = await producer.firstFrameReady;
        if (!hasInitialFrame || !producer.lastFrame) {
            this.debug('interface frame producer did not emit an initial frame, falling back to polling');
            const startupError = producer.startupError;
            this.stopProducerInternal(producer);
            if (allowRecovery && startupError) {
                const recoveredInterface = await recoverActiveAgent(startupError);
                if (recoveredInterface) return this.streamRequestInternal(req, res, recoveredInterface, recoverActiveAgent, false);
            }
            return false;
        }
        this.attachSubscriber(req, res, producer);
        return true;
    }
    attachSubscriber(req, res, producer) {
        const boundary = 'mjpeg-boundary';
        let closed = false;
        let dropping = false;
        const closeResponse = ()=>{
            if (closed) return;
            closed = true;
            this.releaseSubscriber(producer, subscriber);
        };
        const subscriber = (frame)=>{
            if (closed) return;
            if (dropping) return;
            try {
                const writable = writeMjpegFrame(res, boundary, frame);
                if (!writable) {
                    dropping = true;
                    res.once('drain', ()=>{
                        dropping = false;
                    });
                }
            } catch (error) {
                this.debug('interface frame write failed: %s', error);
                closeResponse();
                try {
                    res.destroy();
                } catch  {}
            }
        };
        for (const [oldSubscriber, oldRes] of producer.responses){
            producer.subscribers.delete(oldSubscriber);
            producer.responses.delete(oldSubscriber);
            endMjpegResponse(oldRes);
        }
        producer.subscribers.add(subscriber);
        producer.responses.set(subscriber, res);
        if (producer.stopTimer) {
            clearTimeout(producer.stopTimer);
            producer.stopTimer = void 0;
        }
        req.on('close', closeResponse);
        res.setHeader('Content-Type', `multipart/x-mixed-replace; boundary=${boundary}`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Connection', 'keep-alive');
        this.flushInitialFrame(subscriber, producer.lastFrame);
        this.debug('streaming via shared interface frame producer');
    }
    flushInitialFrame(subscriber, lastFrame) {
        subscriber(lastFrame);
        subscriber(lastFrame);
    }
    getOrCreateProducer(activeInterface) {
        const startMjpegStream = activeInterface.startMjpegStream;
        if ('function' != typeof startMjpegStream) return null;
        if (this.producer?.source === activeInterface) {
            if (this.producer.stopTimer) {
                clearTimeout(this.producer.stopTimer);
                this.producer.stopTimer = void 0;
            }
            return this.producer;
        }
        this.stopProducerInternal(this.producer);
        const controller = new AbortController();
        let resolveInitialFrame;
        let initialFrameTimer;
        const resolveInitialFrameOnce = (hasFrame)=>{
            if (!resolveInitialFrame) return;
            if (initialFrameTimer) {
                clearTimeout(initialFrameTimer);
                initialFrameTimer = void 0;
            }
            resolveInitialFrame(hasFrame);
            resolveInitialFrame = void 0;
        };
        const initialFrameReady = new Promise((resolve)=>{
            resolveInitialFrame = resolve;
            initialFrameTimer = setTimeout(()=>{
                resolveInitialFrameOnce(false);
            }, this.opts.initialFrameTimeoutMs);
        });
        const producer = {
            source: activeInterface,
            controller,
            firstFrameReady: initialFrameReady,
            subscribers: new Set(),
            responses: new Map()
        };
        this.producer = producer;
        (async ()=>{
            try {
                producer.handle = await startMjpegStream.call(activeInterface, {
                    signal: controller.signal,
                    onFrame: (frame)=>{
                        if (controller.signal.aborted) return;
                        producer.lastFrame = frame;
                        resolveInitialFrameOnce(true);
                        for (const subscriber of producer.subscribers)subscriber(frame);
                    },
                    onError: (error)=>{
                        this.debug('interface stream producer error: %s', error);
                        this.stopProducerInternal(producer);
                    }
                }) ?? void 0;
            } catch (error) {
                this.debug('interface frame producer unavailable: %s', error);
                producer.startupError = error;
                resolveInitialFrameOnce(false);
                this.stopProducerInternal(producer);
            }
        })();
        return producer;
    }
    stopProducerInternal(producer) {
        if (!producer) return;
        if (producer.stopTimer) {
            clearTimeout(producer.stopTimer);
            producer.stopTimer = void 0;
        }
        for (const [, res] of producer.responses)endMjpegResponse(res);
        producer.responses.clear();
        producer.subscribers.clear();
        producer.controller.abort();
        Promise.resolve(producer.handle?.stop?.()).catch((error)=>{
            this.debug('interface stream stop failed: %s', error);
        });
        if (this.producer === producer) this.producer = void 0;
    }
    releaseSubscriber(producer, subscriber) {
        producer.subscribers.delete(subscriber);
        producer.responses.delete(subscriber);
        if (producer.subscribers.size > 0 || producer.stopTimer) return;
        producer.stopTimer = setTimeout(()=>{
            producer.stopTimer = void 0;
            if (0 === producer.subscribers.size) this.stopProducerInternal(producer);
        }, this.opts.idleStopMs);
    }
    constructor(opts){
        _define_property(this, "opts", void 0);
        _define_property(this, "producer", void 0);
        _define_property(this, "debug", void 0);
        this.opts = opts;
        this.debug = opts.debug ?? noopDebug;
    }
}
function createInterfaceMjpegHub(opts) {
    return new InterfaceMjpegHub({
        ...opts,
        debug: opts.debug ?? getDebug('playground:mjpeg-hub')
    });
}
export { InterfaceMjpegHub, createInterfaceMjpegHub, writeMjpegFrame };

//# sourceMappingURL=mjpeg-hub.mjs.map