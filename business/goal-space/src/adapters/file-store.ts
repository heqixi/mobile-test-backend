import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type {
  GoalSpaceGraph,
  GoalSpaceRef,
  GoalSpaceStorePort,
  GoalSpaceSummary,
  GoalSpaceVersionBundle,
  GoalSpaceVersionMeta,
  Keyframe,
  KeyframeId,
  OpenCodePackManifest,
  Transition,
  GoalSpaceSpaceSummary,
} from '@mtp/domain-goal-space';
import { GoalSpaceDomainError } from '@mtp/domain-goal-space';
import { goalSpaceDataDir, spaceDir, versionDir } from '../paths.js';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function latestFile(spaceId: string): string {
  return join(spaceDir(spaceId), 'latest');
}

export function createFileGoalSpaceStorePort(): GoalSpaceStorePort {
  return {
    async listSpaces() {
      const root = goalSpaceDataDir();
      if (!existsSync(root)) return [];
      const out: GoalSpaceSummary[] = [];
      for (const spaceId of readdirSync(root)) {
        const metaPath = join(spaceDir(spaceId), 'space.json');
        if (!existsSync(metaPath)) continue;
        const meta = readJson<{
          spaceId: string;
          displayName?: string;
          description?: string;
          tags?: string[];
          summary?: GoalSpaceSpaceSummary;
        }>(metaPath);
        let latestVersion: string | undefined;
        const lp = latestFile(spaceId);
        if (existsSync(lp)) {
          latestVersion = readFileSync(lp, 'utf8').trim() || undefined;
        }
        out.push({
          spaceId: meta.spaceId ?? spaceId,
          displayName: meta.displayName ?? spaceId,
          description: meta.description,
          latestVersion,
          tags: meta.tags,
          summary: meta.summary,
        });
      }
      return out;
    },

    async listVersions(spaceId) {
      const versionsRoot = join(spaceDir(spaceId), 'versions');
      if (!existsSync(versionsRoot)) return [];
      const out: GoalSpaceVersionMeta[] = [];
      for (const version of readdirSync(versionsRoot)) {
        const manifestPath = join(versionsRoot, version, 'manifest.json');
        if (!existsSync(manifestPath)) continue;
        out.push(readJson<GoalSpaceVersionMeta>(manifestPath));
      }
      return out.sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      );
    },

    async resolveLatest(spaceId) {
      const lp = latestFile(spaceId);
      if (!existsSync(lp)) return null;
      const version = readFileSync(lp, 'utf8').trim();
      if (!version) return null;
      return { spaceId, version };
    },

    async getVersionMeta(ref) {
      const p = join(versionDir(ref.spaceId, ref.version), 'manifest.json');
      if (!existsSync(p)) {
        throw new GoalSpaceDomainError(
          'VERSION_NOT_FOUND',
          `version not found: ${ref.spaceId}@${ref.version}`,
        );
      }
      return readJson<GoalSpaceVersionMeta>(p);
    },

    async getGraph(ref) {
      const p = join(versionDir(ref.spaceId, ref.version), 'graph.json');
      if (!existsSync(p)) {
        throw new GoalSpaceDomainError(
          'VERSION_NOT_FOUND',
          `graph not found: ${ref.spaceId}@${ref.version}`,
        );
      }
      return readJson<GoalSpaceGraph>(p);
    },

    async getVersionBundle(ref) {
      const meta = await this.getVersionMeta(ref);
      const graph = await this.getGraph(ref);
      return { meta, graph } satisfies GoalSpaceVersionBundle;
    },

    async getKeyframe(ref, keyframeId: KeyframeId) {
      const graph = await this.getGraph(ref);
      const kf = graph.keyframes.find((k) => k.keyframeId === keyframeId);
      if (!kf) {
        throw new GoalSpaceDomainError(
          'KEYFRAME_NOT_FOUND',
          `keyframe not found: ${keyframeId}`,
        );
      }
      return kf;
    },

    async getOpenCodePackManifest(ref) {
      const base = versionDir(ref.spaceId, ref.version);
      const nodesDir = join(base, 'nodes');
      const kfDir = join(base, 'keyframes');
      const nodeMarkdownPaths = existsSync(nodesDir)
        ? readdirSync(nodesDir)
            .filter((f) => f.endsWith('.md'))
            .map((f) => join(nodesDir, f))
        : [];
      const keyframeImagePaths = existsSync(kfDir)
        ? readdirSync(kfDir)
            .filter((f) => f.endsWith('.png'))
            .map((f) => join(kfDir, f))
        : [];
      return {
        ref,
        overviewPath: join(spaceDir(ref.spaceId), 'OPENCODE.md'),
        graphPath: join(base, 'graph.json'),
        nodeMarkdownPaths,
        keyframeImagePaths,
      } satisfies OpenCodePackManifest;
    },
  };
}

export function resolveKeyframeImageAbsolutePath(
  spaceId: string,
  version: string,
  keyframe: Keyframe,
): string | null {
  const uri = keyframe.screenshot?.uri;
  if (!uri) return null;
  if (uri.startsWith('/') || /^[a-zA-Z]:\\/.test(uri)) return uri;
  return join(versionDir(spaceId, version), uri);
}

export function writePublishedVersion(input: {
  ref: GoalSpaceRef;
  meta: GoalSpaceVersionMeta;
  keyframes: Keyframe[];
  transitions: Transition[];
}): void {
  const { ref, meta, keyframes, transitions } = input;
  const base = versionDir(ref.spaceId, ref.version);
  mkdirSync(join(base, 'keyframes'), { recursive: true });
  mkdirSync(join(base, 'nodes'), { recursive: true });

  const publishedKeyframes: Keyframe[] = keyframes.map((kf) => {
    const destName = `${kf.keyframeId}.png`;
    const dest = join(base, 'keyframes', destName);
    if (kf.screenshot?.uri) {
      const from = join(spaceDir(ref.spaceId), kf.screenshot.uri);
      if (existsSync(from)) {
        copyFileSync(from, dest);
      }
    }
    return {
      ...kf,
      screenshot: {
        uri: `keyframes/${destName}`,
        kind: 'screenshot',
        mimeType: 'image/png',
      },
    };
  });

  const graph: GoalSpaceGraph = {
    ref,
    keyframes: publishedKeyframes,
    transitions,
  };
  writeFileSync(join(base, 'graph.json'), JSON.stringify(graph, null, 2) + '\n');
  writeFileSync(
    join(base, 'manifest.json'),
    JSON.stringify({ ...meta, ref }, null, 2) + '\n',
  );

  for (const kf of publishedKeyframes) {
    const outs = transitions
      .filter((t) => t.fromKeyframeId === kf.keyframeId)
      .map((t) => `- → \`${t.toKeyframeId}\`: ${t.action}`)
      .join('\n');
    const widgets = (kf.widgets ?? [])
      .map((w) => `- **${w.name}**${w.description ? `：${w.description}` : ''}`)
      .join('\n');
    const md = `# ${kf.screenName} (\`${kf.keyframeId}\`)

${kf.caption}

## Widgets
${widgets || '_none_'}

## Outgoing
${outs || '_none_'}
`;
    writeFileSync(join(base, 'nodes', `${kf.keyframeId}.md`), md, 'utf8');
  }

  writeFileSync(latestFile(ref.spaceId), `${ref.version}\n`, 'utf8');

  const overview = `# Goal Space \`${ref.spaceId}\`

Default version: \`${ref.version}\`

Keyframes: ${publishedKeyframes.length} · Transitions: ${transitions.length}

See \`versions/${ref.version}/graph.json\` and \`nodes/\`.
`;
  writeFileSync(join(spaceDir(ref.spaceId), 'OPENCODE.md'), overview, 'utf8');
}
