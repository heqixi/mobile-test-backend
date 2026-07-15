/**
 * @module @mtp/executor-service/server
 *
 * Executor 进程（:4098）组装层：
 * - 路由表（文档 + 分发）
 * - 用 ExecutorPort 创建 AEP / Client 两套 handlers
 *
 * 传输层见 `http-server.ts`；领域见 `@mtp/domain-executor`。
 */

import type { ExecutorPort } from '@mtp/domain-executor';
import {
  AepHttpRoutes,
  EXECUTOR_SERVICE_PORT,
  type AepHttpHandlers,
} from './api/aep-http.js';
import {
  ClientHttpRoutes,
  type ClientHttpHandlers,
} from './api/client-http.js';
import type { HttpResult } from './api/http-kit.js';
import { createAepHttpHandlers } from './handlers/aep-handlers.js';
import { createClientHttpHandlers } from './handlers/client-handlers.js';

export type HttpMethod = 'GET' | 'POST';

export interface RouteDescriptor {
  method: HttpMethod;
  path: string;
  /** aep = Agent↔Executor；client = Console 直连 */
  channel: 'aep' | 'client';
  summary: string;
}

export const executorServiceRouteTable: RouteDescriptor[] = [
  {
    method: 'POST',
    path: AepHttpRoutes.listTools,
    channel: 'aep',
    summary: '列出可用工具',
  },
  {
    method: 'POST',
    path: AepHttpRoutes.sample,
    channel: 'aep',
    summary: 'UI 采样 → UiSnapshot',
  },
  {
    method: 'POST',
    path: AepHttpRoutes.invokeTool,
    channel: 'aep',
    summary: '按名调用工具',
  },
  {
    method: 'POST',
    path: AepHttpRoutes.bindDevice,
    channel: 'aep',
    summary: '绑定设备',
  },
  {
    method: 'POST',
    path: AepHttpRoutes.abort,
    channel: 'aep',
    summary: '中止当前操作',
  },
  {
    method: 'GET',
    path: AepHttpRoutes.health,
    channel: 'aep',
    summary: '设备健康（AEP）',
  },
  {
    method: 'GET',
    path: ClientHttpRoutes.preview,
    channel: 'client',
    summary: '预览流元信息',
  },
  {
    method: 'GET',
    path: ClientHttpRoutes.previewScreenshot,
    channel: 'client',
    summary: 'ADB 截图（回退帧）',
  },
  {
    method: 'GET',
    path: ClientHttpRoutes.previewFrame,
    channel: 'client',
    summary: '预览帧（与 screenshot 同义）',
  },
  {
    method: 'POST',
    path: ClientHttpRoutes.freeformExecute,
    channel: 'client',
    summary: '自然语言直控（不进 Agent Episode）',
  },
  {
    method: 'POST',
    path: ClientHttpRoutes.agentAct,
    channel: 'client',
    summary: 'freeform 别名',
  },
  {
    method: 'GET',
    path: ClientHttpRoutes.health,
    channel: 'client',
    summary: 'Executor 健康（Client / Console）',
  },
];

export interface ExecutorHttpApi {
  port: number;
  routes: RouteDescriptor[];
  aep: AepHttpHandlers;
  client: ClientHttpHandlers;
  /** method + path → 分发到对应 handler */
  dispatch(method: string, path: string, body: unknown): Promise<HttpResult | null>;
}

/**
 * 组装 Executor HTTP API：两套通道 handlers + 统一分发。
 */
export function createExecutorHttpApi(executor: ExecutorPort): ExecutorHttpApi {
  const aep = createAepHttpHandlers(executor);
  const client = createClientHttpHandlers(executor);

  async function dispatch(
    method: string,
    path: string,
    body: unknown,
  ): Promise<HttpResult | null> {
    const key = `${method.toUpperCase()} ${path}`;

    switch (key) {
      case `GET ${ClientHttpRoutes.health}`:
        return client.health();
      case `GET ${AepHttpRoutes.health}`:
        return aep.health();
      case `GET ${ClientHttpRoutes.preview}`:
        return client.getPreview();
      case `GET ${ClientHttpRoutes.previewScreenshot}`:
      case `GET ${ClientHttpRoutes.previewFrame}`:
        return client.captureScreenshot();
      case `POST ${ClientHttpRoutes.freeformExecute}`:
      case `POST ${ClientHttpRoutes.agentAct}`:
        return client.freeformExecute(body);
      case `POST ${AepHttpRoutes.listTools}`:
        return aep.listTools(body as never);
      case `POST ${AepHttpRoutes.sample}`:
        return aep.sample(body);
      case `POST ${AepHttpRoutes.invokeTool}`:
        return aep.invokeTool(body);
      case `POST ${AepHttpRoutes.bindDevice}`:
        return aep.bindDevice(body);
      case `POST ${AepHttpRoutes.abort}`:
        return aep.abort(body as never);
      default:
        return null;
    }
  }

  return {
    port: EXECUTOR_SERVICE_PORT,
    routes: executorServiceRouteTable,
    aep,
    client,
    dispatch,
  };
}
