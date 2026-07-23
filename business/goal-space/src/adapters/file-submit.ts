import type {
  CaptureSessionPort,
  GoalSpaceIndexPort,
  GoalSpaceSubmitPort,
  GoalSpaceVersionMeta,
  Keyframe,
  SubmitCaptureSessionInput,
  SubmitCaptureSessionResult,
  Transition,
} from '@mtp/domain-goal-space';
import { GoalSpaceDomainError } from '@mtp/domain-goal-space';
import { writePublishedVersion } from './file-store.js';

function nowIso(): string {
  return new Date().toISOString();
}

export function createFileSubmitPort(deps: {
  capture: CaptureSessionPort;
  index: GoalSpaceIndexPort;
}): GoalSpaceSubmitPort {
  const { capture, index } = deps;
  return {
    async submit(
      input: SubmitCaptureSessionInput,
    ): Promise<SubmitCaptureSessionResult> {
      const session = await capture.getSession(input.sessionId);
      if (session.status !== 'open') {
        throw new GoalSpaceDomainError(
          'SESSION_NOT_OPEN',
          `session ${input.sessionId} is ${session.status}`,
        );
      }
      if (session.keyframes.length === 0) {
        throw new GoalSpaceDomainError(
          'SUBMIT_VALIDATION_FAILED',
          'session has no keyframes',
        );
      }

      const warnings: SubmitCaptureSessionResult['warnings'] = [];
      const connected = new Set<string>();
      for (const t of session.transitions) {
        connected.add(t.fromKeyframeId);
        connected.add(t.toKeyframeId);
      }
      const failOrphan = input.failOnOrphanKeyframes !== false;
      for (const kf of session.keyframes) {
        if (
          session.keyframes.length > 1 &&
          !connected.has(kf.keyframeId)
        ) {
          const issue = {
            code: 'ORPHAN_KEYFRAME',
            message: `orphan keyframe: ${kf.keyframeId}`,
            keyframeId: kf.keyframeId,
          };
          if (failOrphan) {
            throw new GoalSpaceDomainError(
              'SUBMIT_VALIDATION_FAILED',
              issue.message,
              { details: issue },
            );
          }
          warnings.push(issue);
        }
      }

      const version =
        input.version?.trim() ||
        new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const ref = { spaceId: session.spaceId, version };

      const keyframes: Keyframe[] = session.keyframes.map((d) => ({
        keyframeId: d.keyframeId,
        screenName: d.screenName,
        caption: d.caption,
        notes: d.notes ?? [],
        screenshot: d.screenshot ?? {
          uri: '',
          kind: 'screenshot',
        },
        widgets: d.widgets,
        tags: d.tags,
        appPackage: d.appPackage,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));

      const transitions: Transition[] = session.transitions.map((t) => ({
        transitionId: t.transitionId,
        fromKeyframeId: t.fromKeyframeId,
        toKeyframeId: t.toKeyframeId,
        action: t.action,
        precondition: t.precondition,
        effect: t.effect,
        evidenceShot: t.evidenceShot,
        tags: t.tags,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

      const meta: GoalSpaceVersionMeta = {
        ref,
        createdAt: nowIso(),
        createdBy: input.createdBy,
        sourceSessionId: session.sessionId,
        deviceProfile: session.deviceProfile,
        appPackage: session.appPackage,
        keyframeCount: keyframes.length,
        transitionCount: transitions.length,
        openCodeOverviewPath: `OPENCODE.md`,
        notes: input.notes,
      };

      writePublishedVersion({ ref, meta, keyframes, transitions });

      // mark session submitted
      session.status = 'submitted';
      session.submittedVersion = version;
      session.updatedAt = nowIso();
      // persist via discard-style write: capture port has no save; re-get and we need write
      // Use getSession's file — submit writes status through a side channel:
      const { writeFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const { sessionsDir } = await import('../paths.js');
      writeFileSync(
        join(sessionsDir(session.spaceId), `${session.sessionId}.json`),
        JSON.stringify(session, null, 2) + '\n',
        'utf8',
      );

      let indexesRebuilt: SubmitCaptureSessionResult['indexesRebuilt'];
      const shouldRebuild = input.rebuildIndexes !== false;
      if (shouldRebuild) {
        const kinds =
          Array.isArray(input.rebuildIndexes)
            ? input.rebuildIndexes
            : (['text', 'visual'] as const);
        const result = await index.rebuild({
          ref,
          kinds: [...kinds],
        });
        indexesRebuilt = result.rebuilt;
      }

      return { ref, meta, warnings, indexesRebuilt };
    },
  };
}
