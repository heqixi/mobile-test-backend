/**
 * @module @mtp/domain-agent/service/system-prompt
 *
 * Episode Session 首轮注入的统一 SystemPrompt。
 * 后续相位只发本轮 user prompt + 截图。
 *
 * Loop：plan ⇄ act → … → end
 *
 * Agent 可见字段：expectation / actions / hints（不含 preconditions）。
 * **硬性约定**：每次 Plan 都必须返回合法 JSON，且含非空 `evidence`。
 */

import type { Instruction } from '../models/instruction.js';
import type { LlmPhase } from '../ports/external-llm-port.js';
import { normalizeLlmPhase } from '../ports/external-llm-port.js';
import { readExpectationEvidence } from '../models/visual-evidence.js';
import { formatExpectationGoldenHint } from './evidence-compiler.js';

export function expectationText(instruction: Instruction): string {
  return typeof instruction.expectation === 'string'
    ? instruction.expectation
    : JSON.stringify(instruction.expectation);
}

/** @deprecated Agent 不再向模型暴露 preconditions */
export function preconditionsText(
  _instruction: Instruction,
): string | undefined {
  return undefined;
}

/** @deprecated Agent 不再使用 preconditions */
export function hasPreconditions(_instruction: Instruction): boolean {
  return false;
}

function listText(items: string[] | undefined): string | undefined {
  if (!items?.length) return undefined;
  return items.map((h) => `- ${h}`).join('\n');
}

/** Agent 可见 Instruction 字段：expectation / actions / hints */
function instructionCoreBlock(instruction: Instruction): string {
  const expectation = expectationText(instruction);
  const actions = listText(instruction.actions);
  const hints = listText(instruction.hints);
  return [
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
4. command MUST be a FULL natural-language sentence that names the UI target.
   - BAD (rejected): "tap", "click", "swipe", "Tab"
   - GOOD: "点击底部输入框右侧的相机图标按钮"
   - NEVER put only an action verb in command; always include what/where to act.
`.trim();

export const PLAN_STRATEGY_GUIDE = `
## Plan strategy matrix (MANDATORY)

Business 2×2 (pick exactly ONE):

|              | Continue (still operate) | Terminate (test verdict) |
|--------------|--------------------------|--------------------------|
| On track / undecided | strategy="act"     | strategy="pass"          |
| Off track / disproved | strategy="recovery"| strategy="fail"         |

| strategy   | when | command |
|------------|------|---------|
| act        | Expectation still undecided; take one step toward it via actions | required |
| recovery   | Last step went wrong / last_tool failed; correct with one action | required |
| pass       | You can AFFIRM expectation IS satisfied on CURRENT | omit |
| fail       | You can AFFIRM expectation is NOT met or is contradicted | omit |

Decision order:
1. If you can affirm expectation IS met → strategy="pass".
2. Else if you can affirm expectation is unmet / contradicted (wrong final UI, negative expectation broken, actions exhausted with wrong state) → strategy="fail".
3. Else if last_tool failed or CURRENT clearly diverged → strategy="recovery" + corrective command.
4. Else clear blockers if hints mention 遮挡/关闭, then strategy="act" + next atomic action from actions.
5. Match expectation by UI role / screen outcome, not exact label equality.

Rules:
- ActResult success/failure is NOT the test verdict. Only pass/fail judge expectation.
- Do NOT use strategy="fail" merely because last_tool.ok=false — recover or retry first when still undecided.
- evidence MUST cite CURRENT (and last_tool if relevant) and WHY pass vs fail vs continue.
- You only see expectation, actions, and hints — do NOT invent "preconditions".
`.trim();

export const JSON_EVIDENCE_RULES = `
## Output format (MANDATORY)

1. Respond with ONLY one JSON object. No markdown fences, no prose outside JSON.
2. Schema: {"strategy":"act"|"recovery"|"pass"|"fail","command"?,"evidence": string}
3. "evidence" is REQUIRED: cite screenshot / last_tool facts AND why you chose this strategy.
   Do NOT add a separate "reason" field.
4. If you cannot see enough, still return JSON and put that limitation into "evidence" (prefer act/recovery over guessing pass/fail).
`.trim();

/**
 * 统一 SystemPrompt：每个 OpenCode Session 只注入一次。
 */
export function buildEpisodeSystemPrompt(instruction: Instruction): string {
  const expectation = expectationText(instruction);
  const actions = listText(instruction.actions);
  const hints = listText(instruction.hints);

  return [
    'You are a mobile UI test Agent.',
    'Loop: plan → (optional act on device) → plan → … until strategy="pass" or "fail" (or guardrail stop).',
    'Each user message is ONE plan turn with the latest device screenshot.',
    'When a prior Midscene act ran, that user message also includes last_tool.',
    'You MUST use the screenshot as primary evidence. Do NOT claim you cannot see images.',
    'Instruction fields available to you: expectation, actions, hints only.',
    '',
    JSON_EVIDENCE_RULES,
    '',
    PLAN_STRATEGY_GUIDE,
    '',
    MIDSCENE_ACT_NL_GUIDE,
    '',
    '## Current Instruction (fixed for this session)',
    `expectation: ${expectation}`,
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
 * 本轮 Plan user prompt。
 */
export function buildPhaseUserPrompt(
  phase: LlmPhase,
  instruction: Instruction,
  lastTool?: LastToolContext,
  options?: {
    hasExpectationRef?: boolean;
    /** Goal Space ContextPack.textMarkdown */
    goalSpaceMarkdown?: string;
  },
): string {
  void normalizeLlmPhase(phase);
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
  const expHint =
    !promptOff
      ? formatExpectationGoldenHint(
          readExpectationEvidence(instruction.metadata),
        )
      : undefined;

  const imageLine = options?.hasExpectationRef
    ? 'Images: device-screen.png = CURRENT; expectation-reference.png = Expectation Golden.'
    : 'A device screenshot is attached as an image file part — use it as primary observation.';

  return [
    'Phase: plan.',
    'Return ONLY JSON: {"strategy":"act"|"recovery"|"pass"|"fail","command"?,"evidence"} — evidence is REQUIRED.',
    'Pick strategy from the matrix; when strategy is act or recovery, command MUST name the UI target (never bare "tap"/"click").',
    '',
    'Current Instruction:',
    core,
    expHint,
    lastToolBlock,
    imageLine,
    options?.goalSpaceMarkdown?.trim() || undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

/** @deprecated Agent 不再使用 PreCondition Golden */
export function instructionHasPreconditionGolden(
  _instruction: Instruction,
): boolean {
  return false;
}

/** @deprecated */
export const ACT_DECISION_CHECKLIST = PLAN_STRATEGY_GUIDE;
/** @deprecated */
export const JUDGE_SEMANTIC_MATCH = `
Match by UI role / screen outcome; different labels for the same control role are OK.
`.trim();
