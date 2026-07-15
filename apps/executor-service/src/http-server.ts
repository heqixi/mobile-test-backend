/**
 * Executor HTTP 传输门面（:4098）
 *
 * **只负责**：监听、CORS、JSON 编解码、把请求交给 `createExecutorHttpApi`。
 * **不负责**：路由业务映射、设备、Midscene、Scrcpy —— 见 server.ts / domain-executor。
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { ExecutorPort } from '@mtp/domain-executor';
import {
  corsPreflight,
  readJsonBody,
  sendJson,
} from './api/http-kit.js';
import { createExecutorHttpApi } from './server.js';

export function createExecutorHttpServer(
  executor: ExecutorPort,
  options?: { port?: number; host?: string },
) {
  const api = createExecutorHttpApi(executor);
  const port = options?.port ?? Number(process.env.EXECUTOR_PORT ?? api.port);
  const host = options?.host ?? process.env.EXECUTOR_HOST ?? '127.0.0.1';

  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        corsPreflight(res);
        return;
      }

      const method = req.method ?? 'GET';
      if (!req.url) {
        sendJson(res, 404, {
          error: 'No URL provided',
          correlationId: randomUUID(),
        });
        return;
      }
      const url = new URL(req.url);
      const needsBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
      const body = needsBody ? await readJsonBody(req) : undefined;

      const result = await api.dispatch(method, url.pathname, body ?? {});
      if (!result) {
        sendJson(res, 404, {
          error: `Unknown route ${method} ${url.pathname}`,
          correlationId: randomUUID(),
        });
        return;
      }

      sendJson(res, result.status, result.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  });

  return {
    port,
    host,
    api,
    listen: () =>
      new Promise<void>((resolve) => {
        server.listen(port, host, () => resolve());
      }),
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
