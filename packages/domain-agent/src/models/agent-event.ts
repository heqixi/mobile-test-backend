/**
 * @module @mtp/domain-agent/models/agent-event
 *
 * Agent Loop 运行时事件（供 SSE 推到前端对话流）。
 */

import type { UUID } from '@mtp/shared-kernel';

export type AgentLoopEventType =
  | 'episode.started'
  | 'turn.user'
  | 'turn.precondition'
  | 'turn.act'
  | 'turn.playground_run'
  | 'turn.tool_result'
  | 'turn.judge'
  | 'turn.visual_evidence'
  | 'episode.completed'
  | 'episode.failed'
  | 'episode.aborted';

export interface AgentLoopEventBase {
  type: AgentLoopEventType;
  at: string;
  streamId?: string;
  episodeId: UUID;
  instructionId: UUID;
  round?: number;
}

export interface AgentEpisodeStartedEvent extends AgentLoopEventBase {
  type: 'episode.started';
  expectationPreview?: string;
}

/** 发给 LLM 的本轮 user 消息（含截图附件说明） */
export interface AgentTurnUserEvent extends AgentLoopEventBase {
  type: 'turn.user';
  phase: 'precondition' | 'act' | 'judge';
  text: string;
}

export interface AgentTurnPreconditionEvent extends AgentLoopEventBase {
  type: 'turn.precondition';
  met: boolean;
  command?: string;
  evidence: string;
  reason?: string;
}

export interface AgentTurnActEvent extends AgentLoopEventBase {
  type: 'turn.act';
  next: 'act' | 'judge';
  command?: string;
  evidence: string;
}

/**
 * 请前端 UniversalPlayground 执行 act_nl（同源 Midscene agent / :5800）。
 * 前端 ack + 跑完后 POST `/api/agent/playground-runs/:requestId/result`。
 */
export interface AgentTurnPlaygroundRunEvent extends AgentLoopEventBase {
  type: 'turn.playground_run';
  requestId: string;
  command: string;
}

export interface AgentTurnToolResultEvent extends AgentLoopEventBase {
  type: 'turn.tool_result';
  ok: boolean;
  command?: string;
  durationMs?: number;
  error?: string;
  resultPreview?: string;
}

export interface AgentTurnJudgeEvent extends AgentLoopEventBase {
  type: 'turn.judge';
  satisfied: boolean;
  reason: string;
  evidence: string;
  continue?: boolean;
  /** judge 失败归因：precondition 是否仍满足 */
  preconditionMet?: boolean;
}

export interface AgentTurnVisualEvidenceEvent extends AgentLoopEventBase {
  type: 'turn.visual_evidence';
  evidenceId: string;
  annotatedDataUrl?: string;
  screenshotDataUrl?: string;
  /** 落盘绝对路径（SSE 图过大时用此代替内联图） */
  localPath?: string;
  /** file:// 本地 URL */
  fileUrl?: string;
  /** 浏览器可加载的 HTTP 图（locate 失败时用 judge 截图） */
  imageHttpUrl?: string;
  regions: Array<{
    id: string;
    label: string;
    phrase: string;
    locateOk: boolean;
  }>;
  judgeSatisfied?: boolean;
  /** satisfied 且非末步 → 前端写入 candidate（待下游验证） */
  bindAsCandidate?: boolean;
  /** satisfied 且末步 → 前端直接写入 golden */
  bindAsGolden?: boolean;
}

export interface AgentEpisodeCompletedEvent extends AgentLoopEventBase {
  type: 'episode.completed';
  satisfied: boolean;
  reason: string;
}

export interface AgentEpisodeFailedEvent extends AgentLoopEventBase {
  type: 'episode.failed';
  reason: string;
}

export interface AgentEpisodeAbortedEvent extends AgentLoopEventBase {
  type: 'episode.aborted';
  reason: string;
}

export type AgentLoopEvent =
  | AgentEpisodeStartedEvent
  | AgentTurnUserEvent
  | AgentTurnPreconditionEvent
  | AgentTurnActEvent
  | AgentTurnPlaygroundRunEvent
  | AgentTurnToolResultEvent
  | AgentTurnJudgeEvent
  | AgentTurnVisualEvidenceEvent
  | AgentEpisodeCompletedEvent
  | AgentEpisodeFailedEvent
  | AgentEpisodeAbortedEvent;

export type AgentLoopEventListener = (event: AgentLoopEvent) => void;
