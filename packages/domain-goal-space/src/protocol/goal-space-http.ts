/**
 * @module @mtp/domain-goal-space/protocol/goal-space-http
 *
 * Goal Space HTTP 协议（主工程定义，业务服务实现）。
 * 类比 domain-case 的 case-library-http。
 */

import type { CaptureSession } from '../models/capture-session.js';
import type { ContextPack } from '../models/context-pack.js';
import type {
  GoalSpaceGraph,
  GoalSpaceSummary,
  GoalSpaceVersionMeta,
} from '../models/goal-space.js';
import type { DraftKeyframe } from '../models/keyframe.js';
import type { OpenCodePackManifest } from '../ports/goal-space-store-port.js';
import type { SubmitCaptureSessionResult } from '../models/submit.js';
import type { DraftTransition } from '../models/transition.js';

/** 建议默认端口 4104 */
export const goalSpacePaths = {
  health: '/health',
  sessions: '/api/goal-space/sessions',
  sessionsPurge: '/api/goal-space/sessions:purge',
  session: (sessionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}`,
  sessionKeyframes: (sessionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/keyframes`,
  sessionKeyframe: (sessionId: string, keyframeId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/keyframes/${encodeURIComponent(keyframeId)}`,
  sessionTransitions: (sessionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/transitions`,
  sessionTransition: (sessionId: string, transitionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/transitions/${encodeURIComponent(transitionId)}`,
  sessionSubmit: (sessionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/submit`,
  sessionDiscard: (sessionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/discard`,
  sessionKeyframeScreenshot: (sessionId: string, keyframeId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/keyframes/${encodeURIComponent(keyframeId)}/screenshot`,
  sessionVisualMatch: (sessionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/visual-match`,
  sessionGuidedReconcile: (sessionId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/guided-acts:reconcile`,
  sessionKeyframeNotes: (sessionId: string, keyframeId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/keyframes/${encodeURIComponent(keyframeId)}/notes`,
  sessionKeyframeNote: (
    sessionId: string,
    keyframeId: string,
    noteId: string,
  ) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/keyframes/${encodeURIComponent(keyframeId)}/notes/${encodeURIComponent(noteId)}`,
  sessionKeyframeLabelApply: (sessionId: string, keyframeId: string) =>
    `/api/goal-space/sessions/${encodeURIComponent(sessionId)}/keyframes/${encodeURIComponent(keyframeId)}/label:apply`,
  spaces: '/api/goal-space/spaces',
  spaceVersions: (spaceId: string) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/versions`,
  spaceVersion: (spaceId: string, version: string) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/versions/${encodeURIComponent(version)}`,
  spaceVersionGraph: (spaceId: string, version: string) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/versions/${encodeURIComponent(version)}/graph`,
  spaceVersionKeyframeScreenshot: (
    spaceId: string,
    version: string,
    keyframeId: string,
  ) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/versions/${encodeURIComponent(version)}/keyframes/${encodeURIComponent(keyframeId)}/screenshot`,
  spaceVersionOpenCodePack: (spaceId: string, version: string) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/versions/${encodeURIComponent(version)}/opencode-pack`,
  /** 重建派生索引（实现无关） */
  spaceVersionIndexes: (spaceId: string, version: string) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/versions/${encodeURIComponent(version)}/indexes:rebuild`,
  spaceSummary: (spaceId: string) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/summary`,
  spaceSummaryGenerate: (spaceId: string) =>
    `/api/goal-space/spaces/${encodeURIComponent(spaceId)}/summary:generate`,
  retrieve: '/api/goal-space/retrieve',
} as const;

export const goalSpaceRoutePatterns = {
  session: '/api/goal-space/sessions/:sessionId',
  sessionKeyframes: '/api/goal-space/sessions/:sessionId/keyframes',
  sessionKeyframe:
    '/api/goal-space/sessions/:sessionId/keyframes/:keyframeId',
  sessionTransitions: '/api/goal-space/sessions/:sessionId/transitions',
  sessionTransition:
    '/api/goal-space/sessions/:sessionId/transitions/:transitionId',
  sessionSubmit: '/api/goal-space/sessions/:sessionId/submit',
  sessionDiscard: '/api/goal-space/sessions/:sessionId/discard',
  sessionKeyframeScreenshot:
    '/api/goal-space/sessions/:sessionId/keyframes/:keyframeId/screenshot',
  sessionVisualMatch: '/api/goal-space/sessions/:sessionId/visual-match',
  sessionGuidedReconcile:
    '/api/goal-space/sessions/:sessionId/guided-acts:reconcile',
  sessionKeyframeNotes:
    '/api/goal-space/sessions/:sessionId/keyframes/:keyframeId/notes',
  sessionKeyframeNote:
    '/api/goal-space/sessions/:sessionId/keyframes/:keyframeId/notes/:noteId',
  sessionKeyframeLabelApply:
    '/api/goal-space/sessions/:sessionId/keyframes/:keyframeId/label:apply',
  spaceVersions: '/api/goal-space/spaces/:spaceId/versions',
  spaceVersion: '/api/goal-space/spaces/:spaceId/versions/:version',
  spaceVersionGraph:
    '/api/goal-space/spaces/:spaceId/versions/:version/graph',
  spaceVersionKeyframeScreenshot:
    '/api/goal-space/spaces/:spaceId/versions/:version/keyframes/:keyframeId/screenshot',
  spaceVersionOpenCodePack:
    '/api/goal-space/spaces/:spaceId/versions/:version/opencode-pack',
  spaceVersionIndexesRebuild:
    '/api/goal-space/spaces/:spaceId/versions/:version/indexes:rebuild',
  spaceSummary: '/api/goal-space/spaces/:spaceId/summary',
  spaceSummaryGenerate: '/api/goal-space/spaces/:spaceId/summary:generate',
} as const;

export interface GoalSpaceHealthResponse {
  ok: boolean;
  service?: string;
}

export type GoalSpaceSessionResponse = CaptureSession;
export type GoalSpaceKeyframeResponse = DraftKeyframe;
export type GoalSpaceTransitionResponse = DraftTransition;
export type GoalSpaceSubmitResponse = SubmitCaptureSessionResult;
export type GoalSpaceListSpacesResponse = GoalSpaceSummary[];
export type GoalSpaceListVersionsResponse = GoalSpaceVersionMeta[];
export type GoalSpaceVersionMetaResponse = GoalSpaceVersionMeta;
export type GoalSpaceGraphResponse = GoalSpaceGraph;
export type GoalSpaceOpenCodePackResponse = OpenCodePackManifest;
export type GoalSpaceRetrieveResponse = ContextPack;

/** POST /sessions/:id/visual-match body */
export interface SessionVisualMatchRequest {
  screenshotBase64: string;
  maxCandidates?: number;
}

export type { GuidedActInput, GuidedActResult } from '../models/guided-act.js';
export type { KeyframeNote } from '../models/keyframe-note.js';

/** POST /retrieve body ≡ GoalSpaceRetrieveQuery；响应 ≡ ContextPack */
export type { GoalSpaceRetrieveQuery } from '../models/retrieve.js';
export type { RebuildGoalSpaceIndexResult } from '../models/index-rebuild.js';
export type {
  GoalSpaceSpaceSummary,
  PutGoalSpaceSpaceSummaryInput,
  GenerateGoalSpaceSpaceSummaryInput,
} from '../models/space-summary.js';
