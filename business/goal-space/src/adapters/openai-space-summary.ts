/**
 * OpenAI-compatible：压缩 graph JSON + 种子关键词 → Space summary。
 */

import type {
  GenerateGoalSpaceSpaceSummaryInput,
  GoalSpaceGraph,
  GoalSpaceSpaceSummary,
} from '@mtp/domain-goal-space';
import { GoalSpaceDomainError } from '@mtp/domain-goal-space';
import {
  collectSeedKeywordsFromGraph,
  compactGraphForSummary,
  normalizeSpaceSummary,
} from './file-space-summary.js';

function env(name: string): string {
  return (process.env[name] ?? '').trim();
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

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export function parseSpaceSummaryPayload(
  parsed: Record<string, unknown>,
  seedKeywords: string[],
): GoalSpaceSpaceSummary {
  return normalizeSpaceSummary({
    overview: String(parsed.overview ?? parsed.summary ?? '').trim(),
    keywords: asStringArray(parsed.keywords),
    flows: asStringArray(parsed.flows),
    seedKeywords,
    source: 'llm',
  });
}

function buildPrompt(args: {
  compactJson: string;
  seedKeywords: string[];
  extraHints?: string;
}): string {
  return [
    '你是移动 App 目标状态空间（Goal Space）的摘要助手。',
    '根据给定的状态图 JSON 与种子关键词，写一份短摘要，供人工阅读与编辑。',
    '不要复述整张图；突出业务域、主路径、关键入口。',
    '',
    '种子关键词（可增补、去噪）：',
    JSON.stringify(args.seedKeywords),
    args.extraHints?.trim()
      ? `额外提示：${args.extraHints.trim()}`
      : '',
    '',
    '状态图（已压缩，无截图）：',
    args.compactJson,
    '',
    '只输出一个 JSON 对象，不要 markdown：',
    '{',
    '  "overview": "2～5 句中文概述",',
    '  "keywords": ["关键词1", "关键词2"],',
    '  "flows": ["从A到B：…"]',
    '}',
    '',
    '规则：',
    '- overview：说明 App/业务域、覆盖哪些主流程、关键入口屏。',
    '- keywords：8～24 个；含产品名、功能名、屏名别名；短词优先。',
    '- flows：0～5 条；一句说清路径；可省略。',
    '- 禁止编造图中不存在的屏或入口。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export type SpaceSummaryLlmOptions = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export async function generateSpaceSummaryWithLlm(
  graph: GoalSpaceGraph,
  input: GenerateGoalSpaceSpaceSummaryInput = {},
  options: SpaceSummaryLlmOptions = {},
): Promise<GoalSpaceSpaceSummary> {
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
  const timeoutMs = options.timeoutMs ?? 90_000;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!baseUrl || !model) {
    throw new GoalSpaceDomainError(
      'INVALID',
      'Space summary LLM requires MIDSCENE_MODEL_BASE_URL and MIDSCENE_MODEL_NAME (or OPENAI_*)',
    );
  }

  const autoSeeds = collectSeedKeywordsFromGraph(graph);
  const userSeeds = (input.seedKeywords ?? [])
    .map((k) => String(k).trim())
    .filter(Boolean);
  const seedKeywords = [
    ...new Set([...userSeeds, ...autoSeeds]),
  ].slice(0, 48);

  const compact = compactGraphForSummary(graph);
  const compactJson = JSON.stringify(compact);

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
        messages: [
          {
            role: 'user',
            content: buildPrompt({
              compactJson,
              seedKeywords,
              extraHints: input.extraHints,
            }),
          },
        ],
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new GoalSpaceDomainError(
        'RETRIEVE_FAILED',
        `Space summary LLM HTTP ${res.status}: ${text.slice(0, 400)}`,
      );
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
    const summary = parseSpaceSummaryPayload(parsed, seedKeywords);
    if (!summary.overview.trim()) {
      throw new GoalSpaceDomainError(
        'INVALID',
        'LLM returned empty overview for space summary',
      );
    }
    return summary;
  } finally {
    clearTimeout(timer);
  }
}
