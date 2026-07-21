"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
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
    runConnectivityTest: ()=>runConnectivityTest
});
const external_screenshot_item_js_namespaceObject = require("../../screenshot-item.js");
const index_js_namespaceObject = require("../../service/index.js");
var index_js_default = /*#__PURE__*/ __webpack_require__.n(index_js_namespaceObject);
const external_models_index_js_namespaceObject = require("../models/index.js");
const external_service_caller_index_js_namespaceObject = require("../service-caller/index.js");
const external_fixture_js_namespaceObject = require("./fixture.js");
const TEXT_EXPECTED_TOKEN = 'CONNECTIVITY_OK';
function isFiniteNumber(value) {
    return 'number' == typeof value && Number.isFinite(value);
}
function hasValidRect(value) {
    if (!value || 'object' != typeof value) return false;
    const rect = value;
    return isFiniteNumber(rect.left) && isFiniteNumber(rect.top) && isFiniteNumber(rect.width) && isFiniteNumber(rect.height);
}
function hasValidCenter(value) {
    return Array.isArray(value) && 2 === value.length && isFiniteNumber(value[0]) && isFiniteNumber(value[1]);
}
function buildFixtureContext() {
    return {
        screenshot: external_screenshot_item_js_namespaceObject.ScreenshotItem.create(external_fixture_js_namespaceObject.CONNECTIVITY_FIXTURE_IMAGE, Date.now()),
        shotSize: external_fixture_js_namespaceObject.CONNECTIVITY_FIXTURE_SHOT_SIZE,
        shrunkShotToLogicalRatio: 1
    };
}
function buildCheckResult(name, modelRuntime, result) {
    const { config } = modelRuntime;
    return {
        name,
        intent: config.intent,
        modelName: config.modelName,
        modelFamily: config.modelFamily,
        ...result
    };
}
function buildConnectivityModelRuntime(modelConfig) {
    return (0, external_models_index_js_namespaceObject.getModelRuntime)({
        ...modelConfig,
        retryCount: 0
    });
}
function formatConnectivityCheckName(check) {
    const checkName = 'aiLocate' === check.name ? 'AI locate check' : `${check.name[0]?.toUpperCase()}${check.name.slice(1)} check`;
    const modelLabel = check.modelName || check.intent;
    return `${checkName} - ${modelLabel} (${check.intent})`;
}
function buildConnectivityFailureMessage(checks) {
    const failedChecks = checks.filter((item)=>!item.passed);
    if (0 === failedChecks.length) return 'Connectivity test failed, but no failed check details were generated.';
    return failedChecks.map((item)=>{
        const detail = item.message || 'Failed without details.';
        return `[${formatConnectivityCheckName(item)}]: ${detail}`;
    }).join('\n');
}
async function runTextConnectivityCheck(modelRuntime) {
    const startTime = Date.now();
    try {
        const result = await (0, external_service_caller_index_js_namespaceObject.callAI)([
            {
                role: 'system',
                content: 'Reply with the exact token the user asks for.'
            },
            {
                role: 'user',
                content: `Return exactly ${TEXT_EXPECTED_TOKEN}`
            }
        ], modelRuntime);
        const content = result.content.trim();
        const passed = content.includes(TEXT_EXPECTED_TOKEN);
        return buildCheckResult('text', modelRuntime, {
            passed,
            durationMs: Date.now() - startTime,
            message: passed ? '' : `Unexpected response: ${content}`
        });
    } catch (error) {
        return buildCheckResult('text', modelRuntime, {
            passed: false,
            durationMs: Date.now() - startTime,
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
async function runVisionConnectivityCheck(modelRuntime) {
    const startTime = Date.now();
    try {
        await (0, external_service_caller_index_js_namespaceObject.callAI)([
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'What is the main content of this image ? It is a photo or a form ?'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: external_fixture_js_namespaceObject.CONNECTIVITY_FIXTURE_IMAGE,
                            detail: 'high'
                        }
                    }
                ]
            }
        ], modelRuntime);
        return buildCheckResult('vision', modelRuntime, {
            passed: true,
            durationMs: Date.now() - startTime,
            message: ''
        });
    } catch (error) {
        return buildCheckResult('vision', modelRuntime, {
            passed: false,
            durationMs: Date.now() - startTime,
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
async function runAiLocateConnectivityCheck(modelRuntime) {
    const startTime = Date.now();
    try {
        const context = buildFixtureContext();
        const service = new (index_js_default())(context);
        const locateResult = await service.locate({
            prompt: 'the main todo input box'
        }, {}, modelRuntime);
        const targetRect = locateResult.rect || locateResult.element?.rect;
        const center = locateResult.element?.center;
        const passed = hasValidRect(targetRect) && hasValidCenter(center);
        return buildCheckResult('aiLocate', modelRuntime, {
            passed,
            durationMs: Date.now() - startTime,
            message: passed ? '' : `Invalid locate result: ${JSON.stringify({
                rect: targetRect,
                center
            })}`
        });
    } catch (error) {
        return buildCheckResult('aiLocate', modelRuntime, {
            passed: false,
            durationMs: Date.now() - startTime,
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
async function runConnectivityTest(config) {
    const planningModelRuntime = buildConnectivityModelRuntime(config.planningModelConfig);
    const insightModelRuntime = buildConnectivityModelRuntime(config.insightModelConfig);
    const defaultModelRuntime = buildConnectivityModelRuntime(config.defaultModelConfig);
    const checks = await Promise.all([
        runTextConnectivityCheck(planningModelRuntime),
        runVisionConnectivityCheck(insightModelRuntime),
        runAiLocateConnectivityCheck(defaultModelRuntime)
    ]);
    const passed = checks.every((item)=>item.passed);
    return {
        passed,
        message: passed ? void 0 : buildConnectivityFailureMessage(checks)
    };
}
exports.runConnectivityTest = __webpack_exports__.runConnectivityTest;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "runConnectivityTest"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=run-connectivity-test.js.map