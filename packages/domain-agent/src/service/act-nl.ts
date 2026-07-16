/**
 * @module @mtp/domain-agent/service/act-nl
 *
 * act_nl 工具约定 + Midscene 结果摘要（供下一轮 user / SSE）。
 */

import type { Episode } from '../models/episode.js';
import type { ToolCall } from '../models/turns.js';
import type { LastToolContext } from './system-prompt.js';

export const ACT_NL_TOOL = 'act_nl' as const;

export function actNlCommand(calls: ToolCall[]): string | undefined {
  const call = calls.find((c) => c.name === ACT_NL_TOOL) ?? calls[0];
  if (!call) return undefined;
  const args = call.arguments as { prompt?: string; command?: string };
  const cmd = (args.prompt ?? args.command ?? '').trim();
  return cmd || undefined;
}

/**
 * Midscene / Playground 结果里常夹带 dump；给 LLM 只保留可读的一句话。
 */
export function summarizeMidsceneResult(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t || undefined;
  }
  if (typeof raw !== 'object') {
    return String(raw);
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.result === 'string' && obj.result.trim()) {
    return obj.result.trim();
  }
  if (obj.result && typeof obj.result === 'object') {
    const inner = obj.result as Record<string, unknown>;
    if (typeof inner.result === 'string' && inner.result.trim()) {
      return inner.result.trim();
    }
  }
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }
  return undefined;
}

/** 最近一次 tool_result → last_tool 上下文 */
export function lastToolFromEpisode(
  episode: Episode,
): LastToolContext | undefined {
  const last = [...episode.turns]
    .reverse()
    .find((t) => t.kind === 'tool_result');
  if (!last || last.kind !== 'tool_result') return undefined;
  const first = last.results[0] as
    | {
        ok?: boolean;
        error?: string;
        durationMs?: number;
        prompt?: string;
        result?: unknown;
      }
    | undefined;
  const command =
    (typeof first?.prompt === 'string' && first.prompt.trim()) ||
    actNlCommand(episode.lastAct?.toolCalls ?? []) ||
    '(unknown)';
  return {
    command,
    ok: first?.ok === true,
    durationMs: first?.durationMs,
    error: typeof first?.error === 'string' ? first.error : undefined,
    resultPreview: summarizeMidsceneResult(first?.result),
  };
}
