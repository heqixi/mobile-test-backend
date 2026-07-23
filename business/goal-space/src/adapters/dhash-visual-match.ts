import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import type {
  GoalSpaceIndexPort,
  GoalSpaceStorePort,
  RebuildGoalSpaceIndexInput,
  RebuildGoalSpaceIndexResult,
  VisualMatchPort,
  VisualMatchQuery,
  VisualMatchResult,
} from '@mtp/domain-goal-space';
import { versionDir } from '../paths.js';
import { resolveKeyframeImageAbsolutePath } from './file-store.js';

const DHASH_WIDTH = 9;
const DHASH_HEIGHT = 8;
/** 汉明距离阈值（64 bit）；≤ 即 accepted */
const DEFAULT_THRESHOLD = 10;

type VisualIndex = Record<string, string>; // keyframeId -> dhash hex

function visualIndexPath(spaceId: string, version: string): string {
  return join(versionDir(spaceId, version), 'visual-index.json');
}

function stripDataUrl(b64: string): Buffer {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(b64.trim());
  if (m) return Buffer.from(m[2]!, 'base64');
  return Buffer.from(b64, 'base64');
}

function decodePng(buf: Buffer): { width: number; height: number; data: Buffer } {
  const png = PNG.sync.read(buf);
  return { width: png.width, height: png.height, data: png.data as Buffer };
}

/** 灰度最近邻缩放到 w×h，返回长度 w*h 的亮度数组 */
function resizeGray(
  src: { width: number; height: number; data: Buffer },
  w: number,
  h: number,
): number[] {
  const out: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(src.width - 1, Math.floor((x / w) * src.width));
      const sy = Math.min(src.height - 1, Math.floor((y / h) * src.height));
      const i = (sy * src.width + sx) * 4;
      const r = src.data[i] ?? 0;
      const g = src.data[i + 1] ?? 0;
      const b = src.data[i + 2] ?? 0;
      out.push(0.299 * r + 0.587 * g + 0.114 * b);
    }
  }
  return out;
}

/** difference hash → 64-bit hex */
export function computeDHashHex(pngBuf: Buffer): string {
  const img = decodePng(pngBuf);
  const gray = resizeGray(img, DHASH_WIDTH, DHASH_HEIGHT);
  let bits = '';
  for (let y = 0; y < DHASH_HEIGHT; y++) {
    for (let x = 0; x < DHASH_WIDTH - 1; x++) {
      const left = gray[y * DHASH_WIDTH + x] ?? 0;
      const right = gray[y * DHASH_WIDTH + x + 1] ?? 0;
      bits += left > right ? '1' : '0';
    }
  }
  // bits length 64
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    hex += Number.parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

function hammingHex(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const x =
      Number.parseInt(a[i]!, 16) ^ Number.parseInt(b[i]!, 16);
    d += x.toString(2).replace(/0/g, '').length;
  }
  return d;
}

/** 对已构建的 dHash 索引做匹配（版本库与会话草稿共用）。 */
export function matchDHashAgainstIndex(
  queryPng: Buffer,
  index: VisualIndex,
  options?: { threshold?: number; maxCandidates?: number },
): VisualMatchResult {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  let queryHash: string;
  try {
    queryHash = computeDHashHex(queryPng);
  } catch {
    return {
      accepted: false,
      candidates: [],
      rejectReason: 'unavailable',
    };
  }

  if (Object.keys(index).length === 0) {
    return {
      accepted: false,
      candidates: [],
      rejectReason: 'unavailable',
    };
  }

  const scored = Object.entries(index).map(([id, hash]) => {
    const dist = hammingHex(queryHash, hash);
    return {
      id,
      score: 1 - dist / 64,
      dist,
    };
  });
  scored.sort((a, b) => a.dist - b.dist);
  const max = options?.maxCandidates ?? 5;
  const candidates = scored.slice(0, max).map((s, i) => ({
    id: s.id,
    score: s.score,
    rank: i + 1,
  }));

  if (candidates.length === 0) {
    return {
      accepted: false,
      candidates: [],
      rejectReason: 'unavailable',
    };
  }
  const bestDist = scored[0]!.dist;
  if (bestDist > threshold) {
    return {
      accepted: false,
      candidates,
      rejectReason: 'below_threshold',
    };
  }
  if (
    scored.length > 1 &&
    scored[1]!.dist <= threshold &&
    scored[1]!.dist - bestDist <= 2
  ) {
    return {
      accepted: false,
      candidates,
      rejectReason: 'ambiguous',
    };
  }
  return {
    accepted: true,
    candidates,
    currentKeyframeId: candidates[0]!.id,
  };
}

export function stripScreenshotBase64(b64: string): Buffer {
  return stripDataUrl(b64);
}

function loadIndex(spaceId: string, version: string): VisualIndex {
  const p = visualIndexPath(spaceId, version);
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, 'utf8')) as VisualIndex;
}

export function createDHashVisualMatchPort(
  store: GoalSpaceStorePort,
  options?: { threshold?: number },
): VisualMatchPort {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  return {
    async match(query: VisualMatchQuery): Promise<VisualMatchResult> {
      const { ref } = query;
      let queryBuf: Buffer;
      try {
        queryBuf = stripDataUrl(query.screenshot.base64);
      } catch {
        return {
          accepted: false,
          candidates: [],
          rejectReason: 'unavailable',
        };
      }

      let index = loadIndex(ref.spaceId, ref.version);
      if (Object.keys(index).length === 0) {
        // lazy build from graph images
        const graph = await store.getGraph(ref);
        index = {};
        for (const kf of graph.keyframes) {
          const abs = resolveKeyframeImageAbsolutePath(
            ref.spaceId,
            ref.version,
            kf,
          );
          if (!abs || !existsSync(abs)) continue;
          try {
            index[kf.keyframeId] = computeDHashHex(readFileSync(abs));
          } catch {
            /* skip */
          }
        }
      }

      return matchDHashAgainstIndex(queryBuf, index, {
        threshold,
        maxCandidates: query.maxCandidates,
      });
    },
  };
}

export function createFileGoalSpaceIndexPort(
  store: GoalSpaceStorePort,
): GoalSpaceIndexPort {
  return {
    async rebuild(
      input: RebuildGoalSpaceIndexInput,
    ): Promise<RebuildGoalSpaceIndexResult> {
      const rawKinds = input.kinds ?? ['text', 'visual'];
      const kinds: Array<'text' | 'visual'> = rawKinds.includes('all')
        ? ['text', 'visual']
        : rawKinds.filter((k): k is 'text' | 'visual' => k === 'text' || k === 'visual');
      const rebuilt: Array<'text' | 'visual'> = [];
      const details: Record<string, unknown> = {};

      if (kinds.includes('visual')) {
        const graph = await store.getGraph(input.ref);
        const index: VisualIndex = {};
        for (const kf of graph.keyframes) {
          const abs = resolveKeyframeImageAbsolutePath(
            input.ref.spaceId,
            input.ref.version,
            kf,
          );
          if (!abs || !existsSync(abs)) continue;
          try {
            index[kf.keyframeId] = computeDHashHex(readFileSync(abs));
          } catch {
            /* skip broken png */
          }
        }
        const p = visualIndexPath(input.ref.spaceId, input.ref.version);
        writeFileSync(p, JSON.stringify(index, null, 2) + '\n', 'utf8');
        rebuilt.push('visual');
        details.visualCount = Object.keys(index).length;
      }

      if (kinds.includes('text')) {
        // 词法检索直接读 graph；写一个占位标记表示「已就绪」
        const p = join(
          versionDir(input.ref.spaceId, input.ref.version),
          'text-index.json',
        );
        const graph = await store.getGraph(input.ref);
        writeFileSync(
          p,
          JSON.stringify(
            {
              kind: 'lexical-passthrough',
              keyframeCount: graph.keyframes.length,
              builtAt: new Date().toISOString(),
              contentSha256: createHash('sha256')
                .update(JSON.stringify(graph))
                .digest('hex')
                .slice(0, 16),
            },
            null,
            2,
          ) + '\n',
          'utf8',
        );
        rebuilt.push('text');
        details.textKeyframes = graph.keyframes.length;
      }

      return { ref: input.ref, rebuilt: [...rebuilt], details };
    },
  };
}
