/**
 * OpenAI-compatible 视觉屏身份终审（复用 Midscene 的 BASE_URL / API_KEY / MODEL）。
 *
 * 将 query + Top-K 候选截图发给 VL，要求 JSON：
 * { verdict, matchedKeyframeId?, confidence?, reason?, elements? }
 */

import type {
  ScreenIdentityJudgeInput,
  ScreenIdentityJudgeResult,
  ScreenIdentityPort,
  ScreenIdentityVerdict,
} from '@mtp/domain-goal-space';
import { createHeuristicScreenIdentityPort } from './heuristic-screen-identity.js';
import { parseKeyframeLabelPayload } from './openai-keyframe-label.js';

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

function toDataUrl(base64: string, mimeType?: string): string {
  const trimmed = base64.trim();
  if (/^data:/i.test(trimmed)) return trimmed;
  const mime = mimeType ?? 'image/png';
  return `data:${mime};base64,${trimmed}`;
}

function extractJsonObject(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const raw = fence?.[1]?.trim() ?? text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('no JSON object in model response');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeVerdict(v: unknown): ScreenIdentityVerdict {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]/g, '_');
  if (s === 'same_screen' || s === 'same' || s === 'match') {
    return 'same_screen';
  }
  if (
    s === 'different_screen' ||
    s === 'different' ||
    s === 'diff' ||
    s === 'new_screen'
  ) {
    return 'different_screen';
  }
  return 'uncertain';
}

function buildPrompt(input: ScreenIdentityJudgeInput): string {
  const locale = input.context?.locale ?? 'zh-CN';
  const action = input.context?.actionText?.trim() || '（无）';
  const fromName = input.context?.fromScreenName?.trim() || '（未知）';
  const fromId = input.context?.fromKeyframeId ?? '';
  const max = input.options?.maxCandidates ?? 3;
  const cands = input.candidates.slice(0, max);

  const candLines = cands
    .map((c, i) => {
      const score =
        typeof c.score === 'number' ? ` visualScore=${c.score.toFixed(3)}` : '';
      return `- 候选${i + 1}: keyframeId=${c.keyframeId} screenName=${JSON.stringify(c.screenName)}${score}`;
    })
    .join('\n');

  return [
    '你是移动 App UI 屏身份裁判。比较「当前截图」与若干「已有关键帧截图」，判断是否为同一语义页面。',
    '忽略状态栏时间/电量/通知小变化；关注：标题区、主内容结构、底部栏/输入框/Tab、主 CTA、是否相机取景等。',
    `语言: ${locale}`,
    `用户刚执行的操作: ${JSON.stringify(action)}`,
    `操作前关键帧: ${fromName} (${fromId})`,
    '',
    '候选关键帧：',
    candLines,
    '',
    '图片顺序：第 1 张=当前截图；随后按候选 1…N。',
    '',
    '只输出一个 JSON 对象，不要 markdown，字段：',
    '{',
    '  "verdict": "same_screen" | "different_screen" | "uncertain",',
    '  "matchedKeyframeId": "当 verdict=same_screen 时填候选 keyframeId",',
    '  "confidence": 0到1的数字,',
    '  "reason": "一句话中文理由",',
    '  "elements": {',
    '    "title": "顶栏/标题观察",',
    '    "primaryRegion": "主内容区观察",',
    '    "bottomBar": "底部栏/输入/Tab 观察"',
    '  },',
    '  "label": {',
    '    "screenName": "仅 different_screen 时必填：2～12字业务屏名",',
    '    "notes": [',
    '      { "kind": "caption"|"hint"|"risk"|"alias"|"other", "body": "词条" }',
    '    ]',
    '  }',
    '}',
    '',
    '规则：',
    '- 若当前屏与某候选是同一业务页面（即使有动画残余/键盘/toast），verdict=same_screen 并给出 matchedKeyframeId；不必填 label。',
    '- 若明显是新页面，verdict=different_screen，并填写 label（用于自动生长关键帧）。',
    '- label.screenName：按截图主内容命名（如「WPS AI 对话」），禁止复述整句操作指令。',
    '- label.notes：1～3 条具体说明；禁止「经由操作到达」「来自某某屏」模板句。',
    '- 操作语义为「进入/打开/跳转」且主内容区已变（如首页→AI 对话/搜索），即使顶栏品牌相似，也判 different_screen。',
    '- 两可则 uncertain，勿猜测。',
  ].join('\n');
}

export type OpenAiScreenIdentityOptions = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export function createOpenAiScreenIdentityPort(
  options: OpenAiScreenIdentityOptions = {},
): ScreenIdentityPort {
  const baseUrl = (
    options.baseUrl ??
    (env('MIDSCENE_MODEL_BASE_URL') || env('OPENAI_BASE_URL'))
  ).replace(/\/$/, '');
  const apiKey =
    options.apiKey ??
    (env('MIDSCENE_MODEL_API_KEY') || env('OPENAI_API_KEY'));
  const model =
    options.model ??
    (env('MIDSCENE_MODEL_NAME') || env('OPENAI_MODEL') || '');
  const timeoutMs = options.timeoutMs ?? 20_000;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!baseUrl || !model) {
    throw new Error(
      'OpenAI screen identity requires MIDSCENE_MODEL_BASE_URL and MIDSCENE_MODEL_NAME',
    );
  }

  return {
    async judge(input): Promise<ScreenIdentityJudgeResult> {
      const max = input.options?.maxCandidates ?? 3;
      const cands = input.candidates.slice(0, max);
      const content: Array<Record<string, unknown>> = [
        { type: 'text', text: buildPrompt({ ...input, candidates: cands }) },
        {
          type: 'image_url',
          image_url: {
            url: toDataUrl(input.query.base64, input.query.mimeType),
          },
        },
      ];
      for (const c of cands) {
        content.push({
          type: 'image_url',
          image_url: {
            url: toDataUrl(c.screenshot.base64, c.screenshot.mimeType),
          },
        });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            model,
            temperature: 0,
            messages: [{ role: 'user', content }],
          }),
          signal: controller.signal,
        });
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`VL HTTP ${res.status}: ${text.slice(0, 400)}`);
        }
        const body = JSON.parse(text) as {
          choices?: Array<{ message?: { content?: string | unknown } }>;
        };
        const rawContent = body.choices?.[0]?.message?.content;
        const rawText =
          typeof rawContent === 'string'
            ? rawContent
            : Array.isArray(rawContent)
              ? rawContent
                  .map((p) =>
                    typeof p === 'object' && p && 'text' in p
                      ? String((p as { text?: string }).text ?? '')
                      : '',
                  )
                  .join('\n')
              : String(rawContent ?? '');

        const parsed = extractJsonObject(rawText) as Record<string, unknown>;
        const verdict = normalizeVerdict(parsed.verdict);
        let matchedKeyframeId =
          typeof parsed.matchedKeyframeId === 'string'
            ? parsed.matchedKeyframeId
            : undefined;
        if (
          verdict === 'same_screen' &&
          matchedKeyframeId &&
          !cands.some((c) => c.keyframeId === matchedKeyframeId)
        ) {
          matchedKeyframeId = cands[0]?.keyframeId;
        }
        if (verdict === 'same_screen' && !matchedKeyframeId) {
          matchedKeyframeId = cands[0]?.keyframeId;
        }

        const elements =
          parsed.elements && typeof parsed.elements === 'object'
            ? (parsed.elements as ScreenIdentityJudgeResult['elements'])
            : undefined;

        let label: ScreenIdentityJudgeResult['label'];
        if (
          verdict === 'different_screen' &&
          parsed.label &&
          typeof parsed.label === 'object'
        ) {
          const labeled = parseKeyframeLabelPayload(
            parsed.label as Record<string, unknown>,
            4,
          );
          if (labeled.screenName || labeled.notes.length > 0) {
            label = {
              screenName: labeled.screenName || '未命名屏',
              notes: labeled.notes,
            };
          }
        }

        return {
          verdict,
          matchedKeyframeId,
          confidence:
            typeof parsed.confidence === 'number'
              ? parsed.confidence
              : undefined,
          reason:
            typeof parsed.reason === 'string' ? parsed.reason : undefined,
          elements,
          label,
          diagnostics: { impl: 'openai-compatible', model },
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** 有 Midscene VL 配置则用 OpenAI 适配器，否则启发式 */
export function createScreenIdentityPortFromEnv(): ScreenIdentityPort {
  const mode = (env('GOAL_SPACE_SCREEN_IDENTITY') || 'auto').toLowerCase();
  const hasVl =
    Boolean(env('MIDSCENE_MODEL_BASE_URL') || env('OPENAI_BASE_URL')) &&
    Boolean(env('MIDSCENE_MODEL_NAME') || env('OPENAI_MODEL'));

  if (mode === 'heuristic' || mode === 'off') {
    return createHeuristicScreenIdentityPort();
  }
  if (mode === 'openai' || (mode === 'auto' && hasVl)) {
    try {
      return createOpenAiScreenIdentityPort();
    } catch {
      return createHeuristicScreenIdentityPort();
    }
  }
  return createHeuristicScreenIdentityPort();
}
