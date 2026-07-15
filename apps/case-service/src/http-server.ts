/**
 * Case HTTP 传输门面（:4102）
 *
 * 只负责：监听、CORS、JSON、交给 createCaseHttpApi。
 * 游标 / 账本 / compile 均在 @mtp/domain-case。
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import type {
  CaseCatalogPort,
  CaseRunPort,
  InstructionCompilerPort,
} from '@mtp/domain-case';
import {
  corsPreflight,
  readJsonBody,
  sendJson,
} from './api/http-kit.js';
import { createCaseHttpApi } from './server.js';

export function createCaseHttpServer(
  deps: {
    catalog: CaseCatalogPort;
    compiler: InstructionCompilerPort;
    runs: CaseRunPort;
  },
  options?: { port?: number; host?: string },
) {
  const api = createCaseHttpApi(deps);
  const port =
    options?.port ??
    Number(process.env.CASE_PORT ?? process.env.MTP_CASE_PORT ?? api.port);
  const host = options?.host ?? process.env.CASE_HOST ?? '127.0.0.1';

  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        corsPreflight(res);
        return;
      }

      const method = req.method ?? 'GET';
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      const needsBody =
        method === 'POST' || method === 'PUT' || method === 'PATCH';
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
