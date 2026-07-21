import { jsx, jsxs } from "react/jsx-runtime";
import { Button } from "antd";
import blackboard from "../blackboard/index.mjs";
import { iconForStatus } from "../misc/index.mjs";
import playground_demo_ui_context from "../playground/playground-demo-ui-context.json";
import "./index.css";
const ContextPreview = ({ uiContextPreview, setUiContextPreview, showContextPreview })=>{
    if (!showContextPreview) return null;
    return /*#__PURE__*/ jsxs("div", {
        className: "form-part context-panel",
        children: [
            /*#__PURE__*/ jsx("h3", {
                children: "UI Context"
            }),
            uiContextPreview ? /*#__PURE__*/ jsx(blackboard, {
                uiContext: uiContextPreview,
                hideController: true
            }) : /*#__PURE__*/ jsxs("div", {
                children: [
                    iconForStatus('failed'),
                    " No UI context",
                    /*#__PURE__*/ jsx(Button, {
                        type: "link",
                        onClick: (e)=>{
                            e.preventDefault();
                            setUiContextPreview(playground_demo_ui_context);
                        },
                        children: "Load Demo"
                    }),
                    /*#__PURE__*/ jsx("div", {
                        children: "To load the UI context, you can either use the demo data above, or click the 'Send to Playground' in the report page."
                    })
                ]
            })
        ]
    });
};
export { ContextPreview };
