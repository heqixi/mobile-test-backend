/**
 * @module @mtp/executor-service/api/client-http
 *
 * Client 直连 HTTP 契约（architecture §4.2 / §7.3）。
 * 仅：路由常量、payload 类型、handler 接口。
 * 实现见 `handlers/client-handlers.ts`。
 *
 * **不**进入 Agent Episode 语义。
 */

import type {
  DeviceRef,
  FreeformExecuteRequest,
  FreeformExecuteResult,
  PreviewInfo,
  ScreenshotResult,
} from '@mtp/domain-executor';
import type { HttpResult } from './http-kit.js';

export const ClientHttpRoutes = {
  preview: '/preview',
  /** ADB 截图回退（与 preview/frame 同义） */
  previewScreenshot: '/preview/screenshot',
  previewFrame: '/preview/frame',
  freeformExecute: '/freeform/execute',
  /** 历史别名：与 freeformExecute 同源 */
  agentAct: '/agent/act',
  health: '/health',
} as const;

export type PreviewHttpResponse = PreviewInfo;
export type FreeformHttpRequest = FreeformExecuteRequest;
export type FreeformHttpResponse = FreeformExecuteResult;
export type ScreenshotHttpResponse = ScreenshotResult;

/** Console 聚合健康（比 AEP health 多侧车 URL 提示） */
export interface ClientHealthResponse {
  status: 'ok' | 'down';
  ok: boolean;
  available: boolean;
  deviceId?: string;
  adbDevices?: string[];
  device?: DeviceRef;
  preview: string;
  agentAct: string;
  freeform: string;
  playground?: {
    ok: boolean;
    url?: string;
    port?: number;
    scrcpyPort?: number;
  };
  scrcpy?: {
    ok: boolean;
    url?: string;
    port?: number;
  };
  message?: string;
}

/** Client 直连 handler 契约（由 handlers 层实现） */
export interface ClientHttpHandlers {
  health(): Promise<HttpResult>;
  getPreview(): Promise<HttpResult>;
  captureScreenshot(): Promise<HttpResult>;
  freeformExecute(body: unknown): Promise<HttpResult>;
}
