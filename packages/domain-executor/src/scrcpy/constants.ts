/** Local scrcpy timeouts / ports (vendored from Midscene defaults). */
export const SCRCPY_SERVER_PORT = 5700;
export const SCRCPY_ADB_CONNECT_TIMEOUT_MS = 15_000;
export const SCRCPY_PUSH_TIMEOUT_MS = 30_000;
export const SCRCPY_START_TIMEOUT_MS = 30_000;
export const SCRCPY_VIDEO_STREAM_TIMEOUT_MS = 20_000;
export const SCRCPY_PREVIEW_METADATA_TIMEOUT_MS = 20_000;

export function scrcpyDebug(...args: unknown[]): void {
  if (process.env.SCRCPY_DEBUG === '1') {
    console.log('[scrcpy]', ...args);
  }
}
