import { jsx, jsxs } from "react/jsx-runtime";
import { GithubOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { EnvConfig } from "../env-config/index.mjs";
import "./style.css";
function NavActions({ showEnvConfig = true, showTooltipWhenEmpty = false, showModelName = false, githubUrl = 'https://github.com/web-infra-dev/midscene', helpUrl = 'https://midscenejs.com/quick-experience.html', className = '', playgroundSDK }) {
    return /*#__PURE__*/ jsxs("div", {
        className: `nav-actions ${className}`,
        children: [
            /*#__PURE__*/ jsx(Typography.Link, {
                href: githubUrl,
                target: "_blank",
                children: /*#__PURE__*/ jsx(GithubOutlined, {
                    className: "nav-icon"
                })
            }),
            /*#__PURE__*/ jsx(Typography.Link, {
                href: helpUrl,
                target: "_blank",
                children: /*#__PURE__*/ jsx(QuestionCircleOutlined, {
                    className: "nav-icon"
                })
            }),
            showEnvConfig && /*#__PURE__*/ jsx(EnvConfig, {
                showTooltipWhenEmpty: showTooltipWhenEmpty,
                showModelName: showModelName,
                playgroundSDK: playgroundSDK
            })
        ]
    });
}
export { NavActions };
