/**
 * Case HTTP 传输门面（:4102）
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import type {
  CaseCatalogPort,
  CaseDataConnectorPort,
  CaseRunPort,
  InstructionCompilerPort,
} from '@mtp/domain-case';
import { CaseDomainError } from '@mtp/domain-case';
import { corsPreflight, readJsonBody, sendJson } from './api/http-kit.js';
import { CaseHttpRoutes } from './api/case-http.js';
import type { ConnectorSourceFactory } from './connector/source-factory.js';
import { createCaseHttpApi, matchRoute } from './server.js';

export function createCaseHttpServer(
  deps: {
    catalog: CaseCatalogPort;
    compiler: InstructionCompilerPort;
    runs: CaseRunPort;
    connector: CaseDataConnectorPort;
    sourceFactory: ConnectorSourceFactory;
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

      // 流式编译：NDJSON 透传进度事件
      {
        const params = matchRoute(CaseHttpRoutes.connectorCompile, url.pathname);
        const wantStream =
          url.searchParams.get('stream') === '1' ||
          (req.headers.accept ?? '').includes('application/x-ndjson');
        if (method === 'POST' && params?.caseId && wantStream) {
          // drain body if any
          await readJsonBody(req).catch(() => ({}));
          res.writeHead(200, {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
            'Cache-Control': 'no-cache, no-transform',
            'X-Content-Type-Options': 'nosniff',
          });
          let wroteError = false;
          const writeEvent = (event: unknown) => {
            if (
              event &&
              typeof event === 'object' &&
              (event as { type?: string }).type === 'error'
            ) {
              wroteError = true;
            }
            res.write(`${JSON.stringify(event)}\n`);
          };
          try {
            await deps.connector.compileCaseStream(params.caseId, writeEvent);
          } catch (error) {
            if (!wroteError) {
              if (error instanceof CaseDomainError) {
                writeEvent({
                  type: 'error',
                  caseId: params.caseId,
                  code: error.code,
                  message: error.message,
                });
              } else {
                writeEvent({
                  type: 'error',
                  caseId: params.caseId,
                  message:
                    error instanceof Error ? error.message : String(error),
                });
              }
            }
          }
          res.end();
          return;
        }
      }

      const needsBody =
        method === 'POST' || method === 'PUT' || method === 'PATCH';
      const body = needsBody ? await readJsonBody(req) : undefined;

      const result = await api.dispatch(
        method,
        url.pathname,
        body ?? {},
        url.searchParams,
      );
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
