import { jsx, jsxs } from "react/jsx-runtime";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useEnvConfig } from "../../store/store.mjs";
import { EnvConfig } from "../env-config/index.mjs";
import "./index.css";
const EnvConfigReminder = ({ className = '' })=>{
    const { config } = useEnvConfig();
    const configAlreadySet = Object.keys(config || {}).length >= 1;
    if (configAlreadySet) return null;
    return /*#__PURE__*/ jsxs("div", {
        className: `env-config-reminder ${className}`,
        children: [
            /*#__PURE__*/ jsx(ExclamationCircleFilled, {
                className: "reminder-icon"
            }),
            /*#__PURE__*/ jsx("span", {
                className: "reminder-text",
                children: "Please set up your environment variables before using."
            }),
            /*#__PURE__*/ jsx(EnvConfig, {
                mode: "text",
                showTooltipWhenEmpty: false
            })
        ]
    });
};
export { EnvConfigReminder };
