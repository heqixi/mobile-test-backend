/**
 * @module @mtp/agent-service/server
 *
 * 组装层：路由表 + dispatch（含 :param 匹配）。
 */

import type { AgentPort, OpenCodeHttpClient } from '@mtp/domain-agent';
import {
  AGENT_SERVICE_PORT,
  AgentHttpRoutes,
  type AgentHttpHandlers,
} from './api/agent-http.js';
import type { HttpResult } from './api/http-kit.js';
import { createAgentHttpHandlers } from './handlers/agent-handlers.js';
import type { PlaygroundRunHub } from './sse/playground-run-hub.js';

export type HttpMethod = 'GET' | 'POST';

export interface RouteDescriptor {
  method: HttpMethod;
  path: string;
  summary: string;
}

export const agentServiceRouteTable: RouteDescriptor[] = [
  {
    method: 'GET',
    path: AgentHttpRoutes.healthRoot,
    summary: '根健康检查',
  },
  {
    method: 'GET',
    path: AgentHttpRoutes.health,
    summary: 'Agent 健康（含 OpenCode）',
  },
  {
    method: 'GET',
    path: AgentHttpRoutes.events,
    summary: 'Agent Loop SSE 事件流',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.runInstruction,
    summary: '跑 Instruction（OpenCode）',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.openEpisode,
    summary: '开启 Episode',
  },
  {
    method: 'GET',
    path: AgentHttpRoutes.getEpisode,
    summary: '查询 Episode',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.advance,
    summary: '推进 Loop 一拍',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.askLlm,
    summary: '请求 LLM（act|judge）',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.dispatchTools,
    summary: '派发 tool_calls',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.ingest,
    summary: '注入观察',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.closeEpisode,
    summary: '关闭 Episode',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.abortEpisode,
    summary: '中止 Episode',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.abort,
    summary: '中止 Agent（episodeId 或 streamId）',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.playgroundRunAck,
    summary: '前端认领 Playground act_nl 执行',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.playgroundRunResult,
    summary: '前端回报 Playground act_nl 结果',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.openCodeCreateSession,
    summary: 'OpenCode 创建 session',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.openCodePostMessage,
    summary: 'OpenCode POST message',
  },
];

export function matchRoute(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!;
    const actual = pathParts[i]!;
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(actual);
    } else if (pp !== actual) {
      return null;
    }
  }
  return params;
}

export interface AgentHttpApi {
  port: number;
  routes: RouteDescriptor[];
  handlers: AgentHttpHandlers;
  dispatch(
    method: string,
    path: string,
    body: unknown,
  ): Promise<HttpResult | null>;
}

export function createAgentHttpApi(deps: {
  agent: AgentPort;
  openCode: OpenCodeHttpClient;
  playgroundRuns?: PlaygroundRunHub;
}): AgentHttpApi {
  const handlers = createAgentHttpHandlers(deps);

  async function dispatch(
    method: string,
    path: string,
    body: unknown,
  ): Promise<HttpResult | null> {
    const m = method.toUpperCase();

    if (
      m === 'GET' &&
      (path === AgentHttpRoutes.health || path === AgentHttpRoutes.healthRoot)
    ) {
      return handlers.health();
    }
    if (m === 'POST' && path === AgentHttpRoutes.runInstruction) {
      return handlers.runInstruction(body as never);
    }
    if (m === 'POST' && path === AgentHttpRoutes.abort) {
      return handlers.abort(body as never);
    }
    if (m === 'POST' && path === AgentHttpRoutes.openEpisode) {
      return handlers.openEpisode(body as never);
    }
    if (m === 'POST' && path === AgentHttpRoutes.openCodeCreateSession) {
      return handlers.openCodeCreateSession(body as never);
    }

    {
      const params = matchRoute(AgentHttpRoutes.getEpisode, path);
      if (m === 'GET' && params?.id) {
        return handlers.getEpisode(params.id);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.advance, path);
      if (m === 'POST' && params?.id) {
        return handlers.advance(params.id);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.askLlm, path);
      if (m === 'POST' && params?.id) {
        return handlers.askLlm(params.id, body as never);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.dispatchTools, path);
      if (m === 'POST' && params?.id) {
        return handlers.dispatchTools(params.id, body as never);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.ingest, path);
      if (m === 'POST' && params?.id) {
        return handlers.ingest(params.id, body as never);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.closeEpisode, path);
      if (m === 'POST' && params?.id) {
        return handlers.closeEpisode(params.id);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.abortEpisode, path);
      if (m === 'POST' && params?.id) {
        return handlers.abortEpisode(params.id);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.openCodePostMessage, path);
      if (m === 'POST' && params?.id) {
        return handlers.openCodePostMessage(params.id, body as never);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.playgroundRunAck, path);
      if (m === 'POST' && params?.requestId) {
        return handlers.playgroundRunAck(params.requestId);
      }
    }
    {
      const params = matchRoute(AgentHttpRoutes.playgroundRunResult, path);
      if (m === 'POST' && params?.requestId) {
        return handlers.playgroundRunResult(params.requestId, body as never);
      }
    }

    return null;
  }

  return {
    port: AGENT_SERVICE_PORT,
    routes: agentServiceRouteTable,
    handlers,
    dispatch,
  };
}
