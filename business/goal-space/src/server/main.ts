/**
 * Goal Space HTTP 服务（:4104）。
 * 实现 @mtp/domain-goal-space 的 goal-space-http 协议。
 */

import { createServer } from 'node:http';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GoalSpaceDomainError,
  goalSpacePaths,
  goalSpaceRoutePatterns,
  type GoalSpaceRetrieveQuery,
  type MarkKeyframeInput,
  type RecordTransitionInput,
  type RebuildGoalSpaceIndexInput,
  type SubmitCaptureSessionInput,
  type UpdateDraftKeyframeInput,
  type UpdateDraftTransitionInput,
  type SessionVisualMatchRequest,
  type GuidedActInput,
  type AddKeyframeNoteInput,
  type UpdateKeyframeNoteInput,
  type PutGoalSpaceSpaceSummaryInput,
  type GenerateGoalSpaceSpaceSummaryInput,
} from '@mtp/domain-goal-space';
import { createGoalSpaceRuntime } from '../create-runtime.js';
import {
  matchSessionVisual,
  readSessionKeyframeScreenshot,
} from '../adapters/session-media.js';
import { applyKeyframeLabel } from '../adapters/guided-capture.js';
import {
  resolveKeyframeImageAbsolutePath,
} from '../adapters/file-store.js';
import {
  putSpaceSummary,
  readSpaceSummary,
  writeSpaceSummary,
} from '../adapters/file-space-summary.js';
import { generateSpaceSummaryWithLlm } from '../adapters/openai-space-summary.js';
import { goalSpaceDataDir } from '../paths.js';
import { matchRoute, readBody, sendBinary, sendJson } from './http-utils.js';
import { existsSync, readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../../.env') });
loadEnv();

const DEFAULT_PORT = 4104;
const SERVICE_NAME = 'goal-space-service';

function statusFor(code: string): number {
  switch (code) {
    case 'SPACE_NOT_FOUND':
    case 'VERSION_NOT_FOUND':
    case 'SESSION_NOT_FOUND':
    case 'KEYFRAME_NOT_FOUND':
    case 'TRANSITION_NOT_FOUND':
    case 'NOTE_NOT_FOUND':
    case 'MEDIA_NOT_FOUND':
      return 404;
    case 'SESSION_NOT_OPEN':
    case 'SESSION_SUBMITTED':
    case 'SUBMIT_VALIDATION_FAILED':
    case 'INVALID':
      return 422;
    case 'RETRIEVE_FAILED':
      return 502;
    default:
      return 400;
  }
}

async function main() {
  const port = Number(process.env.GOAL_SPACE_PORT ?? DEFAULT_PORT);
  const host = process.env.GOAL_SPACE_HOST ?? '127.0.0.1';
  const rt = createGoalSpaceRuntime();
  const startupPurge = await rt.capture.purgeAbandonedSessions();
  if (startupPurge.purgedSessionIds.length > 0) {
    console.log(
      `[${SERVICE_NAME}] purged ${startupPurge.purgedSessionIds.length} abandoned session(s)`,
    );
  }

  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
        });
        res.end();
        return;
      }

      const method = req.method ?? 'GET';
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      const path = url.pathname;

      if (method === 'GET' && path === goalSpacePaths.health) {
        sendJson(res, 200, {
          ok: true,
          service: SERVICE_NAME,
          dataDir: goalSpaceDataDir(),
        });
        return;
      }

      if (method === 'GET' && path === goalSpacePaths.spaces) {
        sendJson(res, 200, await rt.store.listSpaces());
        return;
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.spaceVersions, path);
        if (method === 'GET' && p) {
          sendJson(res, 200, await rt.store.listVersions(p.spaceId!));
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.spaceVersion, path);
        if (method === 'GET' && p) {
          sendJson(
            res,
            200,
            await rt.store.getVersionMeta({
              spaceId: p.spaceId!,
              version: p.version!,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.spaceVersionGraph, path);
        if (method === 'GET' && p) {
          sendJson(
            res,
            200,
            await rt.store.getGraph({
              spaceId: p.spaceId!,
              version: p.version!,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(
          goalSpaceRoutePatterns.spaceVersionKeyframeScreenshot,
          path,
        );
        if (method === 'GET' && p) {
          const graph = await rt.store.getGraph({
            spaceId: p.spaceId!,
            version: p.version!,
          });
          const kf = graph.keyframes.find(
            (k) => k.keyframeId === p.keyframeId,
          );
          if (!kf) {
            sendJson(res, 404, {
              code: 'KEYFRAME_NOT_FOUND',
              message: `keyframe not found: ${p.keyframeId}`,
            });
            return;
          }
          const abs = resolveKeyframeImageAbsolutePath(
            p.spaceId!,
            p.version!,
            kf,
          );
          if (!abs || !existsSync(abs)) {
            sendJson(res, 404, {
              code: 'MEDIA_NOT_FOUND',
              message: 'screenshot not found',
            });
            return;
          }
          const mimeType = kf.screenshot?.mimeType ?? 'image/png';
          sendBinary(res, 200, readFileSync(abs), mimeType);
          return;
        }
      }

      {
        const p = matchRoute(
          goalSpaceRoutePatterns.spaceVersionOpenCodePack,
          path,
        );
        if (method === 'GET' && p) {
          sendJson(
            res,
            200,
            await rt.store.getOpenCodePackManifest({
              spaceId: p.spaceId!,
              version: p.version!,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(
          goalSpaceRoutePatterns.spaceVersionIndexesRebuild,
          path,
        );
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as Partial<RebuildGoalSpaceIndexInput>;
          sendJson(
            res,
            200,
            await rt.index.rebuild({
              ref: {
                spaceId: p.spaceId!,
                version: p.version!,
              },
              kinds: body.kinds,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(
          goalSpaceRoutePatterns.spaceSummaryGenerate,
          path,
        );
        if (method === 'POST' && p) {
          const spaceId = p.spaceId!;
          const body =
            (await readBody(req)) as GenerateGoalSpaceSpaceSummaryInput;
          let version = body.version?.trim();
          if (!version) {
            const latest = await rt.store.resolveLatest(spaceId);
            if (!latest) {
              sendJson(res, 404, {
                code: 'VERSION_NOT_FOUND',
                message: `no published version for space ${spaceId}`,
              });
              return;
            }
            version = latest.version;
          }
          const graph = await rt.store.getGraph({ spaceId, version });
          const generated = await generateSpaceSummaryWithLlm(graph, body);
          sendJson(res, 200, writeSpaceSummary(spaceId, generated));
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.spaceSummary, path);
        if (method === 'GET' && p) {
          const spaceId = p.spaceId!;
          try {
            const summary = readSpaceSummary(spaceId);
            if (!summary) {
              sendJson(res, 404, {
                code: 'SPACE_NOT_FOUND',
                message: `summary not found: ${spaceId}`,
              });
              return;
            }
            sendJson(res, 200, summary);
          } catch (err) {
            if (err instanceof GoalSpaceDomainError) {
              sendJson(res, statusFor(err.code), {
                code: err.code,
                message: err.message,
              });
              return;
            }
            throw err;
          }
          return;
        }
        if (method === 'PUT' && p) {
          const spaceId = p.spaceId!;
          const body = (await readBody(req)) as PutGoalSpaceSpaceSummaryInput;
          if (typeof body.overview !== 'string') {
            sendJson(res, 400, {
              code: 'INVALID',
              message: 'overview required',
            });
            return;
          }
          if (!Array.isArray(body.keywords)) {
            sendJson(res, 400, {
              code: 'INVALID',
              message: 'keywords array required',
            });
            return;
          }
          sendJson(res, 200, putSpaceSummary(spaceId, body));
          return;
        }
      }

      if (method === 'POST' && path === goalSpacePaths.sessions) {
        const body = (await readBody(req)) as {
          spaceId?: string;
          displayName?: string;
          deviceProfile?: string;
          appPackage?: string;
        };
        if (!body.spaceId?.trim()) {
          sendJson(res, 400, { code: 'INVALID', message: 'spaceId required' });
          return;
        }
        sendJson(
          res,
          200,
          await rt.capture.createSession({
            spaceId: body.spaceId.trim(),
            displayName: body.displayName,
            deviceProfile: body.deviceProfile,
            appPackage: body.appPackage,
          }),
        );
        return;
      }

      if (method === 'GET' && path === goalSpacePaths.sessions) {
        const spaceId = url.searchParams.get('spaceId') ?? undefined;
        sendJson(res, 200, await rt.capture.listOpenSessions(spaceId));
        return;
      }

      if (method === 'POST' && path === goalSpacePaths.sessionsPurge) {
        const spaceId = url.searchParams.get('spaceId') ?? undefined;
        sendJson(res, 200, await rt.capture.purgeAbandonedSessions(spaceId));
        return;
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.session, path);
        if (method === 'GET' && p) {
          sendJson(res, 200, await rt.capture.getSession(p.sessionId!));
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionKeyframes, path);
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as MarkKeyframeInput;
          sendJson(
            res,
            200,
            await rt.capture.markKeyframe(p.sessionId!, body),
          );
          return;
        }
      }

      {
        const p = matchRoute(
          goalSpaceRoutePatterns.sessionKeyframeScreenshot,
          path,
        );
        if (method === 'GET' && p) {
          const { buffer, mimeType } = await readSessionKeyframeScreenshot(
            rt.capture,
            p.sessionId!,
            p.keyframeId!,
          );
          sendBinary(res, 200, buffer, mimeType);
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionVisualMatch, path);
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as SessionVisualMatchRequest;
          if (!body.screenshotBase64?.trim()) {
            sendJson(res, 400, {
              code: 'INVALID',
              message: 'screenshotBase64 required',
            });
            return;
          }
          sendJson(
            res,
            200,
            await matchSessionVisual(rt.capture, p.sessionId!, {
              screenshotBase64: body.screenshotBase64,
              maxCandidates: body.maxCandidates,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionGuidedReconcile, path);
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as GuidedActInput;
          sendJson(
            res,
            200,
            await rt.guided.reconcileAfterAct({
              ...body,
              sessionId: p.sessionId!,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionKeyframeNotes, path);
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as AddKeyframeNoteInput;
          sendJson(
            res,
            200,
            await rt.capture.addNote(p.sessionId!, p.keyframeId!, body),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionKeyframeNote, path);
        if (method === 'PATCH' && p) {
          const body = (await readBody(req)) as UpdateKeyframeNoteInput;
          sendJson(
            res,
            200,
            await rt.capture.updateNote(
              p.sessionId!,
              p.keyframeId!,
              p.noteId!,
              body,
            ),
          );
          return;
        }
        if (method === 'DELETE' && p) {
          await rt.capture.removeNote(
            p.sessionId!,
            p.keyframeId!,
            p.noteId!,
          );
          sendJson(res, 200, { ok: true });
          return;
        }
      }

      {
        const p = matchRoute(
          goalSpaceRoutePatterns.sessionKeyframeLabelApply,
          path,
        );
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as {
            actionText?: string;
            replaceLlmNotes?: boolean;
          };
          sendJson(
            res,
            200,
            await applyKeyframeLabel({
              capture: rt.capture,
              label: rt.label,
              sessionId: p.sessionId!,
              keyframeId: p.keyframeId!,
              actionText: body.actionText,
              replaceLlmNotes: body.replaceLlmNotes,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionKeyframe, path);
        if (method === 'PATCH' && p) {
          const body = (await readBody(req)) as UpdateDraftKeyframeInput;
          sendJson(
            res,
            200,
            await rt.capture.updateKeyframe(
              p.sessionId!,
              p.keyframeId!,
              body,
            ),
          );
          return;
        }
        if (method === 'DELETE' && p) {
          sendJson(
            res,
            200,
            await rt.capture.deleteKeyframe(p.sessionId!, p.keyframeId!),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionTransitions, path);
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as RecordTransitionInput;
          sendJson(
            res,
            200,
            await rt.capture.recordTransition(p.sessionId!, body),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionTransition, path);
        if (method === 'PATCH' && p) {
          const body = (await readBody(req)) as UpdateDraftTransitionInput;
          sendJson(
            res,
            200,
            await rt.capture.updateTransition(
              p.sessionId!,
              p.transitionId!,
              body,
            ),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionSubmit, path);
        if (method === 'POST' && p) {
          const body = (await readBody(req)) as Partial<SubmitCaptureSessionInput>;
          sendJson(
            res,
            200,
            await rt.submit.submit({
              sessionId: p.sessionId!,
              ...body,
            }),
          );
          return;
        }
      }

      {
        const p = matchRoute(goalSpaceRoutePatterns.sessionDiscard, path);
        if (method === 'POST' && p) {
          await rt.capture.discardSession(p.sessionId!);
          sendJson(res, 200, { ok: true });
          return;
        }
      }

      if (method === 'POST' && path === goalSpacePaths.retrieve) {
        const body = (await readBody(req)) as GoalSpaceRetrieveQuery;
        if (!body.intentText?.trim()) {
          sendJson(res, 400, {
            code: 'INVALID',
            message: 'intentText required',
          });
          return;
        }
        sendJson(res, 200, await rt.retrieve.retrieve(body));
        return;
      }

      sendJson(res, 404, { error: `Unknown route ${method} ${path}` });
    } catch (error) {
      if (error instanceof GoalSpaceDomainError) {
        sendJson(res, statusFor(error.code), {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        return;
      }
      console.error('[goal-space-service]', error);
      sendJson(res, 500, {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await new Promise<void>((resolveListen) => {
    server.listen(port, host, () => resolveListen());
  });

  console.log('');
  console.log(`[${SERVICE_NAME}] ready`);
  console.log(`  HTTP   http://${host}:${port}`);
  console.log(`  Data   ${goalSpaceDataDir()}`);
  console.log(`  GET    ${goalSpacePaths.health}`);
  console.log(`  POST   ${goalSpacePaths.sessions} / ${goalSpacePaths.sessionsPurge} / retrieve`);
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
