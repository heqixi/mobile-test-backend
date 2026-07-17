/**
 * @module @mtp/executor-service/api/aep-http
 *
 * AEP 通道 HTTP 契约（architecture §7.3）。
 * 仅：路由常量、payload 类型、handler 接口。
 * 实现见 `handlers/aep-handlers.ts`。
 */

import type {
  BindDeviceRequest,
  BindDeviceResult,
  DeviceHealth,
  InvokeToolRequest,
  SampleRequest,
  ToolDescription,
  ToolResult,
  UiSnapshot,
} from '@mtp/domain-executor';
import type { AepEnvelope, OpaqueJson } from '@mtp/shared-kernel';
import type { HttpResult } from './http-kit.js';

/** Executor 服务建议监听端口 */
export const EXECUTOR_SERVICE_PORT = 4098;

export const AepHttpRoutes = {
  listTools: '/aep/v0.2/list-tools',
  sample: '/aep/v0.2/sample',
  invokeTool: '/aep/v0.2/invoke-tool',
  bindDevice: '/aep/v0.2/bind-device',
  abort: '/aep/v0.2/abort',
  health: '/aep/v0.2/health',
  locate: '/aep/v0.2/locate',
  annotate: '/aep/v0.2/annotate',
} as const;

export interface ListToolsHttpRequest {
  options?: OpaqueJson;
}

export type ListToolsHttpResponse = ToolDescription[];
export type SampleHttpRequest = SampleRequest;
export type SampleHttpResponse = UiSnapshot;
export type InvokeToolHttpRequest = InvokeToolRequest;
export type InvokeToolHttpResponse = ToolResult;
export type BindDeviceHttpRequest = BindDeviceRequest;
export type BindDeviceHttpResponse = BindDeviceResult;

export interface AbortHttpRequest {
  reason?: string;
}
export interface AbortHttpResponse {
  aborted: boolean;
}

export type AepHealthHttpResponse = DeviceHealth;

export type AepRequestEnvelope<T extends string, P> = AepEnvelope<T, P>;
export type AepResponseEnvelope<T extends string, P> = AepEnvelope<T, P>;

/** AEP 路由对应的 handler 契约（由 handlers 层实现） */
export interface AepHttpHandlers {
  listTools(body?: ListToolsHttpRequest): Promise<HttpResult>;
  sample(body: unknown): Promise<HttpResult>;
  invokeTool(body: unknown): Promise<HttpResult>;
  bindDevice(body: unknown): Promise<HttpResult>;
  abort(body?: AbortHttpRequest): Promise<HttpResult>;
  health(): Promise<HttpResult>;
  locate(body: unknown): Promise<HttpResult>;
  annotate(body: unknown): Promise<HttpResult>;
}
