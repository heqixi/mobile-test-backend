/**
 * GuidedCapture + Notes 集成测试（临时 data 目录）
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PNG } from 'pngjs';
import { createFileCaptureSessionPort } from './file-capture-session.js';
import { createGuidedCapturePort } from './guided-capture.js';
import { createHeuristicKeyframeLabelPort } from './heuristic-keyframe-label.js';

/** 生成 dHash 差异足够大的测试图（不同 seed 应判为不同屏） */
function makePngBuffer(seed: number): Buffer {
  const w = 64;
  const h = 64;
  const png = new PNG({ width: w, height: h });
  const mode = Math.abs(seed) % 5;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;
      if (mode === 0) {
        r = x < 32 + (seed % 7) ? 255 : 0;
        g = (y * 3 + seed) % 256;
      } else if (mode === 1) {
        g = y < 32 ? 255 : 40;
        b = (x * 5 + seed * 9) % 256;
      } else if (mode === 2) {
        const bit = ((x >> 3) ^ (y >> 3)) & 1;
        r = g = b = bit ? 255 : 0;
      } else if (mode === 3) {
        r = ((x >> 2) & 1) * 255;
        g = ((y >> 2) & 1) * 255;
        b = seed % 256;
      } else {
        r = (x * 13 + seed * 17) % 256;
        g = (y * 19 + seed * 23) % 256;
        b = ((x + y) * 7 + seed) % 256;
        if ((x + y + seed) % 11 === 0) {
          r = 255;
          g = 0;
          b = 255;
        }
      }
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

function dataUrl(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

describe('guided capture + notes', () => {
  let dataDir = '';
  let prevData = '';

  before(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'gs-test-'));
    prevData = process.env.GOAL_SPACE_DATA_DIR ?? '';
    process.env.GOAL_SPACE_DATA_DIR = dataDir;
  });

  after(() => {
    if (prevData) process.env.GOAL_SPACE_DATA_DIR = prevData;
    else delete process.env.GOAL_SPACE_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('notes CRUD on keyframe', async () => {
    const capture = createFileCaptureSessionPort();
    const session = await capture.createSession({ spaceId: 'test-space' });
    const kf = await capture.markKeyframe(session.sessionId, {
      screenName: '首页',
      caption: '',
      screenshotBase64: dataUrl(makePngBuffer(1)),
    });
    assert.equal(kf.notes.length, 0);

    const n1 = await capture.addNote(session.sessionId, kf.keyframeId, {
      kind: 'hint',
      body: '底部输入进 AI',
    });
    assert.ok(n1.noteId);
    const n2 = await capture.addNote(session.sessionId, kf.keyframeId, {
      kind: 'risk',
      body: '勿乱点关闭',
    });
    await capture.updateNote(session.sessionId, kf.keyframeId, n1.noteId, {
      body: '底部输入是 WPS AI 入口',
    });
    await capture.removeNote(session.sessionId, kf.keyframeId, n2.noteId);

    const s = await capture.getSession(session.sessionId);
    const again = s.keyframes.find((k) => k.keyframeId === kf.keyframeId)!;
    assert.equal(again.notes.length, 1);
    assert.equal(again.notes[0]!.body, '底部输入是 WPS AI 入口');
  });

  it('spawn_and_link when live lost + heuristic label', async () => {
    const capture = createFileCaptureSessionPort();
    const label = createHeuristicKeyframeLabelPort();
    const guided = createGuidedCapturePort({ capture, label });

    const session = await capture.createSession({ spaceId: 'test-space-2' });
    const home = await capture.markKeyframe(session.sessionId, {
      screenName: 'WPS 首页',
      caption: '首页',
      screenshotBase64: dataUrl(makePngBuffer(10)),
    });

    const postShot = dataUrl(makePngBuffer(99));
    const result = await guided.reconcileAfterAct({
      sessionId: session.sessionId,
      fromKeyframeId: home.keyframeId,
      actionText: '点击底部输入框',
      postScreenshotBase64: postShot,
      midsceneOk: true,
      label: true,
      // 本用例验证「真正新屏」spawn；关闭终审以免启发式把灰区判成 same
      identity: false,
    });

    assert.equal(result.decision.kind, 'spawn_and_link');
    assert.ok(result.createdKeyframeId);
    assert.ok(result.createdTransitionId);
    assert.equal(result.label?.status, 'done');

    const s = result.session;
    assert.equal(s.keyframes.length, 2);
    assert.equal(s.transitions.length, 1);
    assert.equal(s.transitions[0]!.action, '点击底部输入框');
    assert.equal(s.transitions[0]!.fromKeyframeId, home.keyframeId);
    assert.equal(s.transitions[0]!.toKeyframeId, result.createdKeyframeId);

    const created = s.keyframes.find(
      (k) => k.keyframeId === result.createdKeyframeId,
    )!;
    assert.notEqual(created.screenName, '未命名屏');
    assert.ok(created.notes.length >= 1);
    assert.ok(created.notes.every((n) => n.source === 'llm'));
  });

  it('identity judge same_screen overrides spawn → link_only', async () => {
    const capture = createFileCaptureSessionPort();
    const session = await capture.createSession({ spaceId: 'test-space-id' });
    const home = await capture.markKeyframe(session.sessionId, {
      screenName: '首页',
      screenshotBase64: dataUrl(makePngBuffer(10)),
    });
    const detail = await capture.markKeyframe(session.sessionId, {
      screenName: '详情',
      screenshotBase64: dataUrl(makePngBuffer(21)),
      setAsCursor: true,
    });

    const guided = createGuidedCapturePort({
      capture,
      identity: {
        async judge() {
          return {
            verdict: 'same_screen',
            matchedKeyframeId: home.keyframeId,
            confidence: 0.95,
            reason: 'mock: 元素结构一致，回到首页',
            elements: {
              title: '首页',
              primaryRegion: '列表',
              bottomBar: 'Tab',
            },
          };
        },
      },
    });

    // 从详情返回：截图用「与详情差异大」的图 → dHash 倾向 spawn；终审指回首页
    const result = await guided.reconcileAfterAct({
      sessionId: session.sessionId,
      fromKeyframeId: detail.keyframeId,
      actionText: '返回上一页',
      postScreenshotBase64: dataUrl(makePngBuffer(99)),
      midsceneOk: true,
      identity: true,
    });

    assert.equal(result.decision.kind, 'link_only');
    assert.equal(result.identity?.status, 'done');
    assert.equal(result.identity?.verdict, 'same_screen');
    assert.equal(result.session.keyframes.length, 2);
    assert.equal(result.session.transitions.length, 1);
    assert.equal(result.session.transitions[0]!.fromKeyframeId, detail.keyframeId);
    assert.equal(result.session.transitions[0]!.toKeyframeId, home.keyframeId);
  });

  it('noop when already on known successor', async () => {
    const capture = createFileCaptureSessionPort();
    const guided = createGuidedCapturePort({
      capture,
      label: createHeuristicKeyframeLabelPort(),
    });

    const session = await capture.createSession({ spaceId: 'test-space-3' });
    const bufA = makePngBuffer(21);
    const bufB = makePngBuffer(22);
    const a = await capture.markKeyframe(session.sessionId, {
      screenName: 'A',
      screenshotBase64: dataUrl(bufA),
    });
    const b = await capture.markKeyframe(session.sessionId, {
      screenName: 'B',
      screenshotBase64: dataUrl(bufB),
      setAsCursor: false,
    });
    await capture.recordTransition(session.sessionId, {
      fromKeyframeId: a.keyframeId,
      toKeyframeId: b.keyframeId,
      action: '已有边',
    });

    const result = await guided.reconcileAfterAct({
      sessionId: session.sessionId,
      fromKeyframeId: a.keyframeId,
      actionText: '再次点击',
      postScreenshotBase64: dataUrl(bufB),
      midsceneOk: true,
      label: true,
    });

    assert.equal(result.decision.kind, 'noop');
    assert.equal(result.session.keyframes.length, 2);
    assert.equal(result.session.transitions.length, 1);
    assert.equal(result.session.cursorKeyframeId, b.keyframeId);
  });

  it('link_only when live hits existing non-successor', async () => {
    const capture = createFileCaptureSessionPort();
    const guided = createGuidedCapturePort({
      capture,
      label: createHeuristicKeyframeLabelPort(),
    });

    const session = await capture.createSession({ spaceId: 'test-space-4' });
    const bufA = makePngBuffer(31);
    const bufC = makePngBuffer(33);
    const a = await capture.markKeyframe(session.sessionId, {
      screenName: 'A',
      screenshotBase64: dataUrl(bufA),
    });
    const c = await capture.markKeyframe(session.sessionId, {
      screenName: 'C',
      screenshotBase64: dataUrl(bufC),
      setAsCursor: false,
    });

    const result = await guided.reconcileAfterAct({
      sessionId: session.sessionId,
      fromKeyframeId: a.keyframeId,
      actionText: '跳到 C',
      postScreenshotBase64: dataUrl(bufC),
      midsceneOk: true,
    });

    assert.equal(result.decision.kind, 'link_only');
    assert.equal(result.session.keyframes.length, 2);
    assert.equal(result.session.transitions.length, 1);
    assert.equal(result.session.transitions[0]!.toKeyframeId, c.keyframeId);
    assert.equal(result.session.transitions[0]!.action, '跳到 C');
  });

  it('stay when still on from', async () => {
    const capture = createFileCaptureSessionPort();
    const guided = createGuidedCapturePort({
      capture,
      label: createHeuristicKeyframeLabelPort(),
    });
    const session = await capture.createSession({ spaceId: 'test-space-5' });
    const buf = makePngBuffer(41);
    const a = await capture.markKeyframe(session.sessionId, {
      screenName: 'A',
      screenshotBase64: dataUrl(buf),
    });
    const result = await guided.reconcileAfterAct({
      sessionId: session.sessionId,
      fromKeyframeId: a.keyframeId,
      actionText: '无效点击',
      postScreenshotBase64: dataUrl(buf),
      midsceneOk: true,
    });
    assert.equal(result.decision.kind, 'stay');
    assert.equal(result.session.keyframes.length, 1);
    assert.equal(result.session.transitions.length, 0);
  });
});
