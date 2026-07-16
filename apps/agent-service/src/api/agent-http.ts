/**
 * @module @mtp/agent-service/api/agent-http
 *
 * Agent HTTP 契约（architecture §7.4）。
 * 进程端口：`:4100`，前缀 `/api/agent/*`。
 * 执行后端：OpenCode Server（默认 :4096）。
 */

import type {
  CreateInstructionInput,
  Episode,
  Instruction,
  InstructionResult,
  LlmPhase,
} from '@mtp/domain-agent';
import type { OpaqueJson, UUID } from '@mtp/shared-kernel';
import type { HttpResult } from './http-kit.js';

/** Agent 服务建议监听端口 */
export const AGENT_SERVICE_PORT = 4100;

/**
 * Agent HTTP 路由路径常量。
 */
export const AgentHttpRoutes = {
  /** POST — 一次性跑完 Instruction → InstructionResult（经 OpenCode） */
  runInstruction: '/api/agent/instructions/run',
  /** POST — 开启 Episode */
  openEpisode: '/api/agent/episodes',
  /** GET — 查询 Episode */
  getEpisode: '/api/agent/episodes/:id',
  /** POST — 推进 Loop 一拍 */
  advance: '/api/agent/episodes/:id/advance',
  /** POST — 请求 LLM（act|judge） */
  askLlm: '/api/agent/episodes/:id/ask-llm',
  /** POST — 派发 tool_calls */
  dispatchTools: '/api/agent/episodes/:id/dispatch-tools',
  /** POST — 注入观察 payload */
  ingest: '/api/agent/episodes/:id/ingest',
  /** POST — 关闭 Episode */
  closeEpisode: '/api/agent/episodes/:id/close',
  /** POST — 中止 Episode（打断 runInstruction） */
  abortEpisode: '/api/agent/episodes/:id/abort',
  /** POST — 中止（body: episodeId | streamId） */
  abort: '/api/agent/abort',
  /** GET — 健康检查（含 OpenCode 探测） */
  health: '/api/agent/health',
  /** GET — 根健康（同 health，便于探活） */
  healthRoot: '/health',
  /** GET — Agent Loop SSE 事件流 */
  events: '/api/agent/events',
  /** POST — 前端认领 Playground 执行 */
  playgroundRunAck: '/api/agent/playground-runs/:requestId/ack',
  /** POST — 前端回报 Playground 执行结果 */
  playgroundRunResult: '/api/agent/playground-runs/:requestId/result',
  /** POST — 直连 OpenCode：创建 session */
  openCodeCreateSession: '/api/agent/opencode/sessions',
  /** POST — 直连 OpenCode：向 session 发消息（parts / text） */
  openCodePostMessage: '/api/agent/opencode/sessions/:id/messages',
} as const;

// ── Request / Response bodies ──────────────────────────────────────────

/**
 * POST `/api/agent/instructions/run`
 * 可附带 streamId，写入 Instruction.metadata 供 SSE 过滤。
 */
export type RunInstructionRequest = (Instruction | CreateInstructionInput) & {
  streamId?: string;
};
export type RunInstructionResponse = InstructionResult;

export type OpenEpisodeRequest = Instruction | CreateInstructionInput;
export type OpenEpisodeResponse = Episode;

export type GetEpisodeResponse = Episode;
export type AdvanceEpisodeResponse = Episode;

export interface AskLlmRequest {
  phase: LlmPhase;
}
export type AskLlmResponse = Episode;

export interface DispatchToolsRequest {
  tool_calls?: OpaqueJson;
}
export type DispatchToolsResponse = Episode;

export interface IngestRequest {
  payload: OpaqueJson;
}
export type IngestResponse = Episode;

export type CloseEpisodeResponse = Episode;

export interface AgentHealthResponse {
  ok: boolean;
  service: 'agent-service';
  llmReachable?: boolean;
  openCodeUrl?: string;
  openCodeVersion?: string;
  message?: string;
}

/** POST `/api/agent/opencode/sessions` */
export interface OpenCodeCreateSessionRequest {
  title?: string;
  parentID?: string;
}

/**
 * POST `/api/agent/opencode/sessions/:id/messages`
 * 支持 `text` 便捷字段或完整 `parts`。
 */
export interface OpenCodePostMessageRequest {
  text?: string;
  parts?: Array<{ type: string; text?: string; [key: string]: unknown }>;
  agent?: string;
  system?: string;
  noReply?: boolean;
  model?: { providerID: string; modelID: string };
}

/** POST `/api/agent/abort` */
export interface AbortAgentRequest {
  episodeId?: UUID;
  streamId?: string;
}

export interface AgentHttpHandlers {
  runInstruction(body: RunInstructionRequest): Promise<HttpResult>;
  openEpisode(body: OpenEpisodeRequest): Promise<HttpResult>;
  getEpisode(id: UUID): Promise<HttpResult>;
  advance(id: UUID): Promise<HttpResult>;
  askLlm(id: UUID, body: AskLlmRequest): Promise<HttpResult>;
  dispatchTools(id: UUID, body: DispatchToolsRequest): Promise<HttpResult>;
  ingest(id: UUID, body: IngestRequest): Promise<HttpResult>;
  closeEpisode(id: UUID): Promise<HttpResult>;
  abortEpisode(id: UUID): Promise<HttpResult>;
  abort(body: AbortAgentRequest): Promise<HttpResult>;
  health(): Promise<HttpResult>;
  openCodeCreateSession(body: OpenCodeCreateSessionRequest): Promise<HttpResult>;
  openCodePostMessage(
    id: string,
    body: OpenCodePostMessageRequest,
  ): Promise<HttpResult>;
  playgroundRunAck(requestId: string): Promise<HttpResult>;
  playgroundRunResult(
    requestId: string,
    body: {
      ok: boolean;
      durationMs?: number;
      result?: unknown;
      error?: string;
    },
  ): Promise<HttpResult>;
}
