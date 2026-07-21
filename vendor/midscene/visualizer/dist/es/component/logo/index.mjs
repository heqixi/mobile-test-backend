import { jsx } from "react/jsx-runtime";
import { useTheme } from "../../hooks/useTheme.mjs";
import "./index.css";
const LogoUrl = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/vhaeh7vhabf/Midscene.png';
const LogoUrlLight = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/nupipfups/Midscene/midscene_with_text_light.png';
const LogoUrlDark = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/nupipfups/Midscene/midscene_with_text_dark.png';
const Logo = ({ hideLogo = false })=>{
    const { isDarkMode } = useTheme();
    if (hideLogo) return null;
    const logoSrc = isDarkMode ? LogoUrlDark : LogoUrlLight;
    return /*#__PURE__*/ jsx("div", {
        className: "logo",
        children: /*#__PURE__*/ jsx("a", {
            href: "https://midscenejs.com/",
            target: "_blank",
            rel: "noreferrer",
            children: /*#__PURE__*/ jsx("img", {
                alt: "Midscene_logo",
                src: logoSrc
            })
        })
    });
};
export { Logo, LogoUrl };
