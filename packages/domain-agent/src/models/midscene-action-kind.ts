/**
 * @module @mtp/domain-agent/models/midscene-action-kind
 *
 * Midscene Android actionSpace 事件穷举 + 单步限制策略。
 * 仅「点击类」对 aiAct 施加 maxActions=1；输入/滑动等允许多步（如先点输入框再键入）。
 */

/**
 * Midscene Android 设备支持的 action 名（与 actionSpace / defineAction* 对齐）。
 * 模型 Plan JSON 的 `actionKind` 必须取自此集合。
 */
export const MIDSCENE_ACTION_KINDS = [
  // 指针 / 点击族
  'Tap',
  'DoubleClick',
  'RightClick',
  'LongPress',
  'Hover',
  'DragAndDrop',
  // 键盘 / 输入族
  'Input',
  'ClearInput',
  'KeyboardPress',
  'CursorMove',
  // 手势 / 滚动
  'Scroll',
  'Swipe',
  'Pinch',
  'PullGesture',
  // 系统 / 平台
  'AndroidBackButton',
  'AndroidHomeButton',
  'AndroidRecentAppsButton',
  'Launch',
  'Terminate',
  'RunAdbShell',
  'Sleep',
] as const;

export type MidsceneActionKind = (typeof MIDSCENE_ACTION_KINDS)[number];

/**
 * 需要限制单步（maxActions=1）的点击类事件。
 * 其它事件不设 maxActions，避免「点输入框 + 输入文字」等复合规划被截断。
 */
export const SINGLE_STEP_ACTION_KINDS = [
  'Tap',
  'DoubleClick',
  'RightClick',
  'LongPress',
] as const satisfies readonly MidsceneActionKind[];

export type SingleStepActionKind = (typeof SINGLE_STEP_ACTION_KINDS)[number];

const KIND_SET = new Set<string>(MIDSCENE_ACTION_KINDS);
const SINGLE_STEP_SET = new Set<string>(SINGLE_STEP_ACTION_KINDS);

export function isMidsceneActionKind(raw: unknown): raw is MidsceneActionKind {
  return typeof raw === 'string' && KIND_SET.has(raw);
}

export function isSingleStepActionKind(kind: MidsceneActionKind): boolean {
  return SINGLE_STEP_SET.has(kind);
}

/**
 * 点击类 → 1；其它 → undefined（不限制）。
 */
export function maxActionsForKind(
  kind: MidsceneActionKind | undefined,
): number | undefined {
  if (!kind) return undefined;
  return isSingleStepActionKind(kind) ? 1 : undefined;
}

/**
 * act / Playground / freeform 超时。
 * Input 族（含多行中文 + yadb）规划更久，默认 120s；其它默认 45s。
 */
export function actTimeoutMsForKind(
  kind: MidsceneActionKind | undefined,
): number {
  const baseRaw = Number(process.env.AGENT_ACT_TIMEOUT_MS ?? 45_000);
  const base =
    Number.isFinite(baseRaw) && baseRaw > 0 ? Math.floor(baseRaw) : 45_000;
  const inputRaw = Number(process.env.AGENT_ACT_INPUT_TIMEOUT_MS ?? 120_000);
  const inputMs =
    Number.isFinite(inputRaw) && inputRaw > 0 ? Math.floor(inputRaw) : 120_000;
  if (
    kind === 'Input' ||
    kind === 'ClearInput' ||
    kind === 'KeyboardPress' ||
    kind === 'CursorMove'
  ) {
    return Math.max(base, inputMs);
  }
  return base;
}

/**
 * 从自然语言 command 启发式推断（模型漏写 actionKind 时的兜底）。
 * 输入类优先于点击，避免「在输入框输入 xxx」被误判为 Tap。
 */
export function inferMidsceneActionKind(
  command: string | undefined,
): MidsceneActionKind {
  const c = (command ?? '').trim().toLowerCase();
  if (!c) return 'Tap';

  if (/清空|清除输入|clear\s*(input|text)|clearinput/.test(c)) {
    return 'ClearInput';
  }
  if (
    /输入|填写|键入|打字|type\b|input\b|enter\s+text|fill\b|写入/.test(c)
  ) {
    return 'Input';
  }
  if (/按键|keyboard|快捷键|按下.*键|press\s+key/.test(c)) {
    return 'KeyboardPress';
  }
  if (/双击|double\s*-?\s*click|double\s*-?\s*tap/.test(c)) {
    return 'DoubleClick';
  }
  if (/长按|long\s*-?\s*press|long\s*-?\s*tap/.test(c)) {
    return 'LongPress';
  }
  if (/右键|right\s*-?\s*click/.test(c)) {
    return 'RightClick';
  }
  if (/悬停|hover/.test(c)) return 'Hover';
  if (/拖拽|拖放|drag/.test(c)) return 'DragAndDrop';
  if (/捏合|双指|pinch/.test(c)) return 'Pinch';
  if (/下拉刷新|上拉加载|pull\s*(down|up|gesture)/.test(c)) {
    return 'PullGesture';
  }
  if (/滑动|swipe|轻扫/.test(c)) return 'Swipe';
  if (/滚动|scroll|翻页/.test(c)) return 'Scroll';
  if (/返回|back\s*button|系统返回|androidback/.test(c)) {
    return 'AndroidBackButton';
  }
  if (/主页|home\s*button|androidhome/.test(c)) {
    return 'AndroidHomeButton';
  }
  if (/最近任务|recent\s*apps|多任务/.test(c)) {
    return 'AndroidRecentAppsButton';
  }
  if (/启动|launch\b|打开应用/.test(c)) return 'Launch';
  if (/结束应用|terminate|杀掉|kill\s*app/.test(c)) return 'Terminate';
  if (/adb|shell\b/.test(c)) return 'RunAdbShell';
  if (/等待|sleep|wait\b/.test(c)) return 'Sleep';
  if (/点击|单击|点按|tap\b|click\b/.test(c)) return 'Tap';

  // 未匹配时偏保守：按点击限单步
  return 'Tap';
}

export function normalizeMidsceneActionKind(
  raw: unknown,
  command?: string,
): MidsceneActionKind {
  if (isMidsceneActionKind(raw)) return raw;
  // 兼容小写 / 别名
  if (typeof raw === 'string' && raw.trim()) {
    const compact = raw.trim().replace(/[\s_-]+/g, '').toLowerCase();
    for (const k of MIDSCENE_ACTION_KINDS) {
      if (k.toLowerCase() === compact) return k;
    }
    const aliases: Record<string, MidsceneActionKind> = {
      click: 'Tap',
      tap: 'Tap',
      doubletap: 'DoubleClick',
      longtap: 'LongPress',
      type: 'Input',
      text: 'Input',
      back: 'AndroidBackButton',
      home: 'AndroidHomeButton',
    };
    if (aliases[compact]) return aliases[compact];
  }
  return inferMidsceneActionKind(command);
}
