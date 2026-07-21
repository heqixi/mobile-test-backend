import { jsx } from "react/jsx-runtime";
import "./index.css";
const ShinyText = ({ text, disabled = false, speed = 5, className = '', colorTheme = 'blue' })=>{
    const style = {
        '--animation-duration': `${speed}s`
    };
    const themeClass = `theme-${colorTheme}`;
    return /*#__PURE__*/ jsx("div", {
        className: `shiny-text ${themeClass} ${disabled ? 'disabled' : ''} ${className}`,
        style: style,
        children: text
    });
};
const shiny_text = ShinyText;
export { shiny_text as default };
