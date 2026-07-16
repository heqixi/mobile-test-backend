/**
 * Cowork 业务：从「操作步骤」文本切步。
 */

export interface CoworkStepSegment {
  order: number;
  stepId: string;
  text: string;
}

const STEP_LINE = /^\s*(\d+)[.、]\s*(.+?)\s*$/;

/**
 * 按编号行拆分操作步骤；无编号则整段视为 1 步。
 */
export function splitCoworkSteps(stepsText: string): CoworkStepSegment[] {
  const raw = (stepsText ?? '').replace(/\r\n/g, '\n').trim();
  if (!raw) {
    return [{ order: 1, stepId: 'step-1', text: '' }];
  }

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const segments: CoworkStepSegment[] = [];

  for (const line of lines) {
    const m = STEP_LINE.exec(line);
    if (m) {
      const order = Number(m[1]);
      const text = (m[2] ?? '').trim();
      if (!text) continue;
      segments.push({
        order: Number.isFinite(order) ? order : segments.length + 1,
        stepId: `step-${segments.length + 1}`,
        text,
      });
      continue;
    }
    // 续行：并入上一步
    if (segments.length > 0) {
      const last = segments[segments.length - 1]!;
      last.text = `${last.text}\n${line}`.trim();
    }
  }

  if (segments.length === 0) {
    return [{ order: 1, stepId: 'step-1', text: raw }];
  }

  // 重新编号 stepId / 保证 order 连续展示用 1..n
  return segments.map((s, i) => ({
    ...s,
    order: i + 1,
    stepId: `step-${i + 1}`,
  }));
}
