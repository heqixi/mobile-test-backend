/**
 * 启发式关键帧标注（无外部 LLM 时可用；测试默认）。
 * 屏名：从 actionText 推断；备注：写入一条 hint。
 */

import type {
  KeyframeLabelPort,
  KeyframeLabelResult,
} from '@mtp/domain-goal-space';

function inferScreenName(actionText?: string, fromScreenName?: string): string {
  const a = (actionText ?? '').trim();
  if (!a) return '未命名屏';
  // 「点击底部输入框」→「底部输入框相关屏」类短名
  const cleaned = a
    .replace(/^(点击|轻触|打开|进入|滑动|长按)\s*/u, '')
    .replace(/[。.!！？?]+$/u, '')
    .trim();
  if (cleaned.length >= 2 && cleaned.length <= 16) {
    return cleaned.includes('屏') ? cleaned : `${cleaned}`;
  }
  if (fromScreenName?.trim()) return `${fromScreenName.trim()}·下一屏`;
  return '未命名屏';
}

export function createHeuristicKeyframeLabelPort(): KeyframeLabelPort {
  return {
    async label(input): Promise<KeyframeLabelResult> {
      const maxNotes = input.options?.maxNotes ?? 4;
      const suggestName = input.options?.suggestScreenName !== false;
      const actionText = input.context?.actionText;
      const fromScreenName = input.context?.fromScreenName;
      const existing = new Set(
        (input.context?.existingNoteBodies ?? []).map((s) => s.trim()),
      );

      const screenName = suggestName
        ? inferScreenName(actionText, fromScreenName)
        : '未命名屏';

      const drafts: KeyframeLabelResult['notes'] = [];
      if (actionText?.trim()) {
        const body = `经由操作「${actionText.trim()}」到达`;
        if (!existing.has(body)) {
          drafts.push({ kind: 'hint', body, confidence: 0.6 });
        }
      }
      if (fromScreenName?.trim()) {
        const body = `来自「${fromScreenName.trim()}」`;
        if (!existing.has(body) && drafts.length < maxNotes) {
          drafts.push({ kind: 'caption', body, confidence: 0.5 });
        }
      }

      return {
        screenName,
        notes: drafts.slice(0, maxNotes),
        diagnostics: { impl: 'heuristic' },
      };
    },
  };
}
