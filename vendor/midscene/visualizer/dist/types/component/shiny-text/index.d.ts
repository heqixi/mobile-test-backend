import type React from 'react';
import './index.less';
type ColorTheme = 'blue' | 'purple' | 'green' | 'rainbow';
interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
    colorTheme?: ColorTheme;
}
declare const ShinyText: React.FC<ShinyTextProps>;
export default ShinyText;
