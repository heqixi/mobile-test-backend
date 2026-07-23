/**
 * decideGraphGrowth 纯函数测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideGraphGrowth } from '@mtp/domain-goal-space';

describe('decideGraphGrowth', () => {
  const from = 'from-1';
  const to = 'to-1';
  const other = 'other-1';

  it('act_failed → needs_human', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: { accepted: false, candidates: [] },
      midsceneOk: false,
      actionText: '点击',
    });
    assert.equal(d.kind, 'needs_human');
    if (d.kind === 'needs_human') assert.equal(d.reason, 'act_failed');
  });

  it('rejected with no near-dup → spawn_and_link', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [to],
      fixation: {
        accepted: false,
        candidates: [{ id: other, score: 0.5 }],
        rejectReason: 'below_threshold',
      },
      midsceneOk: true,
      actionText: '点击底部输入框',
    });
    assert.equal(d.kind, 'spawn_and_link');
    if (d.kind === 'spawn_and_link') {
      assert.equal(d.fromKeyframeId, from);
      assert.equal(d.action, '点击底部输入框');
    }
  });

  it('rejected but near-dup of known → link_only (避免近重复节点)', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: {
        accepted: false,
        // dist≈13 → score≈0.80，典型「返回上一页」回到已有屏
        candidates: [{ id: other, score: 0.797 }],
        rejectReason: 'below_threshold',
      },
      midsceneOk: true,
      actionText: '返回上一页',
    });
    assert.equal(d.kind, 'link_only');
    if (d.kind === 'link_only') {
      assert.equal(d.toKeyframeId, other);
      assert.equal(d.action, '返回上一页');
    }
  });

  it('rejected near-dup of from → spawn（勿直接 stay，交给终审）', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: {
        accepted: false,
        candidates: [{ id: from, score: 0.78 }],
        rejectReason: 'below_threshold',
      },
      midsceneOk: true,
      actionText: '点击底部输入框进入WPS AI',
    });
    assert.equal(d.kind, 'spawn_and_link');
  });

  it('accepted live === from → stay', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: {
        accepted: true,
        candidates: [{ id: from, score: 0.95 }],
        currentKeyframeId: from,
      },
      midsceneOk: true,
      actionText: '滑动一下',
    });
    assert.equal(d.kind, 'stay');
  });

  it('ambiguous with clear top1 → link_only', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: {
        accepted: false,
        candidates: [
          { id: other, score: 0.85 },
          { id: to, score: 0.8 },
        ],
        rejectReason: 'ambiguous',
      },
      midsceneOk: true,
      actionText: '返回',
    });
    assert.equal(d.kind, 'link_only');
    if (d.kind === 'link_only') assert.equal(d.toKeyframeId, other);
  });

  it('ambiguous close twins → needs_human', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: {
        accepted: false,
        candidates: [
          { id: to, score: 0.9 },
          { id: other, score: 0.88 },
        ],
        rejectReason: 'ambiguous',
      },
      midsceneOk: true,
      actionText: 'x',
    });
    assert.equal(d.kind, 'needs_human');
    if (d.kind === 'needs_human') assert.equal(d.reason, 'ambiguous');
  });

  it('live === from → stay', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: {
        accepted: true,
        candidates: [{ id: from, score: 1 }],
        currentKeyframeId: from,
      },
      midsceneOk: true,
      actionText: 'x',
    });
    assert.equal(d.kind, 'stay');
  });

  it('live in successors → noop', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [to, other],
      fixation: {
        accepted: true,
        candidates: [{ id: to, score: 1 }],
        currentKeyframeId: to,
      },
      midsceneOk: true,
      actionText: 'x',
    });
    assert.equal(d.kind, 'noop');
    if (d.kind === 'noop') assert.equal(d.liveKeyframeId, to);
  });

  it('live known but not successor → link_only', () => {
    const d = decideGraphGrowth({
      fromKeyframeId: from,
      successorIds: [],
      fixation: {
        accepted: true,
        candidates: [{ id: other, score: 1 }],
        currentKeyframeId: other,
      },
      midsceneOk: true,
      actionText: '打开文档',
    });
    assert.equal(d.kind, 'link_only');
    if (d.kind === 'link_only') {
      assert.equal(d.toKeyframeId, other);
      assert.equal(d.action, '打开文档');
    }
  });
});
