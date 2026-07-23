import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type {
  AddKeyframeNoteInput,
  CaptureSession,
  CaptureSessionPort,
  CreateCaptureSessionInput,
  DraftKeyframe,
  DraftTransition,
  KeyframeId,
  KeyframeNote,
  MarkKeyframeInput,
  RecordTransitionInput,
  UpdateDraftKeyframeInput,
  UpdateDraftTransitionInput,
  UpdateKeyframeNoteInput,
} from '@mtp/domain-goal-space';
import {
  deriveCaptionFromNotes,
  GoalSpaceDomainError,
  normalizeKeyframeNotes,
} from '@mtp/domain-goal-space';
import { goalSpaceDataDir, sessionsDir, spaceDir } from '../paths.js';

function nowIso(): string {
  return new Date().toISOString();
}

function stripDataUrl(b64: string): Buffer {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(b64.trim());
  if (m) return Buffer.from(m[2]!, 'base64');
  return Buffer.from(b64, 'base64');
}

function sessionPath(spaceId: string, sessionId: string): string {
  return join(sessionsDir(spaceId), `${sessionId}.json`);
}

function ensureSpace(spaceId: string): void {
  mkdirSync(sessionsDir(spaceId), { recursive: true });
  const metaPath = join(spaceDir(spaceId), 'space.json');
  if (!existsSync(metaPath)) {
    mkdirSync(spaceDir(spaceId), { recursive: true });
    writeFileSync(
      metaPath,
      JSON.stringify(
        { spaceId, displayName: spaceId, createdAt: nowIso() },
        null,
        2,
      ) + '\n',
      'utf8',
    );
  }
}

function saveSession(session: CaptureSession): void {
  ensureSpace(session.spaceId);
  writeFileSync(
    sessionPath(session.spaceId, session.sessionId),
    JSON.stringify(session, null, 2) + '\n',
    'utf8',
  );
}

function hydrateSession(raw: CaptureSession): CaptureSession {
  const at = nowIso();
  return {
    ...raw,
    keyframes: (raw.keyframes ?? []).map((kf) => {
      const n = normalizeKeyframeNotes(
        { ...kf, notes: kf.notes ?? [], caption: kf.caption ?? '' },
        at,
      );
      // 持久化迁移：legacy-caption 换成真实 UUID
      const notes = n.notes.map((note) =>
        note.noteId === 'legacy-caption'
          ? { ...note, noteId: randomUUID() }
          : note,
      );
      return {
        ...n,
        notes,
        caption: deriveCaptionFromNotes(notes),
        widgets: kf.widgets ?? [],
      };
    }),
  };
}

function findSessionFile(sessionId: string): CaptureSession {
  const dataRoot = goalSpaceDataDir();
  if (!existsSync(dataRoot)) {
    throw new GoalSpaceDomainError(
      'SESSION_NOT_FOUND',
      `session not found: ${sessionId}`,
    );
  }
  for (const spaceId of readdirSync(dataRoot)) {
    const p = sessionPath(spaceId, sessionId);
    if (existsSync(p)) {
      const raw = JSON.parse(readFileSync(p, 'utf8')) as CaptureSession;
      const hydrated = hydrateSession(raw);
      // 若迁移了 notes，写回
      if (JSON.stringify(raw.keyframes) !== JSON.stringify(hydrated.keyframes)) {
        saveSession(hydrated);
      }
      return hydrated;
    }
  }
  throw new GoalSpaceDomainError(
    'SESSION_NOT_FOUND',
    `session not found: ${sessionId}`,
  );
}

function removeSessionArtifacts(spaceId: string, sessionId: string): void {
  const jsonPath = sessionPath(spaceId, sessionId);
  if (existsSync(jsonPath)) {
    unlinkSync(jsonPath);
  }
  const assets = join(sessionsDir(spaceId), sessionId);
  if (existsSync(assets)) {
    rmSync(assets, { recursive: true, force: true });
  }
}

function listSpaceIds(spaceId?: string): string[] {
  const dataRoot = goalSpaceDataDir();
  if (!existsSync(dataRoot)) return [];
  if (spaceId) {
    return existsSync(spaceDir(spaceId)) ? [spaceId] : [];
  }
  return readdirSync(dataRoot).filter((name) => {
    try {
      return statSync(join(dataRoot, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

/** 清除非 submitted 会话；submitted 永不删除。 */
export function purgeAbandonedSessionFiles(spaceId?: string): {
  purgedSessionIds: string[];
} {
  const purgedSessionIds: string[] = [];
  for (const sid of listSpaceIds(spaceId)) {
    const dir = sessionsDir(sid);
    if (!existsSync(dir)) continue;

    const submittedIds = new Set<string>();
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const full = join(dir, f);
      let raw: CaptureSession;
      try {
        raw = JSON.parse(readFileSync(full, 'utf8')) as CaptureSession;
      } catch {
        // 损坏的草稿 JSON 一并清掉
        const id = f.slice(0, -'.json'.length);
        removeSessionArtifacts(sid, id);
        purgedSessionIds.push(id);
        continue;
      }
      if (raw.status === 'submitted') {
        submittedIds.add(raw.sessionId || f.slice(0, -'.json'.length));
        continue;
      }
      const id = raw.sessionId || f.slice(0, -'.json'.length);
      removeSessionArtifacts(sid, id);
      purgedSessionIds.push(id);
    }

    // 无对应 JSON / 非 submitted 的孤儿截图目录
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (!statSync(full).isDirectory()) continue;
      if (submittedIds.has(name)) continue;
      if (existsSync(join(dir, `${name}.json`))) continue;
      rmSync(full, { recursive: true, force: true });
      if (!purgedSessionIds.includes(name)) purgedSessionIds.push(name);
    }
  }
  return { purgedSessionIds };
}

function requireOpen(session: CaptureSession, sessionId: string): void {
  if (session.status !== 'open') {
    throw new GoalSpaceDomainError(
      'SESSION_NOT_OPEN',
      `session ${sessionId} is ${session.status}`,
    );
  }
}

function findKeyframeIndex(session: CaptureSession, keyframeId: string): number {
  const idx = session.keyframes.findIndex((k) => k.keyframeId === keyframeId);
  if (idx < 0) {
    throw new GoalSpaceDomainError(
      'KEYFRAME_NOT_FOUND',
      `keyframe not found: ${keyframeId}`,
    );
  }
  return idx;
}

function syncCaptionFromNotes(kf: DraftKeyframe): void {
  kf.caption = deriveCaptionFromNotes(kf.notes ?? []);
}

export function createFileCaptureSessionPort(): CaptureSessionPort {
  return {
    async createSession(input: CreateCaptureSessionInput) {
      ensureSpace(input.spaceId);
      // 开启新草稿前清掉同 space 的 open/discarded，避免堆积；submitted 保留
      purgeAbandonedSessionFiles(input.spaceId);
      const session: CaptureSession = {
        sessionId: randomUUID(),
        spaceId: input.spaceId,
        status: 'open',
        displayName: input.displayName,
        deviceProfile: input.deviceProfile,
        appPackage: input.appPackage,
        keyframes: [],
        transitions: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      saveSession(session);
      return session;
    },

    async getSession(sessionId) {
      return findSessionFile(sessionId);
    },

    async listOpenSessions(spaceId) {
      const dataRoot = goalSpaceDataDir();
      if (!existsSync(dataRoot)) return [];
      const spaces = spaceId
        ? existsSync(spaceDir(spaceId))
          ? [spaceId]
          : []
        : readdirSync(dataRoot);
      const out: CaptureSession[] = [];
      for (const sid of spaces) {
        const dir = sessionsDir(sid);
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir)) {
          if (!f.endsWith('.json')) continue;
          const s = hydrateSession(
            JSON.parse(readFileSync(join(dir, f), 'utf8')) as CaptureSession,
          );
          if (s.status === 'open') out.push(s);
        }
      }
      return out;
    },

    async purgeAbandonedSessions(spaceId) {
      return purgeAbandonedSessionFiles(spaceId);
    },

    async markKeyframe(sessionId, input: MarkKeyframeInput) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const keyframeId = input.keyframeId?.trim() || randomUUID();
      const at = nowIso();
      let screenshot: DraftKeyframe['screenshot'];
      if (input.screenshotBase64?.trim()) {
        const data = stripDataUrl(input.screenshotBase64);
        const dir = join(
          sessionsDir(session.spaceId),
          session.sessionId,
          'keyframes',
        );
        mkdirSync(dir, { recursive: true });
        const file = `${keyframeId}.png`;
        writeFileSync(join(dir, file), data);
        screenshot = {
          uri: `sessions/${session.sessionId}/keyframes/${file}`,
          kind: 'screenshot',
          mimeType: 'image/png',
        };
      }

      let notes: KeyframeNote[] = input.notes ? [...input.notes] : [];
      const captionText = (input.caption ?? '').trim();
      if (notes.length === 0 && captionText) {
        notes = [
          {
            noteId: randomUUID(),
            kind: 'caption',
            body: captionText,
            source: 'human',
            createdAt: at,
            updatedAt: at,
          },
        ];
      }

      const draft: DraftKeyframe = {
        keyframeId,
        screenName: input.screenName.trim() || '未命名屏',
        caption: deriveCaptionFromNotes(notes) || captionText,
        notes,
        screenshot,
        widgets: input.widgets ?? [],
        tags: input.tags,
        appPackage: session.appPackage,
        createdAt: at,
        updatedAt: at,
      };
      session.keyframes = session.keyframes.filter(
        (k) => k.keyframeId !== keyframeId,
      );
      session.keyframes.push(draft);
      if (input.setAsCursor !== false) {
        session.cursorKeyframeId = keyframeId;
      }
      session.updatedAt = at;
      saveSession(session);
      return draft;
    },

    async updateKeyframe(
      sessionId,
      keyframeId: KeyframeId,
      patch: UpdateDraftKeyframeInput,
    ) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const idx = findKeyframeIndex(session, keyframeId);
      const cur = session.keyframes[idx]!;
      const at = nowIso();
      if (patch.screenshotBase64?.trim()) {
        const data = stripDataUrl(patch.screenshotBase64);
        const dir = join(
          sessionsDir(session.spaceId),
          session.sessionId,
          'keyframes',
        );
        mkdirSync(dir, { recursive: true });
        const file = `${keyframeId}.png`;
        writeFileSync(join(dir, file), data);
        cur.screenshot = {
          uri: `sessions/${session.sessionId}/keyframes/${file}`,
          kind: 'screenshot',
          mimeType: 'image/png',
        };
      }
      if (patch.screenName != null) cur.screenName = patch.screenName.trim();
      if (patch.notes != null) {
        cur.notes = patch.notes;
        syncCaptionFromNotes(cur);
      } else if (patch.caption != null) {
        const body = patch.caption.trim();
        const capIdx = cur.notes.findIndex((n) => n.kind === 'caption');
        if (capIdx >= 0) {
          cur.notes[capIdx] = {
            ...cur.notes[capIdx]!,
            body,
            updatedAt: at,
          };
        } else if (body) {
          cur.notes.push({
            noteId: randomUUID(),
            kind: 'caption',
            body,
            source: 'human',
            createdAt: at,
            updatedAt: at,
          });
        }
        syncCaptionFromNotes(cur);
      }
      if (patch.widgets != null) cur.widgets = patch.widgets;
      if (patch.tags != null) cur.tags = patch.tags;
      cur.updatedAt = at;
      session.keyframes[idx] = cur;
      session.updatedAt = at;
      saveSession(session);
      return cur;
    },

    async deleteKeyframe(sessionId, keyframeId: KeyframeId) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const idx = findKeyframeIndex(session, keyframeId);
      const removed = session.keyframes[idx]!;
      session.keyframes.splice(idx, 1);
      session.transitions = session.transitions.filter(
        (t) =>
          t.fromKeyframeId !== keyframeId && t.toKeyframeId !== keyframeId,
      );
      if (session.cursorKeyframeId === keyframeId) {
        session.cursorKeyframeId =
          session.keyframes[session.keyframes.length - 1]?.keyframeId;
      }
      if (removed.screenshot?.uri) {
        const abs = join(spaceDir(session.spaceId), removed.screenshot.uri);
        if (existsSync(abs)) {
          try {
            unlinkSync(abs);
          } catch {
            /* ignore */
          }
        }
      }
      session.updatedAt = nowIso();
      saveSession(session);
      return session;
    },

    async addNote(sessionId, keyframeId, input: AddKeyframeNoteInput) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const idx = findKeyframeIndex(session, keyframeId);
      const cur = session.keyframes[idx]!;
      const at = nowIso();
      const note: KeyframeNote = {
        noteId: input.noteId?.trim() || randomUUID(),
        kind: input.kind ?? 'caption',
        title: input.title,
        body: input.body.trim(),
        source: input.source ?? 'human',
        confidence: input.confidence,
        tags: input.tags,
        createdAt: at,
        updatedAt: at,
      };
      if (!note.body) {
        throw new GoalSpaceDomainError('INVALID', 'note body required');
      }
      cur.notes = [...(cur.notes ?? []), note];
      syncCaptionFromNotes(cur);
      cur.updatedAt = at;
      session.keyframes[idx] = cur;
      session.updatedAt = at;
      saveSession(session);
      return note;
    },

    async updateNote(
      sessionId,
      keyframeId,
      noteId,
      patch: UpdateKeyframeNoteInput,
    ) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const idx = findKeyframeIndex(session, keyframeId);
      const cur = session.keyframes[idx]!;
      const nIdx = cur.notes.findIndex((n) => n.noteId === noteId);
      if (nIdx < 0) {
        throw new GoalSpaceDomainError(
          'NOTE_NOT_FOUND',
          `note not found: ${noteId}`,
        );
      }
      const note = { ...cur.notes[nIdx]! };
      const at = nowIso();
      if (patch.kind != null) note.kind = patch.kind;
      if (patch.title !== undefined) {
        note.title = patch.title === null ? undefined : patch.title;
      }
      if (patch.body != null) note.body = patch.body.trim();
      if (patch.tags !== undefined) note.tags = patch.tags;
      note.updatedAt = at;
      cur.notes[nIdx] = note;
      syncCaptionFromNotes(cur);
      cur.updatedAt = at;
      session.keyframes[idx] = cur;
      session.updatedAt = at;
      saveSession(session);
      return note;
    },

    async removeNote(sessionId, keyframeId, noteId) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const idx = findKeyframeIndex(session, keyframeId);
      const cur = session.keyframes[idx]!;
      const before = cur.notes.length;
      cur.notes = cur.notes.filter((n) => n.noteId !== noteId);
      if (cur.notes.length === before) {
        throw new GoalSpaceDomainError(
          'NOTE_NOT_FOUND',
          `note not found: ${noteId}`,
        );
      }
      syncCaptionFromNotes(cur);
      cur.updatedAt = nowIso();
      session.keyframes[idx] = cur;
      session.updatedAt = cur.updatedAt;
      saveSession(session);
    },

    async recordTransition(sessionId, input: RecordTransitionInput) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const fromOk = session.keyframes.some(
        (k) => k.keyframeId === input.fromKeyframeId,
      );
      const toOk = session.keyframes.some(
        (k) => k.keyframeId === input.toKeyframeId,
      );
      if (!fromOk || !toOk) {
        throw new GoalSpaceDomainError(
          'KEYFRAME_NOT_FOUND',
          'from/to keyframe missing in session',
        );
      }
      const existing = session.transitions.find(
        (t) =>
          t.fromKeyframeId === input.fromKeyframeId &&
          t.toKeyframeId === input.toKeyframeId,
      );
      if (existing) {
        session.cursorKeyframeId = input.toKeyframeId;
        session.updatedAt = nowIso();
        saveSession(session);
        return existing;
      }
      const at = nowIso();
      const draft: DraftTransition = {
        transitionId: input.transitionId?.trim() || randomUUID(),
        fromKeyframeId: input.fromKeyframeId,
        toKeyframeId: input.toKeyframeId,
        action: input.action.trim(),
        precondition: input.precondition,
        effect: input.effect,
        tags: input.tags,
        createdAt: at,
        updatedAt: at,
      };
      session.transitions.push(draft);
      session.cursorKeyframeId = input.toKeyframeId;
      session.updatedAt = at;
      saveSession(session);
      return draft;
    },

    async updateTransition(
      sessionId,
      transitionId,
      patch: UpdateDraftTransitionInput,
    ) {
      const session = findSessionFile(sessionId);
      requireOpen(session, sessionId);
      const idx = session.transitions.findIndex(
        (t) => t.transitionId === transitionId,
      );
      if (idx < 0) {
        throw new GoalSpaceDomainError(
          'TRANSITION_NOT_FOUND',
          `transition not found: ${transitionId}`,
        );
      }
      const cur = session.transitions[idx]!;
      const at = nowIso();
      if (patch.action != null) cur.action = patch.action.trim();
      if (patch.precondition !== undefined) cur.precondition = patch.precondition;
      if (patch.effect !== undefined) cur.effect = patch.effect;
      if (patch.tags !== undefined) cur.tags = patch.tags;
      cur.updatedAt = at;
      session.transitions[idx] = cur;
      session.updatedAt = at;
      saveSession(session);
      return cur;
    },

    async setCursor(sessionId, keyframeId) {
      const session = findSessionFile(sessionId);
      if (keyframeId) {
        findKeyframeIndex(session, keyframeId);
      }
      session.cursorKeyframeId = keyframeId;
      session.updatedAt = nowIso();
      saveSession(session);
      return session;
    },

    async discardSession(sessionId) {
      const session = findSessionFile(sessionId);
      if (session.status === 'submitted') {
        throw new GoalSpaceDomainError(
          'SESSION_SUBMITTED',
          `cannot discard submitted session: ${sessionId}`,
        );
      }
      removeSessionArtifacts(session.spaceId, session.sessionId);
    },
  };
}
