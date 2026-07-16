/**
 * @module @mtp/domain-agent/service/parse-phase
 *
 * 从模型文本解析 act / judge JSON 信封。
 */

import type { ActTurn, JudgeTurn, ToolCall } from '../models/turns.js';
import { ACT_NL_TOOL } from './act-nl.js';

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseEvidence(
  obj: Record<string, unknown> | null,
  fallback: string,
): string {
  if (typeof obj?.evidence === 'string' && obj.evidence.trim()) {
    return obj.evidence.trim();
  }
  return fallback;
}

/**
 * Act 信封：{"next":"act"|"judge","command"?,"evidence"}
 * 兼容旧形 {"command","evidence"}（有 command 则视为 next=act）。
 */
export function parseAct(text: string): Omit<ActTurn, 'turnId' | 'at'> {
  const obj = extractJsonObject(text);
  let command = '';

  if (typeof obj?.command === 'string') {
    command = obj.command.trim();
  } else if (typeof obj?.prompt === 'string') {
    command = obj.prompt.trim();
  } else if (Array.isArray(obj?.tool_calls)) {
    for (const c of obj.tool_calls) {
      if (!c || typeof c !== 'object') continue;
      const args = (c as { arguments?: { prompt?: string; command?: string } })
        .arguments;
      command = (args?.prompt ?? args?.command ?? '').trim();
      if (command) break;
    }
  }

  let next: 'act' | 'judge' =
    obj?.next === 'judge'
      ? 'judge'
      : obj?.next === 'act'
        ? 'act'
        : command
          ? 'act'
          : 'judge';

  if (next === 'act' && !command) {
    next = 'judge';
  }

  const toolCalls: ToolCall[] =
    next === 'act' && command
      ? [{ name: ACT_NL_TOOL, arguments: { prompt: command } }]
      : [];

  const evidence = parseEvidence(
    obj,
    next === 'act'
      ? `command chosen: ${command}`
      : 'ready to judge; missing evidence in model JSON',
  );

  return { raw: obj ?? { text }, next, toolCalls, evidence };
}

export function parseJudge(text: string): Omit<JudgeTurn, 'turnId' | 'at'> {
  const obj = extractJsonObject(text);
  if (obj && typeof obj.satisfied === 'boolean') {
    const reason =
      typeof obj.reason === 'string' && obj.reason.trim()
        ? obj.reason
        : text.trim() || 'no reason';
    return {
      raw: obj,
      satisfied: obj.satisfied,
      reason,
      continue: typeof obj.continue === 'boolean' ? obj.continue : undefined,
      evidence: parseEvidence(obj, reason),
    };
  }
  return {
    raw: { text },
    satisfied: false,
    reason: text.trim() || 'empty judge response',
    continue: true,
    evidence: parseEvidence(obj, 'missing evidence in model JSON'),
  };
}
