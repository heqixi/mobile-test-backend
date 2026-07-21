/**
 * Midscene act_nl 自然语言命令校验。
 * 拒绝裸动作词（如 "tap"/"click"），要求包含可定位的 UI 目标描述。
 */

export type MidsceneCommandValidation =
  | { ok: true }
  | { ok: false; reason: string };

/** 单独出现即非法的动作词（无目标） */
const BARE_ACTION_RE =
  /^(tap|click|double[\s_-]?click|right[\s_-]?click|long[\s_-]?press|press|swipe|scroll|drag|type|input|hover|tab|back|home|enter|ok|confirm|submit)[.!。]*$/i;

/**
 * 校验 Midscene 自然语言命令是否可执行。
 * @param command - act / precondition 的 command 字段
 * @param required - 为 true 时禁止空命令
 */
export function validateMidsceneNlCommand(
  command: string | undefined | null,
  options?: { required?: boolean },
): MidsceneCommandValidation {
  const required = options?.required === true;
  const cmd = (command ?? '').trim();

  if (!cmd) {
    if (required) {
      return {
        ok: false,
        reason:
          'command is required and must be a natural-language Midscene instruction that names the UI target',
      };
    }
    return { ok: true };
  }

  if (BARE_ACTION_RE.test(cmd)) {
    return {
      ok: false,
      reason: `bare action verb "${cmd}" is invalid — Midscene needs a full NL command with the UI target (e.g. "点击底部输入框右侧的相机图标按钮"), not just "${cmd}"`,
    };
  }

  // 过短且几乎无描述信息
  if (cmd.length < 6) {
    return {
      ok: false,
      reason: `command too short ("${cmd}") — include the visible target label/position`,
    };
  }

  // 纯英文单词（常见把 action type 当 command）
  if (/^[A-Za-z]+$/.test(cmd) && cmd.length <= 16) {
    return {
      ok: false,
      reason: `single English word "${cmd}" is not a Midscene NL command — describe what to do to which UI element`,
    };
  }

  return { ok: true };
}

/**
 * 构造校验失败后的重试 user prompt（同一 OpenCode session 续写）。
 */
export function buildCommandRepairPrompt(input: {
  phase?: 'plan' | 'act' | 'precondition';
  rejectedCommand: string;
  reason: string;
  previousRaw: unknown;
  evidence?: string;
}): string {
  return [
    'Phase: plan — PREVIOUS OUTPUT REJECTED. Fix and reply again.',
    'Return ONLY one JSON object (no markdown fences).',
    'Schema: {"strategy":"act"|"recovery"|"pass"|"fail","command"?,"evidence"}',
    '',
    'Validation failure:',
    `- rejected command: ${JSON.stringify(input.rejectedCommand)}`,
    `- reason: ${input.reason}`,
    '',
    'Rules for a VALID Midscene command:',
    '- Must be a full natural-language instruction naming the visible UI target.',
    '- BAD: "tap", "click", "swipe", "Tab"',
    '- GOOD: "点击底部输入框右侧的相机图标按钮"',
    '- If your evidence already describes the target, put that description INTO command.',
    '- Use strategy="act" to advance, strategy="recovery" to correct an off-track / failed last step.',
    '- Use strategy="pass" only when expectation is affirmed met; strategy="fail" when affirmed unmet/contradicted.',
    '',
    input.evidence?.trim()
      ? `Your previous evidence (reuse the target description in command):\n${input.evidence.trim()}`
      : undefined,
    '',
    `Previous rejected JSON:\n${JSON.stringify(input.previousRaw)}`,
  ]
    .filter(Boolean)
    .join('\n');
}
