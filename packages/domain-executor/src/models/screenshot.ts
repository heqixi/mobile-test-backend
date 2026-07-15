/**
 * @module @mtp/domain-executor/models/screenshot
 *
 * ADB / 设备截图结果（Client 预览回退路径）。
 */

export interface ScreenshotResult {
  ok: boolean;
  /** raw base64（无 data: 前缀） */
  base64?: string;
  /** 可直接给 <img src> 的 data URL */
  dataUrl?: string;
  format?: 'png' | 'jpeg';
  capturedAt?: string;
  deviceId?: string;
  source?: 'adb' | 'scrcpy' | 'midscene';
  error?: string;
}
