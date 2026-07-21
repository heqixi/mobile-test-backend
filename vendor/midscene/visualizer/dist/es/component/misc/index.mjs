import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRightOutlined, CheckOutlined, ClockCircleOutlined, CloseOutlined, LogoutOutlined, MinusOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert } from "antd";
import shiny_text from "../shiny-text/index.mjs";
function timeCostStrElement(timeCost) {
    let str;
    str = 'number' != typeof timeCost ? '-' : `${(timeCost / 1000).toFixed(2)}s`;
    return /*#__PURE__*/ jsx("span", {
        style: {
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: 'tnum'
        },
        children: str
    });
}
const iconForStatus = (status)=>{
    switch(status){
        case 'finished':
        case 'passed':
        case 'success':
        case 'connected':
            return /*#__PURE__*/ jsx("span", {
                style: {
                    color: '#00AD4B'
                },
                children: /*#__PURE__*/ jsx(CheckOutlined, {})
            });
        case 'finishedWithWarning':
            return /*#__PURE__*/ jsx("span", {
                style: {
                    color: '#f7bb05'
                },
                children: /*#__PURE__*/ jsx(WarningOutlined, {})
            });
        case 'failed':
        case 'closed':
        case 'timedOut':
        case 'interrupted':
            return /*#__PURE__*/ jsx("span", {
                style: {
                    color: '#FF0A0A'
                },
                children: /*#__PURE__*/ jsx(CloseOutlined, {})
            });
        case 'pending':
            return /*#__PURE__*/ jsx(ClockCircleOutlined, {});
        case 'cancelled':
        case 'skipped':
            return /*#__PURE__*/ jsx("span", {
                style: {
                    color: '#8c8c8c'
                },
                children: /*#__PURE__*/ jsx(LogoutOutlined, {})
            });
        case 'running':
            return /*#__PURE__*/ jsx(ArrowRightOutlined, {});
        default:
            return /*#__PURE__*/ jsx(MinusOutlined, {});
    }
};
const errorMessageServerNotReady = /*#__PURE__*/ jsxs("span", {
    children: [
        "Don't worry, just one more step to launch the playground server.",
        /*#__PURE__*/ jsx("br", {}),
        "Please run one of the commands under the midscene project directory:",
        /*#__PURE__*/ jsx("br", {}),
        "a. ",
        /*#__PURE__*/ jsx("strong", {
            children: "npx midscene-playground"
        }),
        /*#__PURE__*/ jsx("br", {}),
        "b. ",
        /*#__PURE__*/ jsx("strong", {
            children: "npx --yes @midscene/web"
        })
    ]
});
const serverLaunchTip = (notReadyMessage = errorMessageServerNotReady)=>/*#__PURE__*/ jsx("div", {
        className: "server-tip",
        children: /*#__PURE__*/ jsx(Alert, {
            message: "Playground Server Not Ready",
            description: notReadyMessage,
            type: "warning"
        })
    });
const emptyResultTip = /*#__PURE__*/ jsx("div", {
    className: "result-empty-tip",
    style: {
        textAlign: 'center'
    },
    children: /*#__PURE__*/ jsx(shiny_text, {
        disabled: true,
        text: "The result will be shown here"
    })
});
export { emptyResultTip, errorMessageServerNotReady, iconForStatus, serverLaunchTip, timeCostStrElement };
