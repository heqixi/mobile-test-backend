/**
 * @module @mtp/domain-goal-space/adapters/goal-space-http-client
 *
 * 远程 Goal Space 服务客户端；供 domain-case / domain-agent 使用。
 */

import type { CaptureSession } from '../models/capture-session.js';
import type { ContextPack } from '../models/context-pack.js';
import type {
  GoalSpaceGraph,
  GoalSpaceSummary,
  GoalSpaceVersionMeta,
} from '../models/goal-space.js';
import type {
  GenerateGoalSpaceSpaceSummaryInput,
  GoalSpaceSpaceSummary,
  PutGoalSpaceSpaceSummaryInput,
} from '../models/space-summary.js';
import type { DraftKeyframe } from '../models/keyframe.js';
import type {
  MarkKeyframeInput,
  RecordTransitionInput,
  UpdateDraftKeyframeInput,
  UpdateDraftTransitionInput,
  CreateCaptureSessionInput,
} from '../models/capture-session.js';
import type { GoalSpaceRetrieveQuery } from '../models/retrieve.js';
import type { SubmitCaptureSessionInput, SubmitCaptureSessionResult } from '../models/submit.js';
import type { DraftTransition } from '../models/transition.js';
import type { VisualMatchResult } from '../models/visual-match.js';
import type { GoalSpaceRetrievePort } from '../ports/goal-space-retrieve-port.js';
import {
  goalSpacePaths,
  type SessionVisualMatchRequest,
} from '../protocol/goal-space-http.js';
import { GoalSpaceDomainError } from '../errors.js';

export interface GoalSpaceHttpClientOptions {
  baseUrl: string;
  /** 默认 15000 */
  timeoutMs?: number;
}

export interface GoalSpaceHttpClient extends GoalSpaceRetrievePort {
  readonly baseUrl: string;
  health(): Promise<{ ok: boolean; service?: string }>;
  listSpaces(): Promise<GoalSpaceSummary[]>;
  listVersions(spaceId: string): Promise<GoalSpaceVersionMeta[]>;
  getGraph(spaceId: string, version: string): Promise<GoalSpaceGraph>;
  createSession(input: CreateCaptureSessionInput): Promise<CaptureSession>;
  getSession(sessionId: string): Promise<CaptureSession>;
  listOpenSessions(spaceId?: string): Promise<CaptureSession[]>;
  purgeAbandonedSessions(spaceId?: string): Promise<{
    purgedSessionIds: string[];
  }>;
  markKeyframe(
    sessionId: string,
    input: MarkKeyframeInput,
  ): Promise<DraftKeyframe>;
  updateKeyframe(
    sessionId: string,
    keyframeId: string,
    patch: UpdateDraftKeyframeInput,
  ): Promise<DraftKeyframe>;
  deleteKeyframe(
    sessionId: string,
    keyframeId: string,
  ): Promise<CaptureSession>;
  recordTransition(
    sessionId: string,
    input: RecordTransitionInput,
  ): Promise<DraftTransition>;
  updateTransition(
    sessionId: string,
    transitionId: string,
    patch: UpdateDraftTransitionInput,
  ): Promise<DraftTransition>;
  submit(
    sessionId: string,
    input?: Partial<SubmitCaptureSessionInput>,
  ): Promise<SubmitCaptureSessionResult>;
  discardSession(sessionId: string): Promise<void>;
  visualMatchSession(
    sessionId: string,
    input: SessionVisualMatchRequest,
  ): Promise<VisualMatchResult>;
  keyframeScreenshotUrl(sessionId: string, keyframeId: string): string;
  getSpaceSummary(spaceId: string): Promise<GoalSpaceSpaceSummary | null>;
  putSpaceSummary(
    spaceId: string,
    input: PutGoalSpaceSpaceSummaryInput,
  ): Promise<GoalSpaceSpaceSummary>;
  generateSpaceSummary(
    spaceId: string,
    input?: GenerateGoalSpaceSpaceSummaryInput,
  ): Promise<GoalSpaceSpaceSummary>;
  retrieve(query: GoalSpaceRetrieveQuery): Promise<ContextPack>;
}

export function createGoalSpaceHttpClient(
  options: GoalSpaceHttpClientOptions,
): GoalSpaceHttpClient {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const timeoutMs = options.timeoutMs ?? 15_000;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    overrideTimeoutMs?: number,
  ): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(
      () => ctrl.abort(),
      overrideTimeoutMs ?? timeoutMs,
    );
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      let data: unknown = {};
      if (text.trim()) {
        try {
          data = JSON.parse(text) as unknown;
        } catch {
          data = { message: text };
        }
      }
      if (!res.ok) {
        const err = data as { code?: string; message?: string };
        throw new GoalSpaceDomainError(
          (err.code as never) ?? 'RETRIEVE_FAILED',
          err.message ?? `HTTP ${res.status}`,
          { details: { status: res.status, path } },
        );
      }
      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    baseUrl,
    health: () => request('GET', goalSpacePaths.health),
    listSpaces: () => request('GET', goalSpacePaths.spaces),
    listVersions: (spaceId) =>
      request('GET', goalSpacePaths.spaceVersions(spaceId)),
    getGraph: (spaceId, version) =>
      request('GET', goalSpacePaths.spaceVersionGraph(spaceId, version)),
    createSession: (input) =>
      request('POST', goalSpacePaths.sessions, input),
    getSession: (sessionId) =>
      request('GET', goalSpacePaths.session(sessionId)),
    listOpenSessions: (spaceId) => {
      const q = spaceId ? `?spaceId=${encodeURIComponent(spaceId)}` : '';
      return request('GET', `${goalSpacePaths.sessions}${q}`);
    },
    markKeyframe: (sessionId, input) =>
      request('POST', goalSpacePaths.sessionKeyframes(sessionId), input),
    updateKeyframe: (sessionId, keyframeId, patch) =>
      request(
        'PATCH',
        goalSpacePaths.sessionKeyframe(sessionId, keyframeId),
        patch,
      ),
    deleteKeyframe: (sessionId, keyframeId) =>
      request('DELETE', goalSpacePaths.sessionKeyframe(sessionId, keyframeId)),
    recordTransition: (sessionId, input) =>
      request('POST', goalSpacePaths.sessionTransitions(sessionId), input),
    updateTransition: (sessionId, transitionId, patch) =>
      request(
        'PATCH',
        goalSpacePaths.sessionTransition(sessionId, transitionId),
        patch,
      ),
    submit: (sessionId, input) =>
      request('POST', goalSpacePaths.sessionSubmit(sessionId), input ?? {}),
    discardSession: async (sessionId) => {
      await request('POST', goalSpacePaths.sessionDiscard(sessionId), {});
    },
    purgeAbandonedSessions: (spaceId?: string) => {
      const q = spaceId
        ? `?spaceId=${encodeURIComponent(spaceId)}`
        : '';
      return request<{ purgedSessionIds: string[] }>(
        'POST',
        `${goalSpacePaths.sessionsPurge}${q}`,
      );
    },
    visualMatchSession: (sessionId, input) =>
      request('POST', goalSpacePaths.sessionVisualMatch(sessionId), input),
    keyframeScreenshotUrl: (sessionId, keyframeId) =>
      `${baseUrl}${goalSpacePaths.sessionKeyframeScreenshot(sessionId, keyframeId)}`,
    getSpaceSummary: async (spaceId) => {
      try {
        return await request<GoalSpaceSpaceSummary>(
          'GET',
          goalSpacePaths.spaceSummary(spaceId),
        );
      } catch (err) {
        if (
          err instanceof GoalSpaceDomainError &&
          (err.code === 'SPACE_NOT_FOUND' ||
            err.code === 'VERSION_NOT_FOUND' ||
            Number(err.details?.status) === 404)
        ) {
          return null;
        }
        throw err;
      }
    },
    putSpaceSummary: (spaceId, input) =>
      request('PUT', goalSpacePaths.spaceSummary(spaceId), input),
    generateSpaceSummary: (spaceId, input) =>
      request(
        'POST',
        goalSpacePaths.spaceSummaryGenerate(spaceId),
        input ?? {},
        90_000,
      ),
    retrieve: (query) =>
      request('POST', goalSpacePaths.retrieve, query),
  };
}
