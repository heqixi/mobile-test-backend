/**
 * @module @mtp/domain-agent/service/system-prompt
 *
 * Episode Session 首轮注入的统一 SystemPrompt。
 * 后续相位只发本轮 user prompt + 截图。
 *
 * OpenCode 同一 Session 会自动带上历史对话。
 * 上一轮 Midscene 的 command + tool_result 写入**下一轮 user 消息**（不另发 noReply）。
 *
 * Loop：act → (dispatch act_nl) → judge → act → …
 *
 * **硬性约定**：每一相位都必须返回 **合法 JSON**，且必须包含
 * 非空字符串字段 `evidence`（基于截图的决策依据）。
 * **Judge**：Instruction.expectation 是判定成功的唯一标准。
 */

import type { Instruction } from '../models/instruction.js';

export function expectationText(instruction: Instruction): string {
  return typeof instruction.expectation === 'string'
    ? instruction.expectation
    : JSON.stringify(instruction.expectation);
}

function preconditionsText(instruction: Instruction): string | undefined {
  if (instruction.preconditions == null || instruction.preconditions === '') {
    return undefined;
  }
  return typeof instruction.preconditions === 'string'
    ? instruction.preconditions
    : JSON.stringify(instruction.preconditions);
}

function hintsText(instruction: Instruction): string | undefined {
  if (!instruction.hints?.length) return undefined;
  return instruction.hints.map((h) => `- ${h}`).join('\n');
}

/** act / judge 每轮 user 消息中的 Instruction 上下文块 */
function instructionContextBlock(instruction: Instruction): string {
  const preconditions = preconditionsText(instruction);
  const expectation = expectationText(instruction);
  const hints = hintsText(instruction);
  return [
    preconditions ? `preconditions:\n${preconditions}` : undefined,
    `expectation: ${expectation}`,
    hints ? `hints:\n${hints}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Midscene 自然语言操作约定（给 LLM 写 command 用）。
 * 实际执行走 Executor `/freeform/execute` → Midscene `aiAct`。
 */
export const MIDSCENE_ACT_NL_GUIDE = `
## Only tool: act_nl (Midscene natural-language UI action)

You have exactly ONE tool for acting on the device:
- name: act_nl
- argument: a single Chinese/English natural-language command that Midscene can execute on the current Android screen.

Good command examples:
- "点击屏幕上的 WPS Office 图标"
- "点击底部「文档」Tab"
- "在搜索框输入 hello 并回车"
- "向上滑动一屏"
- "点击右上角关闭按钮"

Rules for Midscene commands:
1. Describe visible UI targets using exact labels/positions from hints when provided — do not guess similar-looking elements.
2. One atomic action per command (prefer one click / one type / one swipe).
3. Do NOT invent tools other than act_nl.
4. Do NOT claim the expectation is satisfied in the act phase — that is judge's job.
5. If hints mention blockers (popup, dialog, overlay, 遮挡, 关闭), clear them BEFORE clicking the main target.
`.trim();

/**
 * act 相位决策顺序：先清障 → 验前提 → 再按 hints 操作。
 * hints 中的「如有遮挡请关闭」类语句具有最高优先级。
 */
export const ACT_DECISION_CHECKLIST = `
## Act-phase decision checklist (MANDATORY — follow in order)

Before choosing command, inspect the screenshot and answer in evidence:

1. **Blockers first (highest priority)**
   - Scan for popups, dialogs, bottom sheets, permission prompts, or overlays that cover the target area.
   - If ANY hint says 遮挡 / popup / 关闭 / dismiss / 先关闭 / 如有遮挡 — and you see such UI, your command MUST clear that blocker this round.
   - Do NOT click the final target (e.g. 拍照 button) while a blocker still covers it.

2. **Preconditions**
   - Verify preconditions against the screenshot. If not met, one command to satisfy the missing precondition first.

3. **Hints as the action script**
   - hints are the preferred step-by-step script, not background trivia.
   - Pick the earliest hint step that is still applicable on the current screen.
   - Use the hint's exact element description (label, side, anchor) in command — e.g. "输入框右侧的【拍照】按钮", not a vague "底部圆形按钮".

4. **Target disambiguation**
   - Never click a visually similar but wrong control (e.g. shutter/capture vs album thumbnail vs send).
   - In evidence, name what you see at the hinted location and why it matches the hint (or why you must clear a blocker first).

5. **When to next="judge"**
   - Only when blockers are gone, preconditions hold, and you believe the next tap is unnecessary because expectation may already be visible — or after the hinted action was just executed successfully (check last_tool).
`.trim();

/** 所有相位共用的 JSON / evidence 硬性要求 */
export const JSON_EVIDENCE_RULES = `
## Output format (MANDATORY for EVERY phase)

1. Respond with ONLY one JSON object. No markdown fences, no prose outside JSON.
2. The JSON MUST include a non-empty string field "evidence".
3. "evidence" must explain WHY you made this decision, citing what you see on the screenshot
   and (when present) the last tool command/result in this user message.
4. If you cannot see enough, still return JSON and put that limitation into "evidence".
`.trim();

/**
 * 统一 SystemPrompt：角色 + act/judge 信封 + Midscene 工具说明 + Instruction。
 * 每个 OpenCode Session 只注入一次。
 */
export function buildEpisodeSystemPrompt(instruction: Instruction): string {
  const expectation = expectationText(instruction);
  const preconditions = preconditionsText(instruction);
  const hints = hintsText(instruction);

  return [
    'You are a mobile UI test Agent running a two-phase loop: act → judge → act → …',
    'There is NO separate plan phase. In act you either emit a Midscene command or choose to judge.',
    'Each user message is ONE phase and includes the latest device screenshot as an image attachment.',
    'When a prior Midscene act ran, that user message also includes last_tool (command + result).',
    'You MUST use the screenshot as primary evidence. Do NOT claim you cannot see images.',
    'This OpenCode session retains prior turns — do not ask to restate full history.',
    '',
    JSON_EVIDENCE_RULES,
    '',
    '## Phase protocols (each response is JSON + required evidence)',
    '',
    '### act',
    'Look at the screenshot. Choose:',
    '- next="act": output one Midscene command to execute now',
    '- next="judge": ready to evaluate expectation against the screenshot — skip tool, go to judge',
    'JSON schema:',
    '{"next": "act" | "judge", "command"?: string, "evidence": string}',
    '- evidence: REQUIRED. Must cite: (1) blockers/popups visible? (2) preconditions met? (3) which hint step this command follows.',
    '- When next="act", command MUST be a non-empty Midscene-executable string (see act_nl guide).',
    '- When next="judge", omit command or use "".',
    '',
    ACT_DECISION_CHECKLIST,
    '',
    '### judge',
    'ONLY success criterion: whether Instruction expectation is satisfied on the current screenshot.',
    'Do NOT invent other goals. last_tool (if present) is context only.',
    'JSON schema:',
    '{"satisfied": boolean, "reason": string, "continue"?: boolean, "evidence": string}',
    '- satisfied=true iff the expectation is met by visible UI (cite expectation + screenshot in evidence/reason).',
    '- satisfied=false and continue!=false → another act→judge round',
    '',
    MIDSCENE_ACT_NL_GUIDE,
    '',
    '## Current Instruction (fixed for this session)',
    `expectation: ${expectation}`,
    preconditions ? `preconditions: ${preconditions}` : undefined,
    hints ? `hints:\n${hints}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 上一轮 Midscene 执行（写入下一轮 user 消息） */
export interface LastToolContext {
  command: string;
  ok: boolean;
  durationMs?: number;
  error?: string;
  resultPreview?: string;
}

/**
 * 本轮 user prompt：相位 + Instruction 上下文 +（若有）上一轮 command/result；截图另作 file part。
 */
export function buildPhaseUserPrompt(
  phase: 'act' | 'judge',
  instruction: Instruction,
  lastTool?: LastToolContext,
): string {
  const context = instructionContextBlock(instruction);
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

  if (phase === 'act') {
    return [
      'Phase: act.',
      'Look at the attached screenshot. Return ONLY JSON: {"next":"act"|"judge","command"?,"evidence"} — evidence is REQUIRED.',
      '',
      'Decision order: (1) clear blockers/popups if hints mention 遮挡/关闭 and screenshot shows them',
      '(2) verify preconditions (3) execute the earliest still-applicable hint step — use exact labels from hints.',
      'Do NOT skip to expectation or click a wrong similar-looking control.',
      '',
      'Current Instruction:',
      context,
      lastToolBlock,
      'A device screenshot is attached as an image file part — use it as primary observation.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    'Phase: judge.',
    'Look at the attached screenshot. Return ONLY JSON: {"satisfied","reason","continue?","evidence"} — evidence is REQUIRED.',
    'The ONLY success criterion is expectation below. preconditions and hints are context only.',
    context,
    'Set satisfied=true only if the screenshot clearly shows expectation is met.',
    lastToolBlock,
    'A device screenshot is attached as an image file part — use it as primary observation.',
  ]
    .filter(Boolean)
    .join('\n');
}
