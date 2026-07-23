/**
 * applyScreenIdentityJudge 纯函数测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyScreenIdentityJudge,
  shouldJudgeScreenIdentity,
} from '@mtp/domain-goal-space';

describe('applyScreenIdentityJudge', () => {
  const from = 'from-1';
  const home = 'home-1';
  const other = 'other-1';

  it('shouldJudge only for spawn / ambiguous', () => {
    assert.equal(
      shouldJudgeScreenIdentity(
        { kind: 'spawn_and_link', fromKeyframeId: from, action: 'x' },
        2,
      ),
      true,
    );
    assert.equal(
      shouldJudgeScreenIdentity(
        { kind: 'needs_human', reason: 'ambiguous' },
        1,
      ),
      true,
    );
    assert.equal(
      shouldJudgeScreenIdentity(
        { kind: 'stay', reason: 'still_on_from', fromKeyframeId: from },
        1,
      ),
      false,
    );
    assert.equal(
      shouldJudgeScreenIdentity(
        { kind: 'spawn_and_link', fromKeyframeId: from, action: 'x' },
        0,
      ),
      false,
    );
  });

  it('same_screen overrides spawn → link_only', () => {
    const d = applyScreenIdentityJudge({
      preliminary: {
        kind: 'spawn_and_link',
        fromKeyframeId: from,
        action: '返回上一页',
      },
      judge: {
        verdict: 'same_screen',
        matchedKeyframeId: home,
        confidence: 0.9,
      },
      fromKeyframeId: from,
      successorIds: [],
      actionText: '返回上一页',
      candidateIds: [home, other],
    });
    assert.equal(d.kind, 'link_only');
    if (d.kind === 'link_only') assert.equal(d.toKeyframeId, home);
  });

  it('different_screen keeps spawn', () => {
    const d = applyScreenIdentityJudge({
      preliminary: {
        kind: 'spawn_and_link',
        fromKeyframeId: from,
        action: '打开新页',
      },
      judge: { verdict: 'different_screen', confidence: 0.8 },
      fromKeyframeId: from,
      successorIds: [],
      actionText: '打开新页',
      candidateIds: [home],
    });
    assert.equal(d.kind, 'spawn_and_link');
  });

  it('same_screen to from with leave action → still spawn', () => {
    const d = applyScreenIdentityJudge({
      preliminary: {
        kind: 'spawn_and_link',
        fromKeyframeId: from,
        action: '点击底部输入框进入WPS AI',
      },
      judge: {
        verdict: 'same_screen',
        matchedKeyframeId: from,
        confidence: 0.9,
      },
      fromKeyframeId: from,
      successorIds: [],
      actionText: '点击底部输入框进入WPS AI',
      candidateIds: [from],
    });
    assert.equal(d.kind, 'spawn_and_link');
  });

  it('uncertain → needs_human', () => {
    const d = applyScreenIdentityJudge({
      preliminary: {
        kind: 'spawn_and_link',
        fromKeyframeId: from,
        action: 'x',
      },
      judge: { verdict: 'uncertain' },
      fromKeyframeId: from,
      successorIds: [],
      actionText: 'x',
      candidateIds: [home],
    });
    assert.equal(d.kind, 'needs_human');
  });
});
