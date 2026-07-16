/**
 * @module @mtp/agent-service/sse/agent-event-hub
 *
 * 进程内 Agent Loop 事件总线 → SSE 客户端。
 */

import type { ServerResponse } from 'node:http';
import type { AgentLoopEvent } from '@mtp/domain-agent';

type SseClient = {
  id: string;
  res: ServerResponse;
  /** 若设置则只收该 stream；否则收全部 */
  streamId?: string;
};

export function createAgentEventHub() {
  const clients = new Map<string, SseClient>();
  let seq = 0;

  function writeEvent(res: ServerResponse, event: AgentLoopEvent): void {
    const id = String(++seq);
    res.write(`id: ${id}\n`);
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  return {
    publish(event: AgentLoopEvent): void {
      for (const client of clients.values()) {
        if (client.streamId && event.streamId && client.streamId !== event.streamId) {
          continue;
        }
        try {
          writeEvent(client.res, event);
        } catch {
          clients.delete(client.id);
        }
      }
    },

    /**
     * 挂载 SSE 响应；返回 unsubscribe。
     */
    subscribe(
      res: ServerResponse,
      options?: { streamId?: string; clientId?: string },
    ): () => void {
      const id = options?.clientId ?? `sse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      clients.set(id, {
        id,
        res,
        streamId: options?.streamId,
      });
      return () => {
        clients.delete(id);
      };
    },

    clientCount(): number {
      return clients.size;
    },
  };
}

export type AgentEventHub = ReturnType<typeof createAgentEventHub>;
