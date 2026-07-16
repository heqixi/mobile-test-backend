/**
 * @module @mtp/domain-agent/service/episode-record
 *
 * Episode 运行时记录与纯数据辅助（无 I/O）。
 */

import type { UUID } from '@mtp/shared-kernel';
import type { AgentLoopEvent } from '../models/agent-event.js';
import type { Episode } from '../models/episode.js';
import type { Instruction } from '../models/instruction.js';
import type { InstructionResult } from '../models/instruction-result.js';
import type { Turn } from '../models/turns.js';

export interface EpisodeRecord {
  episode: Episode;
  openCodeSessionId: string;
  systemPromptSent: boolean;
  streamId?: string;
  /** 用户请求停止；runInstruction / advance 在 await 后检查 */
  abortRequested?: boolean;
  /** 当前等待中的 Playground requestId（便于 abort 时 cancel） */
  activePlaygroundRequestId?: string;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function streamIdOf(instruction: Instruction): string | undefined {
  const v = instruction.metadata?.streamId;
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export function expectationPreview(instruction: Instruction): string {
  const e = instruction.expectation;
  const text = typeof e === 'string' ? e : JSON.stringify(e);
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

export function resolveOpenCodeModel(
  explicit?: { providerID: string; modelID: string },
): { providerID: string; modelID: string } {
  if (explicit?.providerID && explicit?.modelID) return explicit;
  const providerID =
    process.env.OPENCODE_PROVIDER_ID?.trim() ||
    process.env.MTP_OPENCODE_PROVIDER_ID?.trim() ||
    'unsloth_studio';
  const modelID =
    process.env.OPENCODE_MODEL_ID?.trim() ||
    process.env.MTP_OPENCODE_MODEL_ID?.trim() ||
    process.env.MIDSCENE_MODEL_NAME?.trim() ||
    'Qwen3.5-9B';
  return { providerID, modelID };
}

export function touch(rec: EpisodeRecord): void {
  rec.episode.updatedAt = nowIso();
}

export function appendTurn(rec: EpisodeRecord, turn: Turn): void {
  rec.episode.turns = [...rec.episode.turns, turn];
  touch(rec);
}

export function baseEvent(
  rec: EpisodeRecord,
): Pick<
  AgentLoopEvent,
  'at' | 'streamId' | 'episodeId' | 'instructionId' | 'round'
> {
  return {
    at: nowIso(),
    streamId: rec.streamId,
    episodeId: rec.episode.episodeId,
    instructionId: rec.episode.instruction.instructionId,
    round: rec.episode.round,
  };
}

export function toInstructionResult(rec: EpisodeRecord): InstructionResult {
  const judge = rec.episode.lastJudge;
  const terminal =
    rec.episode.status === 'completed'
      ? 'completed'
      : rec.episode.status === 'aborted'
        ? 'aborted'
        : 'failed';
  return {
    episodeId: rec.episode.episodeId,
    instructionId: rec.episode.instruction.instructionId,
    satisfied: judge?.satisfied ?? false,
    reason: judge?.reason ?? `episode ${rec.episode.status}`,
    status: terminal,
    turns: structuredClone(rec.episode.turns),
    finishedAt: nowIso(),
  };
}

export function requireEpisode(
  episodes: Map<UUID, EpisodeRecord>,
  episodeId: UUID,
): EpisodeRecord {
  const rec = episodes.get(episodeId);
  if (!rec) {
    throw new Error(`EPISODE_NOT_FOUND: ${episodeId}`);
  }
  return rec;
}
