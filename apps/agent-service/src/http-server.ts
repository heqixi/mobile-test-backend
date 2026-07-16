/**
 * Agent HTTP 传输门面（:4100）
 *
 * JSON API + SSE `/api/agent/events`。
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { AgentPort, OpenCodeHttpClient } from '@mtp/domain-agent';
import { corsPreflight, readJsonBody, sendJson } from './api/http-kit.js';
import { AgentHttpRoutes } from './api/agent-http.js';
import { createAgentHttpApi } from './server.js';
import type { AgentEventHub } from './sse/agent-event-hub.js';
import type { PlaygroundRunHub } from './sse/playground-run-hub.js';

function attachSse(
  req: IncomingMessage,
  res: ServerResponse,
  hub: AgentEventHub,
  streamId?: string,
): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Last-Event-ID',
  });
  res.write(`: connected ${new Date().toISOString()}\n\n`);

  const unsubscribe = hub.subscribe(res, { streamId });
  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
      unsubscribe();
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };
  req.on('close', cleanup);
  res.on('close', cleanup);
}

export function createAgentHttpServer(
  deps: {
    agent: AgentPort;
    openCode: OpenCodeHttpClient;
    eventHub: AgentEventHub;
    playgroundRuns?: PlaygroundRunHub;
  },
  options?: { port?: number; host?: string },
) {
  const api = createAgentHttpApi(deps);
  const port =
    options?.port ??
    Number(process.env.AGENT_PORT ?? process.env.MTP_AGENT_PORT ?? api.port);
  const host = options?.host ?? process.env.AGENT_HOST ?? '127.0.0.1';

  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        corsPreflight(res);
        return;
      }

      const method = req.method ?? 'GET';
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);

      if (method === 'GET' && url.pathname === AgentHttpRoutes.events) {
        const streamId = url.searchParams.get('streamId') ?? undefined;
        attachSse(req, res, deps.eventHub, streamId);
        return;
      }

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
