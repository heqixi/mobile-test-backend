/**
 * OpenAI-compatible VL 关键帧标注：根据截图生成屏名 + 备注词条。
 * 复用 Midscene MIDSCENE_MODEL_*。
 */

import type {
  KeyframeLabelNoteDraft,
  KeyframeLabelPort,
  KeyframeLabelResult,
  KeyframeNoteKind,
} from '@mtp/domain-goal-space';
import { createHeuristicKeyframeLabelPort } from './heuristic-keyframe-label.js';

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

function toDataUrl(base64: string, mimeType?: string): string {
  const trimmed = base64.trim();
  if (/^data:/i.test(trimmed)) return trimmed;
  return `data:${mimeType ?? 'image/png'};base64,${trimmed}`;
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

const NOTE_KINDS = new Set<KeyframeNoteKind>([
  'caption',
  'hint',
  'risk',
  'alias',
  'other',
]);

export function parseKeyframeLabelPayload(
  parsed: Record<string, unknown>,
  maxNotes = 4,
): KeyframeLabelResult {
  const screenName = String(parsed.screenName ?? parsed.name ?? '')
    .trim()
    .slice(0, 24);
  const rawNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
  const notes: KeyframeLabelNoteDraft[] = [];
  for (const item of rawNotes) {
    if (!item || typeof item !== 'object') continue;
    const n = item as Record<string, unknown>;
    const body = String(n.body ?? n.text ?? '').trim();
    if (!body) continue;
    const kindRaw = String(n.kind ?? 'hint').toLowerCase();
    const kind = (NOTE_KINDS.has(kindRaw as KeyframeNoteKind)
      ? kindRaw
      : 'hint') as KeyframeNoteKind;
    notes.push({
      kind,
      title: typeof n.title === 'string' ? n.title.trim() : undefined,
      body: body.slice(0, 200),
      confidence:
        typeof n.confidence === 'number' ? n.confidence : undefined,
    });
    if (notes.length >= maxNotes) break;
  }
  return {
    screenName: screenName || '未命名屏',
    notes,
    diagnostics: { impl: 'openai-compatible' },
  };
}

function buildLabelPrompt(args: {
  actionText?: string;
  fromScreenName?: string;
  locale?: string;
  maxNotes: number;
}): string {
  const locale = args.locale ?? 'zh-CN';
  const action = args.actionText?.trim() || '（无）';
  const fromName = args.fromScreenName?.trim() || '（未知）';
  return [
    '你是移动 App 关键帧标注助手。根据「当前截图」为新关键帧起名并写备注词条。',
    `语言: ${locale}`,
    `到达本屏的操作: ${JSON.stringify(action)}`,
    `上一屏名称: ${JSON.stringify(fromName)}`,
    '',
    '观察截图中的：顶栏标题、主内容区（列表/对话/相机/表单等）、底部栏/输入框/Tab、主按钮文案。',
    '',
    '只输出一个 JSON 对象，不要 markdown：',
    '{',
    '  "screenName": "短屏名",',
    '  "notes": [',
    '    { "kind": "caption"|"hint"|"risk"|"alias"|"other", "body": "词条正文" }',
    '  ]',
    '}',
    '',
    'screenName 规则：',
    '- 2～12 个汉字（或等价短英文），描述本屏业务身份，如「WPS AI 对话」「文档首页」「拍照取景」。',
    '- 禁止把整句操作指令当作屏名（不要「点击底部输入框进入…」这种）。',
    '- 优先用界面上可见的标题/品牌+功能，而不是操作过程。',
    '',
    'notes 规则：',
    `- 1～${args.maxNotes} 条；每条 body 一句话，具体、可执行。`,
    '- caption：本屏是什么、主要用途。',
    '- hint：关键入口/控件提示（如「底部输入框可唤起 AI」）。',
    '- risk：易误触或需注意点（可选）。',
    '- 不要写「经由操作到达」「来自某某屏」这类空洞模板句。',
  ].join('\n');
}

export type OpenAiKeyframeLabelOptions = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export function createOpenAiKeyframeLabelPort(
  options: OpenAiKeyframeLabelOptions = {},
): KeyframeLabelPort {
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
  const timeoutMs = options.timeoutMs ?? 45_000;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!baseUrl || !model) {
    throw new Error(
      'OpenAI keyframe label requires MIDSCENE_MODEL_BASE_URL and MIDSCENE_MODEL_NAME',
    );
  }

  return {
    async label(input): Promise<KeyframeLabelResult> {
      const maxNotes = input.options?.maxNotes ?? 4;
      const content: Array<Record<string, unknown>> = [
        {
          type: 'text',
          text: buildLabelPrompt({
            actionText: input.context?.actionText,
            fromScreenName: input.context?.fromScreenName,
            locale: input.context?.locale,
            maxNotes,
          }),
        },
        {
          type: 'image_url',
          image_url: {
            url: toDataUrl(input.screenshot.base64, input.screenshot.mimeType),
          },
        },
      ];

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
            temperature: 0.2,
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
        const result = parseKeyframeLabelPayload(parsed, maxNotes);
        result.diagnostics = { impl: 'openai-compatible', model };
        return result;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createKeyframeLabelPortFromEnv(): KeyframeLabelPort {
  const mode = (env('GOAL_SPACE_KEYFRAME_LABEL') || 'auto').toLowerCase();
  const hasVl =
    Boolean(env('MIDSCENE_MODEL_BASE_URL') || env('OPENAI_BASE_URL')) &&
    Boolean(env('MIDSCENE_MODEL_NAME') || env('OPENAI_MODEL'));

  if (mode === 'heuristic') {
    return createHeuristicKeyframeLabelPort();
  }
  if (mode === 'openai' || (mode === 'auto' && hasVl)) {
    try {
      return createOpenAiKeyframeLabelPort();
    } catch {
      return createHeuristicKeyframeLabelPort();
    }
  }
  return createHeuristicKeyframeLabelPort();
}
