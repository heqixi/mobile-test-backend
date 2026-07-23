/**
 * Space 级摘要：读写 space.json.summary。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  GoalSpaceGraph,
  GoalSpaceSpaceSummary,
  GoalSpaceSpaceSummarySource,
  PutGoalSpaceSpaceSummaryInput,
} from '@mtp/domain-goal-space';
import { GoalSpaceDomainError } from '@mtp/domain-goal-space';
import { spaceDir } from '../paths.js';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function spaceMetaPath(spaceId: string): string {
  return join(spaceDir(spaceId), 'space.json');
}

function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeSpaceSummary(
  input: PutGoalSpaceSpaceSummaryInput & {
    source?: GoalSpaceSpaceSummarySource;
    updatedAt?: string;
  },
  previous?: GoalSpaceSpaceSummary | null,
): GoalSpaceSpaceSummary {
  const overview = String(input.overview ?? '').trim();
  const keywords = [
    ...new Set(
      (input.keywords ?? [])
        .map((k) => String(k).trim())
        .filter((k) => k.length > 0),
    ),
  ].slice(0, 64);
  const flows = (input.flows ?? [])
    .map((f) => String(f).trim())
    .filter((f) => f.length > 0)
    .slice(0, 8);
  const seedKeywords = (input.seedKeywords ?? previous?.seedKeywords ?? [])
    .map((k) => String(k).trim())
    .filter((k) => k.length > 0)
    .slice(0, 64);

  let source: GoalSpaceSpaceSummarySource =
    input.source ?? previous?.source ?? 'human';
  if (
    previous?.source === 'llm' &&
    (input.source === 'human' || input.source == null)
  ) {
    source = 'mixed';
  }

  return {
    overview,
    keywords,
    ...(flows.length > 0 ? { flows } : {}),
    source,
    updatedAt: input.updatedAt ?? nowIso(),
    ...(seedKeywords.length > 0 ? { seedKeywords } : {}),
  };
}

function readSpaceMeta(spaceId: string): Record<string, unknown> {
  const metaPath = spaceMetaPath(spaceId);
  if (!existsSync(metaPath)) {
    throw new GoalSpaceDomainError(
      'SPACE_NOT_FOUND',
      `space not found: ${spaceId}`,
    );
  }
  return readJson<Record<string, unknown>>(metaPath);
}

export function readSpaceSummary(
  spaceId: string,
): GoalSpaceSpaceSummary | null {
  const meta = readSpaceMeta(spaceId);
  const s = meta.summary;
  if (!s || typeof s !== 'object') return null;
  return s as GoalSpaceSpaceSummary;
}

export function writeSpaceSummary(
  spaceId: string,
  summary: GoalSpaceSpaceSummary,
): GoalSpaceSpaceSummary {
  const metaPath = spaceMetaPath(spaceId);
  const meta = readSpaceMeta(spaceId);
  meta.summary = summary;
  mkdirSync(spaceDir(spaceId), { recursive: true });
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  return summary;
}

export function putSpaceSummary(
  spaceId: string,
  input: PutGoalSpaceSpaceSummaryInput,
): GoalSpaceSpaceSummary {
  const previous = readSpaceSummary(spaceId);
  const summary = normalizeSpaceSummary(
    {
      ...input,
      source: input.source ?? 'human',
    },
    previous,
  );
  return writeSpaceSummary(spaceId, summary);
}

/** 压缩 graph，供 LLM 生成（无截图/路径） */
export function compactGraphForSummary(graph: GoalSpaceGraph): {
  spaceId: string;
  version: string;
  keyframes: Array<{
    id: string;
    screenName: string;
    caption: string;
    tags?: string[];
    widgets?: string[];
  }>;
  transitions: Array<{
    from: string;
    to: string;
    action: string;
  }>;
} {
  const nameById = new Map(
    graph.keyframes.map((k) => [k.keyframeId, k.screenName]),
  );
  return {
    spaceId: graph.ref.spaceId,
    version: graph.ref.version,
    keyframes: graph.keyframes.map((kf) => ({
      id: kf.keyframeId,
      screenName: kf.screenName,
      caption: (kf.caption ?? '').slice(0, 200),
      ...(kf.tags?.length ? { tags: kf.tags.slice(0, 12) } : {}),
      ...(kf.widgets?.length
        ? {
            widgets: kf.widgets
              .map((w) => w.name)
              .filter(Boolean)
              .slice(0, 16),
          }
        : {}),
    })),
    transitions: graph.transitions.map((t) => ({
      from: nameById.get(t.fromKeyframeId) ?? t.fromKeyframeId,
      to: nameById.get(t.toKeyframeId) ?? t.toKeyframeId,
      action: (t.action ?? '').slice(0, 120),
    })),
  };
}

/** 从 graph 自动抽取种子关键词（Top N） */
export function collectSeedKeywordsFromGraph(
  graph: GoalSpaceGraph,
  max = 40,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (raw: string | undefined) => {
    const s = (raw ?? '').trim();
    if (!s || s.length > 40) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };
  for (const kf of graph.keyframes) {
    push(kf.screenName);
    for (const t of kf.tags ?? []) push(t);
    for (const w of kf.widgets ?? []) push(w.name);
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}
