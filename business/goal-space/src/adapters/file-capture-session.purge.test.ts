/**
 * Session purge：清除 open/discarded，保留 submitted
 */
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createFileCaptureSessionPort } from './file-capture-session.js';

describe('purgeAbandonedSessions', () => {
  let dataDir = '';
  let prevData = '';

  before(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'gs-purge-'));
    prevData = process.env.GOAL_SPACE_DATA_DIR ?? '';
    process.env.GOAL_SPACE_DATA_DIR = dataDir;
  });

  after(() => {
    if (prevData) process.env.GOAL_SPACE_DATA_DIR = prevData;
    else delete process.env.GOAL_SPACE_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('createSession purges prior open; purge keeps submitted', async () => {
    const capture = createFileCaptureSessionPort();
    const open1 = await capture.createSession({ spaceId: 's1' });
    const open2 = await capture.createSession({ spaceId: 's1' });
    await assert.rejects(
      () => capture.getSession(open1.sessionId),
      (e: { code?: string }) => e.code === 'SESSION_NOT_FOUND',
    );

    const sessions = join(dataDir, 's1', 'sessions');
    mkdirSync(sessions, { recursive: true });
    const submittedId = 'submitted-keep-me';
    writeFileSync(
      join(sessions, `${submittedId}.json`),
      JSON.stringify({
        sessionId: submittedId,
        spaceId: 's1',
        status: 'submitted',
        submittedVersion: 'v1',
        keyframes: [],
        transitions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) + '\n',
    );
    mkdirSync(join(sessions, submittedId, 'keyframes'), { recursive: true });
    writeFileSync(join(sessions, submittedId, 'keyframes', 'x.png'), 'png');

    const discardedId = 'discard-me';
    writeFileSync(
      join(sessions, `${discardedId}.json`),
      JSON.stringify({
        sessionId: discardedId,
        spaceId: 's1',
        status: 'discarded',
        keyframes: [],
        transitions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) + '\n',
    );

    const r = await capture.purgeAbandonedSessions('s1');
    assert.ok(r.purgedSessionIds.includes(open2.sessionId));
    assert.ok(r.purgedSessionIds.includes(discardedId));
    assert.ok(!r.purgedSessionIds.includes(submittedId));
    assert.equal(existsSync(join(sessions, `${submittedId}.json`)), true);
    assert.equal(
      existsSync(join(sessions, submittedId, 'keyframes', 'x.png')),
      true,
    );
    assert.equal(existsSync(join(sessions, `${open2.sessionId}.json`)), false);
    assert.equal(existsSync(join(sessions, `${discardedId}.json`)), false);

    const raw = JSON.parse(
      readFileSync(join(sessions, `${submittedId}.json`), 'utf8'),
    ) as { status: string };
    assert.equal(raw.status, 'submitted');
  });

  it('refuses to discard submitted sessions', async () => {
    const capture = createFileCaptureSessionPort();
    const sessions = join(dataDir, 's1', 'sessions');
    mkdirSync(sessions, { recursive: true });
    const submittedId = 'sub-1';
    writeFileSync(
      join(sessions, `${submittedId}.json`),
      JSON.stringify({
        sessionId: submittedId,
        spaceId: 's1',
        status: 'submitted',
        submittedVersion: 'v1',
        keyframes: [],
        transitions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) + '\n',
    );
    await assert.rejects(
      () => capture.discardSession(submittedId),
      (e: { code?: string }) => e.code === 'SESSION_SUBMITTED',
    );
    assert.equal(existsSync(join(sessions, `${submittedId}.json`)), true);
  });
});
