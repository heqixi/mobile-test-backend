/**
 * @module @mtp/domain-agent/service/system-prompt
 *
 * Episode Session 首轮注入的统一 SystemPrompt。
 * 后续相位只发本轮 user prompt + 截图。
 *
 * Loop：precondition → act → (dispatch) → judge → precondition → …
 *
 * **硬性约定**：每一相位都必须返回 **合法 JSON**，且必须包含
 * 非空字符串字段 `evidence`（基于截图的决策依据）。
 * **Judge**：Instruction.expectation 是判定成功的唯一标准；失败须说明 precondition 是否仍满足。
 */

import type { Instruction } from '../models/instruction.js';
import type { LlmPhase } from '../ports/external-llm-port.js';
import {
  readExpectationEvidence,
  readPreconditionEvidence,
  resolvePreconditionEvidence,
  resolveReferenceEvidence,
} from '../models/visual-evidence.js';
import {
  formatExpectationGoldenHint,
  formatPreconditionGoldenHint,
} from './evidence-compiler.js';

export function expectationText(instruction: Instruction): string {
  return typeof instruction.expectation === 'string'
    ? instruction.expectation
    : JSON.stringify(instruction.expectation);
}

export function preconditionsText(
  instruction: Instruction,
): string | undefined {
  if (instruction.preconditions == null || instruction.preconditions === '') {
    return undefined;
  }
  return typeof instruction.preconditions === 'string'
    ? instruction.preconditions
    : JSON.stringify(instruction.preconditions);
}

export function hasPreconditions(instruction: Instruction): boolean {
  return Boolean(preconditionsText(instruction)?.trim());
}

function listText(items: string[] | undefined): string | undefined {
  if (!items?.length) return undefined;
  return items.map((h) => `- ${h}`).join('\n');
}

/** 基础 Instruction 字段（不含 Golden 大段，Golden 按相位注入） */
function instructionCoreBlock(instruction: Instruction): string {
  const preconditions = preconditionsText(instruction);
  const expectation = expectationText(instruction);
  const actions = listText(instruction.actions);
  const hints = listText(instruction.hints);
  return [
    preconditions ? `preconditions:\n${preconditions}` : undefined,
    `expectation: ${expectation}`,
    actions ? `actions:\n${actions}` : undefined,
    hints ? `hints:\n${hints}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

export const MIDSCENE_ACT_NL_GUIDE = `
## Only tool: act_nl (Midscene natural-language UI action)

You have exactly ONE tool for acting on the device:
- name: act_nl
- argument: a single Chinese/English natural-language command that Midscene can execute on the current Android screen.

Rules for Midscene commands:
1. Describe visible UI targets using exact labels/positions from actions (or hints) when provided.
2. One atomic action per command (prefer one click / one type / one swipe).
3. Do NOT invent tools other than act_nl.
4. Do NOT claim the expectation is satisfied outside the judge phase.
5. If hints mention blockers (popup, dialog, overlay, 遮挡, 关闭), clear them BEFORE the main action.
`.trim();

export const ACT_DECISION_CHECKLIST = `
## Act-phase decision checklist (MANDATORY — follow in order)

Preconditions were already verified in the precondition phase. Do NOT re-check or restore preconditions here.

1. **Blockers first**
   - Clear popups/overlays that cover the action target when hints mention 遮挡/关闭.

2. **Expectation Golden (when attached)**
   - Compare CURRENT vs Expectation Golden and close the gap toward the expected outcome.

3. **Actions as the script**
   - Execute the earliest still-applicable action; use exact labels from actions.
   - If actions are empty, fall back to hints.

4. **When to next="judge"**
   - Only when blockers are gone and you believe expectation may already be visible, or after the planned action just ran (see last_tool).
`.trim();

export const JUDGE_SEMANTIC_MATCH = `
## Judge semantic matching (MANDATORY)

Judge by **UI role + screen outcome**, NOT exact string equality of control labels.
If CURRENT shows the same screen type and control roles as the expectation, label/locale differences are OK.
Fail only when the screen type is wrong or the required outcome/control role is clearly absent.
`.trim();

export const JSON_EVIDENCE_RULES = `
## Output format (MANDATORY for EVERY phase)

1. Respond with ONLY one JSON object. No markdown fences, no prose outside JSON.
2. The JSON MUST include a non-empty string field "evidence".
3. "evidence" must explain WHY you made this decision, citing what you see on the screenshot
   and (when present) the last tool command/result in this user message.
4. If you cannot see enough, still return JSON and put that limitation into "evidence".
`.trim();

/**
 * 统一 SystemPrompt：每个 OpenCode Session 只注入一次。
 */
export function buildEpisodeSystemPrompt(instruction: Instruction): string {
  const expectation = expectationText(instruction);
  const preconditions = preconditionsText(instruction);
  const actions = listText(instruction.actions);
  const hints = listText(instruction.hints);

  return [
    'You are a mobile UI test Agent. Loop phases (in order):',
    'precondition → act → (optional tool) → judge → precondition → …',
    'Never skip precondition when the Instruction has preconditions text.',
    'Each user message is ONE phase with the latest device screenshot.',
    'When a prior Midscene act ran, that user message also includes last_tool.',
    'You MUST use the screenshot as primary evidence. Do NOT claim you cannot see images.',
    '',
    JSON_EVIDENCE_RULES,
    '',
    '## Phase protocols',
    '',
    '### precondition',
    'ONLY check whether Instruction preconditions hold on CURRENT screenshot.',
    'Do NOT pursue expectation or execute the main actions list here.',
    'JSON schema:',
    '{"met": boolean, "command"?: string, "reason"?: string, "evidence": string}',
    '- met=true → go to act (omit command).',
    '- met=false → command MUST be one Midscene action that restores/satisfies preconditions; reason explains what is missing.',
    '- If a PreCondition Golden image is attached, use it as the starting-state reference.',
    '',
    '### act',
    'Preconditions are already met. Choose:',
    '- next="act": one Midscene command toward expectation / actions',
    '- next="judge": ready to evaluate expectation',
    'JSON schema:',
    '{"next": "act" | "judge", "command"?: string, "evidence": string}',
    '',
    ACT_DECISION_CHECKLIST,
    '',
    '### judge',
    'Success criterion: Instruction expectation on CURRENT screenshot.',
    'JSON schema:',
    '{"satisfied": boolean, "reason": string, "continue"?: boolean, "evidence": string, "preconditionMet"?: boolean}',
    '- On failure, reason/evidence MUST say whether preconditions still hold (set preconditionMet true/false) and what specifically is wrong for expectation.',
    '- satisfied=false and continue!=false → loop returns to precondition (not directly to act).',
    '',
    JUDGE_SEMANTIC_MATCH,
    '',
    MIDSCENE_ACT_NL_GUIDE,
    '',
    '## Current Instruction (fixed for this session)',
    `expectation: ${expectation}`,
    preconditions ? `preconditions: ${preconditions}` : undefined,
    actions ? `actions:\n${actions}` : undefined,
    hints ? `hints:\n${hints}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

export interface LastToolContext {
  command: string;
  ok: boolean;
  durationMs?: number;
  error?: string;
  resultPreview?: string;
}

/**
 * 本轮 user prompt：按相位注入不同参考，避免把所有 Golden 塞进同一上下文。
 */
export function buildPhaseUserPrompt(
  phase: LlmPhase,
  instruction: Instruction,
  lastTool?: LastToolContext,
  options?: {
    hasPreconditionRef?: boolean;
    hasExpectationRef?: boolean;
  },
): string {
  const core = instructionCoreBlock(instruction);
  const lastToolBlock = lastTool
    ? [
        'last_tool (Midscene act_nl just executed):',
        `  command: ${lastTool.command}`,
        `  ok: ${lastTool.ok}`,
        lastTool.durationMs != null
          ? `  durationMs: ${lastTool.durationMs}`
          : undefined,
        lastTool.error ? `  error: ${lastTool.error}` : undefined,
        lastTool.resultPreview
          ? `  result: ${lastTool.resultPreview}`
          : undefined,
      ]
        .filter(Boolean)
        .join('\n')
    : undefined;

  const promptOff = process.env.AGENT_VISUAL_EVIDENCE_PROMPT === '0';

  if (phase === 'precondition') {
    const goldenHint =
      !promptOff && options?.hasPreconditionRef
        ? formatPreconditionGoldenHint(
            readPreconditionEvidence(instruction.metadata),
          )
        : !promptOff
          ? formatPreconditionGoldenHint(
              readPreconditionEvidence(instruction.metadata),
            )
          : undefined;
    return [
      'Phase: precondition.',
      'Return ONLY JSON: {"met":boolean,"command"?,"reason"?,"evidence"} — evidence is REQUIRED.',
      'Check ONLY whether preconditions hold on CURRENT. Do not chase expectation.',
      'If unmet, command must restore the precondition state (one atomic Midscene action).',
      '',
      'Current Instruction:',
      core,
      goldenHint,
      lastToolBlock,
      options?.hasPreconditionRef
        ? 'Images: device-screen.png = CURRENT; precondition-reference.png = historical PreCondition Golden.'
        : 'A device screenshot is attached as an image file part — use it as primary observation.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (phase === 'act') {
    const goldenHint =
      !promptOff && options?.hasExpectationRef
        ? formatExpectationGoldenHint(
            readExpectationEvidence(instruction.metadata),
          )
        : undefined;
    return [
      'Phase: act.',
      'Return ONLY JSON: {"next":"act"|"judge","command"?,"evidence"} — evidence is REQUIRED.',
      'Preconditions were already verified. Focus on actions toward expectation.',
      'Decision order: (1) clear blockers if needed (2) if Expectation Golden attached, close the gap (3) execute earliest applicable action.',
      '',
      'Current Instruction:',
      core,
      goldenHint,
      lastToolBlock,
      options?.hasExpectationRef
        ? 'Images: device-screen.png = CURRENT; expectation-reference.png = historical Expectation Golden.'
        : 'A device screenshot is attached as an image file part — use it as primary observation.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  // judge
  return [
    'Phase: judge.',
    'Return ONLY JSON: {"satisfied","reason","continue?","evidence","preconditionMet?"} — evidence is REQUIRED.',
    'Primary criterion: expectation. On failure you MUST set preconditionMet and explain:',
    '- if preconditionMet=false: what precondition is missing (be specific)',
    '- if preconditionMet=true: what expectation outcome is missing (be specific)',
    'Match by UI role / screen outcome; different labels for the same control role are OK.',
    '',
    'Current Instruction:',
    core,
    !promptOff && resolveReferenceEvidence(readExpectationEvidence(instruction.metadata))
      ? formatExpectationGoldenHint(
          readExpectationEvidence(instruction.metadata),
        )
      : undefined,
    lastToolBlock,
    options?.hasExpectationRef
      ? 'Images: device-screen.png = CURRENT; expectation-reference.png = historical Expectation Golden (soft reference).'
      : 'A device screenshot is attached as an image file part — use it as primary observation.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** @deprecated kept for callers that only need a boolean */
export function instructionHasPreconditionGolden(
  instruction: Instruction,
): boolean {
  return Boolean(
    resolvePreconditionEvidence(
      readPreconditionEvidence(instruction.metadata),
    ),
  );
}
