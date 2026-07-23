/**
 * @module @mtp/domain-goal-space/ports/screenshot-capture-port
 *
 * 截图源（由 executor / FE / adb 适配器实现）。
 * 本域不依赖 @mtp/domain-executor，避免环依赖。
 */

import type { ImageInput } from '../models/image-input.js';

export interface ScreenshotCapturePort {
  capture(): Promise<ImageInput>;
}
