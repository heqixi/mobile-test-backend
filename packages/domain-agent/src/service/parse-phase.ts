/**
 * @module @mtp/domain-agent/service/parse-phase
 *
 * 从模型文本解析 Plan JSON 信封（兼容旧 precondition/act/judge/end 形）。
 */

import type { PlanStrategy, PlanTurn, ToolCall } from '../models/turns.js';
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

function parseCommand(obj: Record<string, unknown> | null): string {
  if (!obj) return '';
  if (typeof obj.command === 'string') return obj.command.trim();
  if (typeof obj.prompt === 'string') return obj.prompt.trim();
  if (Array.isArray(obj.tool_calls)) {
    for (const c of obj.tool_calls) {
      if (!c || typeof c !== 'object') continue;
      const args = (c as { arguments?: { prompt?: string; command?: string } })
        .arguments;
      const command = (args?.prompt ?? args?.command ?? '').trim();
      if (command) return command;
    }
  }
  return '';
}

/**
 * 单一叙述字段：优先 evidence；缺失时回退 reason（兼容旧信封）。
 */
function parseEvidence(
  obj: Record<string, unknown> | null,
  fallback: string,
): string {
  if (typeof obj?.evidence === 'string' && obj.evidence.trim()) {
    return obj.evidence.trim();
  }
  if (typeof obj?.reason === 'string' && obj.reason.trim()) {
    return obj.reason.trim();
  }
  return fallback;
}

function toolCallsForCommand(command: string): ToolCall[] {
  const cmd = command.trim();
  if (!cmd) return [];
  return [{ name: ACT_NL_TOOL, arguments: { prompt: cmd } }];
}

/**
 * 将旧信封映射为 PlanStrategy。
 */
function inferStrategy(
  obj: Record<string, unknown> | null,
  command: string,
): PlanStrategy {
  if (!obj) return command ? 'act' : 'illegal';

  const raw = obj.strategy;
  if (
    raw === 'act' ||
    raw === 'recovery' ||
    raw === 'pass' ||
    raw === 'fail' ||
    raw === 'illegal'
  ) {
    return raw;
  }
  // 兼容旧 end → pass
  if (raw === 'end') return 'pass';

  // 旧 judge
  if (typeof obj.satisfied === 'boolean') {
    if (obj.satisfied) return 'pass';
    // 明确不满足且无纠偏 command → 业务 fail；有 command → recovery
    if (obj.continue === false) return 'fail';
    return command ? 'recovery' : 'fail';
  }

  // 旧 precondition
  if (typeof obj.met === 'boolean') {
    if (!obj.met) return command ? 'recovery' : 'illegal';
    return command ? 'act' : 'illegal';
  }

  // 旧 act：next=judge 须显式 pass/fail
  if (obj.next === 'judge') return 'illegal';
  if (obj.next === 'act') return command ? 'act' : 'illegal';
  if (command) return 'act';

  return 'illegal';
}

/**
 * Plan 信封：{"strategy","command"?,"evidence"}
 * 兼容旧 met/next/satisfied/end 形。
 */
export function parsePlan(text: string): Omit<PlanTurn, 'turnId' | 'at'> {
  const obj = extractJsonObject(text);
  const command = parseCommand(obj) || undefined;
  let strategy = inferStrategy(obj, command ?? '');

  // act/recovery 无 command → illegal
  if ((strategy === 'act' || strategy === 'recovery') && !command) {
    strategy = 'illegal';
  }

  const evidence = parseEvidence(
    obj,
    strategy === 'pass'
      ? 'expectation satisfied'
      : strategy === 'fail'
        ? 'expectation not satisfied'
        : strategy === 'illegal'
          ? 'illegal or incomplete plan JSON'
          : command
            ? `strategy=${strategy}; command=${command}`
            : `strategy=${strategy}`,
  );

  // 空 evidence → illegal
  if (!evidence.trim()) {
    strategy = 'illegal';
  }

  const toolCalls =
    strategy === 'act' || strategy === 'recovery'
      ? toolCallsForCommand(command ?? '')
      : [];

  console.log('[parse-phase:plan] ========== plan parse ==========');
  console.log('[parse-phase:plan] 1) model raw text:\n', text);
  console.log('[parse-phase:plan] 2) extracted JSON:', obj);
  console.log('[parse-phase:plan] 3) strategy / command:', {
    strategy,
    command: command ?? '(none)',
  });
  console.log('[parse-phase:plan] ========== plan parse end ==========');

  return {
    raw: obj ?? { text },
    strategy,
    toolCalls,
    command,
    evidence: evidence.trim() || 'missing evidence in model JSON',
  };
}

/** @deprecated 使用 parsePlan */
export function parsePrecondition(text: string) {
  const p = parsePlan(text);
  return {
    raw: p.raw,
    met: p.strategy === 'act' || p.strategy === 'pass',
    toolCalls: p.strategy === 'recovery' ? p.toolCalls : [],
    evidence: p.evidence,
    reason: undefined as string | undefined,
  };
}

/** @deprecated 使用 parsePlan */
export function parseAct(text: string) {
  const p = parsePlan(text);
  return {
    raw: p.raw,
    next: (p.strategy === 'pass' || p.strategy === 'fail'
      ? 'judge'
      : 'act') as 'act' | 'judge',
    toolCalls: p.toolCalls,
    evidence: p.evidence,
  };
}

/** @deprecated 使用 parsePlan */
export function parseJudge(text: string) {
  const p = parsePlan(text);
  return {
    raw: p.raw,
    satisfied: p.strategy === 'pass',
    reason: p.evidence,
    continue: p.strategy !== 'pass' && p.strategy !== 'fail',
    evidence: p.evidence,
    preconditionMet: undefined as boolean | undefined,
  };
}
