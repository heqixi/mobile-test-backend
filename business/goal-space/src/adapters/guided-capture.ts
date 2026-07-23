/**
 * GuidedCapture：act 后定屏 + 可选 LLM 屏身份终审 + 图生长 + 可选标注。
 */

import { readFileSync } from 'node:fs';
import type {
  CaptureSessionPort,
  GuidedActInput,
  GuidedActResult,
  GuidedCapturePort,
  KeyframeLabelPort,
  KeyframeLabelResult,
  ScreenIdentityPort,
  VisualMatchResult,
} from '@mtp/domain-goal-space';
import {
  applyScreenIdentityJudge,
  decideGraphGrowth,
  GoalSpaceDomainError,
  shouldJudgeScreenIdentity,
} from '@mtp/domain-goal-space';
import {
  matchSessionVisual,
  resolveSessionKeyframeImagePath,
} from './session-media.js';

export function createGuidedCapturePort(deps: {
  capture: CaptureSessionPort;
  label?: KeyframeLabelPort;
  identity?: ScreenIdentityPort;
}): GuidedCapturePort {
  const { capture, label, identity } = deps;

  return {
    async reconcileAfterAct(input: GuidedActInput): Promise<GuidedActResult> {
      const midsceneOk = input.midsceneOk !== false;
      const wantLabel = input.label !== false;
      const wantIdentity = input.identity !== false;

      let session = await capture.getSession(input.sessionId);
      if (session.status !== 'open') {
        const emptyLive: VisualMatchResult = {
          accepted: false,
          candidates: [],
          rejectReason: 'unavailable',
        };
        return {
          decision: { kind: 'needs_human', reason: 'session_not_open' },
          session,
          live: emptyLive,
          label: { status: 'skipped' },
          identity: { status: 'skipped' },
        };
      }

      if (!input.postScreenshotBase64?.trim()) {
        return {
          decision: { kind: 'needs_human', reason: 'no_screenshot' },
          session,
          live: {
            accepted: false,
            candidates: [],
            rejectReason: 'no_screenshot',
          },
          label: { status: 'skipped' },
          identity: { status: 'skipped' },
        };
      }

      const fromOk = session.keyframes.some(
        (k) => k.keyframeId === input.fromKeyframeId,
      );
      if (!fromOk) {
        return {
          decision: { kind: 'needs_human', reason: 'no_from' },
          session,
          live: {
            accepted: false,
            candidates: [],
            rejectReason: 'unavailable',
          },
          label: { status: 'skipped' },
          identity: { status: 'skipped' },
        };
      }

      const live = await matchSessionVisual(capture, input.sessionId, {
        screenshotBase64: input.postScreenshotBase64,
      });

      const successorIds = session.transitions
        .filter((t) => t.fromKeyframeId === input.fromKeyframeId)
        .map((t) => t.toKeyframeId);

      let decision = decideGraphGrowth({
        fromKeyframeId: input.fromKeyframeId,
        successorIds,
        fixation: live,
        midsceneOk,
        actionText: input.actionText,
      });

      let identityMeta: GuidedActResult['identity'] = { status: 'not_needed' };
      let identityLabel: KeyframeLabelResult | undefined;

      // 仅有「from」候选时，终审同屏/超时只会挡住生长；直接 spawn。
      // 终审留给「可能回到其它已有关键帧」的情况（如返回上一页）。
      const otherHits = live.candidates.filter(
        (c) => c.id !== input.fromKeyframeId,
      );
      const spawnOnlyVsFrom =
        decision.kind === 'spawn_and_link' && otherHits.length === 0;

      if (
        wantIdentity &&
        identity &&
        !spawnOnlyVsFrom &&
        shouldJudgeScreenIdentity(decision, live.candidates.length)
      ) {
        try {
          const maxCand = 3;
          const top = live.candidates.slice(0, maxCand);
          const identityCandidates = [];
          for (const hit of top) {
            const kf = session.keyframes.find((k) => k.keyframeId === hit.id);
            if (!kf) continue;
            const resolved = resolveSessionKeyframeImagePath(
              session,
              kf.keyframeId,
            );
            if (!resolved) continue;
            identityCandidates.push({
              keyframeId: kf.keyframeId,
              screenName: kf.screenName,
              score: hit.score,
              screenshot: {
                base64: readFileSync(resolved.absPath).toString('base64'),
                mimeType: resolved.mimeType,
              },
            });
          }

          if (identityCandidates.length === 0) {
            identityMeta = {
              status: 'skipped',
              reason: 'no_candidate_screenshots',
            };
          } else {
            const fromKf = session.keyframes.find(
              (k) => k.keyframeId === input.fromKeyframeId,
            );
            const judged = await identity.judge({
              query: { base64: input.postScreenshotBase64 },
              candidates: identityCandidates,
              context: {
                actionText: input.actionText,
                fromKeyframeId: input.fromKeyframeId,
                fromScreenName: fromKf?.screenName,
                locale: 'zh-CN',
              },
              options: { maxCandidates: maxCand },
            });

            decision = applyScreenIdentityJudge({
              preliminary: decision,
              judge: judged,
              fromKeyframeId: input.fromKeyframeId,
              successorIds,
              actionText: input.actionText,
              candidateIds: identityCandidates.map((c) => c.keyframeId),
            });

            if (judged.label?.screenName) {
              identityLabel = {
                screenName: judged.label.screenName,
                notes: judged.label.notes ?? [],
                diagnostics: { source: 'identity' },
              };
            }

            identityMeta = {
              status: 'done',
              verdict: judged.verdict,
              matchedKeyframeId: judged.matchedKeyframeId,
              confidence: judged.confidence,
              reason: judged.reason,
            };
          }
        } catch (err) {
          identityMeta = {
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
          };
          // 终审失败：保持 preliminary（通常 spawn），不阻断生长
        }
      } else if (spawnOnlyVsFrom) {
        identityMeta = {
          status: 'skipped',
          reason: 'spawn_vs_from_only_skip_identity',
        };
      } else if (!wantIdentity || !identity) {
        identityMeta = { status: 'skipped' };
      }

      let createdKeyframeId: string | undefined;
      let createdTransitionId: string | undefined;
      let labelMeta: GuidedActResult['label'] = { status: 'skipped' };

      switch (decision.kind) {
        case 'noop': {
          session = await capture.setCursor(
            input.sessionId,
            decision.liveKeyframeId,
          );
          break;
        }
        case 'stay': {
          session = await capture.setCursor(
            input.sessionId,
            decision.fromKeyframeId,
          );
          break;
        }
        case 'link_only': {
          const edge = await capture.recordTransition(input.sessionId, {
            fromKeyframeId: decision.fromKeyframeId,
            toKeyframeId: decision.toKeyframeId,
            action: decision.action,
          });
          createdTransitionId = edge.transitionId;
          session = await capture.getSession(input.sessionId);
          break;
        }
        case 'spawn_and_link': {
          const kf = await capture.markKeyframe(input.sessionId, {
            screenName: '未命名屏',
            caption: '',
            notes: [],
            screenshotBase64: input.postScreenshotBase64,
            setAsCursor: true,
          });
          createdKeyframeId = kf.keyframeId;
          const edge = await capture.recordTransition(input.sessionId, {
            fromKeyframeId: decision.fromKeyframeId,
            toKeyframeId: kf.keyframeId,
            action: decision.action,
          });
          createdTransitionId = edge.transitionId;

          if (wantLabel) {
            try {
              const fromKf = session.keyframes.find(
                (k) => k.keyframeId === decision.fromKeyframeId,
              );
              let labeled = identityLabel;
              if (!labeled && label) {
                labeled = await label.label({
                  screenshot: { base64: input.postScreenshotBase64 },
                  context: {
                    actionText: input.actionText,
                    fromScreenName: fromKf?.screenName,
                    existingNoteBodies: [],
                    locale: 'zh-CN',
                  },
                });
              }
              if (labeled) {
                await capture.updateKeyframe(input.sessionId, kf.keyframeId, {
                  screenName: labeled.screenName || '未命名屏',
                });
                const noteIds: string[] = [];
                for (const draft of labeled.notes) {
                  const note = await capture.addNote(
                    input.sessionId,
                    kf.keyframeId,
                    {
                      kind: draft.kind,
                      title: draft.title,
                      body: draft.body,
                      source: 'llm',
                      confidence: draft.confidence,
                    },
                  );
                  noteIds.push(note.noteId);
                }
                labelMeta = {
                  status: 'done',
                  screenName: labeled.screenName,
                  noteIds,
                };
              } else {
                labelMeta = { status: 'pending' };
              }
            } catch (err) {
              labelMeta = {
                status: 'failed',
                error: err instanceof Error ? err.message : String(err),
              };
            }
          }

          session = await capture.getSession(input.sessionId);
          break;
        }
        case 'needs_human':
          break;
        default:
          break;
      }

      return {
        decision,
        session,
        live,
        createdKeyframeId,
        createdTransitionId,
        label: labelMeta,
        identity: identityMeta,
      };
    },
  };
}

/** 对已有关键帧应用标注（替换 llm notes） */
export async function applyKeyframeLabel(deps: {
  capture: CaptureSessionPort;
  label: KeyframeLabelPort;
  sessionId: string;
  keyframeId: string;
  actionText?: string;
  replaceLlmNotes?: boolean;
}): Promise<{
  keyframe: Awaited<ReturnType<CaptureSessionPort['updateKeyframe']>>;
  label: Awaited<ReturnType<KeyframeLabelPort['label']>>;
}> {
  const session = await deps.capture.getSession(deps.sessionId);
  if (session.status !== 'open') {
    throw new GoalSpaceDomainError(
      'SESSION_NOT_OPEN',
      `session ${deps.sessionId} is ${session.status}`,
    );
  }
  const kf = session.keyframes.find((k) => k.keyframeId === deps.keyframeId);
  if (!kf) {
    throw new GoalSpaceDomainError(
      'KEYFRAME_NOT_FOUND',
      `keyframe not found: ${deps.keyframeId}`,
    );
  }
  if (!kf.screenshot?.uri) {
    throw new GoalSpaceDomainError(
      'MEDIA_NOT_FOUND',
      'keyframe has no screenshot',
    );
  }

  const { readSessionKeyframeScreenshot } = await import('./session-media.js');
  const { buffer } = await readSessionKeyframeScreenshot(
    deps.capture,
    deps.sessionId,
    deps.keyframeId,
  );
  const base64 = buffer.toString('base64');

  if (deps.replaceLlmNotes !== false) {
    for (const n of [...kf.notes]) {
      if (n.source === 'llm') {
        await deps.capture.removeNote(
          deps.sessionId,
          deps.keyframeId,
          n.noteId,
        );
      }
    }
  }

  const fresh = await deps.capture.getSession(deps.sessionId);
  const freshKf = fresh.keyframes.find((k) => k.keyframeId === deps.keyframeId)!;

  const labeled = await deps.label.label({
    screenshot: { base64 },
    context: {
      actionText: deps.actionText,
      existingNoteBodies: freshKf.notes.map((n) => n.body),
      locale: 'zh-CN',
    },
  });

  await deps.capture.updateKeyframe(deps.sessionId, deps.keyframeId, {
    screenName: labeled.screenName || freshKf.screenName,
  });
  for (const draft of labeled.notes) {
    await deps.capture.addNote(deps.sessionId, deps.keyframeId, {
      kind: draft.kind,
      title: draft.title,
      body: draft.body,
      source: 'llm',
      confidence: draft.confidence,
    });
  }

  const updated = await deps.capture.getSession(deps.sessionId);
  const keyframe = updated.keyframes.find((k) => k.keyframeId === deps.keyframeId)!;
  return { keyframe, label: labeled };
}
