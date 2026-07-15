/**
 * @module @mtp/agent-service/api/agent-http
 *
 * Agent HTTP 契约（architecture §7.4）。
 * 建议进程端口：`:4100`，前缀 `/api/agent/*`。
 *
 * 本文件仅定义：
 * - 路由表
 * - 请求/响应 body 类型
 * - 未实现的 handler 桩
 *
 * **不含** Express/Fastify 实现。
 */

import type {
  CreateInstructionInput,
  Episode,
  Instruction,
  InstructionResult,
  LlmPhase,
} from '@mtp/domain-agent';
import type { OpaqueJson, UUID } from '@mtp/shared-kernel';
import { notImplemented } from './stub.js';

/** Agent 服务建议监听端口 */
export const AGENT_SERVICE_PORT = 4100;

/**
 * Agent HTTP 路由路径常量。
 */
export const AgentHttpRoutes = {
  /** POST — 一次性跑完 Instruction Loop → InstructionResult */
  runInstruction: '/api/agent/instructions/run',
  /** POST — 开启 Episode（body: Instruction）→ Episode */
  openEpisode: '/api/agent/episodes',
  /** GET — 查询 Episode */
  getEpisode: '/api/agent/episodes/:id',
  /** POST — 推进 Loop 一拍 → Episode */
  advance: '/api/agent/episodes/:id/advance',
  /** POST — 请求 LLM（act|judge）→ Episode */
  askLlm: '/api/agent/episodes/:id/ask-llm',
  /** POST — 派发 tool_calls → Episode */
  dispatchTools: '/api/agent/episodes/:id/dispatch-tools',
  /** POST — 注入观察 payload → Episode */
  ingest: '/api/agent/episodes/:id/ingest',
  /** POST — 关闭 Episode → Episode */
  closeEpisode: '/api/agent/episodes/:id/close',
  /** GET — 健康检查 */
  health: '/api/agent/health',
} as const;

// ── Request / Response bodies ──────────────────────────────────────────

/**
 * POST `/api/agent/instructions/run`
 * body: Instruction 或 CreateInstructionInput
 * response: InstructionResult
 */
export type RunInstructionRequest = Instruction | CreateInstructionInput;
export type RunInstructionResponse = InstructionResult;

/**
 * POST `/api/agent/episodes`
 * body: Instruction
 * response: Episode
 */
export type OpenEpisodeRequest = Instruction | CreateInstructionInput;
export type OpenEpisodeResponse = Episode;

/** GET `/api/agent/episodes/:id` → Episode */
export type GetEpisodeResponse = Episode;

/** POST `/api/agent/episodes/:id/advance` → Episode */
export type AdvanceEpisodeResponse = Episode;

/**
 * POST `/api/agent/episodes/:id/ask-llm`
 */
export interface AskLlmRequest {
  /** act = planner；judge = 期望是否达成 */
  phase: LlmPhase;
}
export type AskLlmResponse = Episode;

/**
 * POST `/api/agent/episodes/:id/dispatch-tools`
 */
export interface DispatchToolsRequest {
  /**
   * 可选；缺省使用 Episode.lastAct.toolCalls。
   * 形状与 ActTurn.toolCalls 一致，或 OpaqueJson 数组。
   */
  tool_calls?: OpaqueJson;
}
export type DispatchToolsResponse = Episode;

/**
 * POST `/api/agent/episodes/:id/ingest`
 */
export interface IngestRequest {
  /** 不透明观察载荷（如 sample 原始 JSON） */
  payload: OpaqueJson;
}
export type IngestResponse = Episode;

/** POST `/api/agent/episodes/:id/close` → Episode */
export type CloseEpisodeResponse = Episode;

/**
 * GET `/api/agent/health`
 */
export interface AgentHealthResponse {
  ok: boolean;
  /** 外部 LLM 是否可达（实现时探测） */
  llmReachable?: boolean;
  /** Executor AEP 是否可达（实现时探测） */
  executorReachable?: boolean;
  message?: string;
}

// ── Handler stubs（未实现）─────────────────────────────────────────────

/**
 * Agent HTTP handlers 接口。
 * 实现阶段绑定到 AgentPort；当前全部抛 NOT_IMPLEMENTED。
 */
export interface AgentHttpHandlers {
  runInstruction(body: RunInstructionRequest): Promise<RunInstructionResponse>;
  openEpisode(body: OpenEpisodeRequest): Promise<OpenEpisodeResponse>;
  getEpisode(id: UUID): Promise<GetEpisodeResponse>;
  advance(id: UUID): Promise<AdvanceEpisodeResponse>;
  askLlm(id: UUID, body: AskLlmRequest): Promise<AskLlmResponse>;
  dispatchTools(
    id: UUID,
    body: DispatchToolsRequest,
  ): Promise<DispatchToolsResponse>;
  ingest(id: UUID, body: IngestRequest): Promise<IngestResponse>;
  closeEpisode(id: UUID): Promise<CloseEpisodeResponse>;
  health(): Promise<AgentHealthResponse>;
}

/** 未实现的 Agent HTTP handlers */
export const agentHttpHandlersStub: AgentHttpHandlers = {
  runInstruction: async () =>
    notImplemented(AgentHttpRoutes.runInstruction),
  openEpisode: async () => notImplemented(AgentHttpRoutes.openEpisode),
  getEpisode: async () => notImplemented(AgentHttpRoutes.getEpisode),
  advance: async () => notImplemented(AgentHttpRoutes.advance),
  askLlm: async () => notImplemented(AgentHttpRoutes.askLlm),
  dispatchTools: async () => notImplemented(AgentHttpRoutes.dispatchTools),
  ingest: async () => notImplemented(AgentHttpRoutes.ingest),
  closeEpisode: async () => notImplemented(AgentHttpRoutes.closeEpisode),
  health: async () => notImplemented(AgentHttpRoutes.health),
};
