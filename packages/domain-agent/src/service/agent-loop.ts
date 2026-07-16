/**
 * @module @mtp/domain-agent/service/agent-loop
 *
 * # Agent Loop：act → (dispatch act_nl) → judge → …
 *
 * 本文件只保留状态机编排；解析 / prompt / Episode 记录见同目录其它模块。
 */

import { randomUUID } from 'node:crypto';
import type { OpaqueJson, UUID } from '@mtp/shared-kernel';
import {
  createExecutorHttpClient,
  type ExecutorHttpClient,
  type ExecutorHttpOptions,
} from '../adapters/executor-http.js';
import {
  createOpenCodeHttpClient,
  type OpenCodeHttpClient,
  type OpenCodeHttpOptions,
} from '../adapters/opencode-http.js';
import type { Episode } from '../models/episode.js';
import type {
  AgentLoopEvent,
  AgentLoopEventListener,
} from '../models/agent-event.js';
import type {
  ActTurn,
  JudgeTurn,
  ObservationTurn,
  ToolCall,
} from '../models/turns.js';
import type { AgentPort } from '../ports/agent-port.js';
import type { LlmPhase } from '../ports/external-llm-port.js';
import {
  ACT_NL_TOOL,
  actNlCommand,
  summarizeMidsceneResult,
} from './act-nl.js';
import {
  appendTurn,
  baseEvent,
  expectationPreview,
  nowIso,
  requireEpisode,
  resolveOpenCodeModel,
  streamIdOf,
  toInstructionResult,
  touch,
  type EpisodeRecord,
} from './episode-record.js';
import { parseAct, parseJudge } from './parse-phase.js';
import { askPhaseLlm } from './phase-llm.js';

export { ACT_NL_TOOL, summarizeMidsceneResult } from './act-nl.js';
export { parseAct, parseJudge } from './parse-phase.js';

export interface CreateAgentLoopOptions extends OpenCodeHttpOptions {
  client?: OpenCodeHttpClient;
  executor?: ExecutorHttpClient;
  executorOptions?: ExecutorHttpOptions;
  /** act→judge 最大轮次；默认 8 */
  maxRounds?: number;
  /** 连续 judge 未满足（unsatisfied）上限；默认 3，连续达到后直接 failed 并中止 Midscene */
  maxJudgeFailures?: number;
  onEvent?: AgentLoopEventListener;
  model?: { providerID: string; modelID: string };
  /**
   * act_nl 优先交给前端 Playground；返回 null 时回退 executor.freeformExecute。
   */
  runActNlViaPlayground?: (input: {
    command: string;
    requestId: string;
  }) => Promise<{
    ok: boolean;
    prompt: string;
    durationMs?: number;
    result?: unknown;
    error?: string;
  } | null>;
  /** 用户 abort 时取消等待中的 Playground run */
  cancelPlaygroundRun?: (requestId: string) => void;
}

export function createAgentLoop(
  options: CreateAgentLoopOptions = {},
): AgentPort {
  const client = options.client ?? createOpenCodeHttpClient(options);
  const executor =
    options.executor ?? createExecutorHttpClient(options.executorOptions);
  const maxRounds = options.maxRounds ?? 8;
  const maxJudgeFailures = (() => {
    const raw =
      options.maxJudgeFailures ??
      Number(process.env.AGENT_MAX_JUDGE_FAILURES ?? 3);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
  })();
  const onEvent = options.onEvent;
  const openCodeModel = resolveOpenCodeModel(options.model);
  const runActNlViaPlayground = options.runActNlViaPlayground;
  const cancelPlaygroundRun = options.cancelPlaygroundRun;
  const episodes = new Map<UUID, EpisodeRecord>();
  /** Stop 早于 openEpisode 时登记，open 后立即 abort */
  const pendingAbortStreamIds = new Set<string>();

  const phaseLlm = {
    client,
    executor,
    openCodeModel,
    onEvent,
  };

  function emit(event: AgentLoopEvent): void {
    try {
      onEvent?.(event);
    } catch {
      // ignore
    }
  }

  async function stopMidscene(rec: EpisodeRecord): Promise<void> {
    const playgroundId = rec.activePlaygroundRequestId;
    if (playgroundId) {
      try {
        cancelPlaygroundRun?.(playgroundId);
      } catch {
        // ignore
      }
      rec.activePlaygroundRequestId = undefined;
    }
    try {
      await executor.abort('judge failure limit');
    } catch {
      // ignore
    }
  }

  async function applyFail(
    rec: EpisodeRecord,
    reason: string,
    stopDevice = false,
  ): Promise<Episode> {
    if (isTerminal(rec.episode.status)) {
      return structuredClone(rec.episode);
    }
    rec.abortRequested = true;
    rec.episode.status = 'failed';
    touch(rec);
    if (stopDevice) {
      await stopMidscene(rec);
    }
    emit({
      ...baseEvent(rec),
      type: 'episode.failed',
      reason,
    });
    return structuredClone(rec.episode);
  }

  function get(episodeId: UUID): EpisodeRecord {
    return requireEpisode(episodes, episodeId);
  }

  function isTerminal(status: Episode['status']): boolean {
    return (
      status === 'completed' || status === 'failed' || status === 'aborted'
    );
  }

  function applyAbort(rec: EpisodeRecord, reason = 'aborted by user'): Episode {
    if (isTerminal(rec.episode.status) && rec.episode.status !== 'aborted') {
      return structuredClone(rec.episode);
    }
    const already = rec.episode.status === 'aborted';
    rec.abortRequested = true;
    rec.episode.status = 'aborted';
    const playgroundId = rec.activePlaygroundRequestId;
    if (playgroundId) {
      try {
        cancelPlaygroundRun?.(playgroundId);
      } catch {
        // ignore
      }
      rec.activePlaygroundRequestId = undefined;
    }
    touch(rec);
    if (!already) {
      emit({
        ...baseEvent(rec),
        type: 'episode.aborted',
        reason,
      });
    }
    return structuredClone(rec.episode);
  }

  function throwIfAborted(rec: EpisodeRecord): void {
    if (rec.abortRequested || rec.episode.status === 'aborted') {
      applyAbort(rec);
      throw new Error('EPISODE_ABORTED');
    }
  }

  async function doAct(rec: EpisodeRecord): Promise<Episode> {
    throwIfAborted(rec);
    rec.episode.status = 'acting';
    const text = await askPhaseLlm(phaseLlm, rec, 'act');
    throwIfAborted(rec);
    const parsed = parseAct(text);
    const act: ActTurn = {
      turnId: randomUUID(),
      at: nowIso(),
      ...parsed,
    };
    rec.episode.lastAct = act;
    appendTurn(rec, { kind: 'act', turn: act });

    const command = actNlCommand(act.toolCalls);
    emit({
      ...baseEvent(rec),
      type: 'turn.act',
      next: act.next,
      command,
      evidence: act.evidence,
    });

    rec.episode.status =
      act.next === 'act' && command ? 'dispatching' : 'judging';
    touch(rec);
    return structuredClone(rec.episode);
  }

  async function doDispatch(
    rec: EpisodeRecord,
    toolCalls?: OpaqueJson,
  ): Promise<Episode> {
    throwIfAborted(rec);
    rec.episode.status = 'dispatching';

    let calls: ToolCall[] = rec.episode.lastAct?.toolCalls ?? [];
    if (Array.isArray(toolCalls)) {
      calls = toolCalls as ToolCall[];
    }

    const command = actNlCommand(calls);
    let results: OpaqueJson[];

    if (!command) {
      results = [
        { ok: false, name: ACT_NL_TOOL, error: 'empty act_nl command' },
      ];
    } else {
      const requestId = randomUUID();
      emit({
        ...baseEvent(rec),
        type: 'turn.playground_run',
        requestId,
        command,
      });

      rec.activePlaygroundRequestId = requestId;
      let freeform = runActNlViaPlayground
        ? await runActNlViaPlayground({ command, requestId })
        : null;
      rec.activePlaygroundRequestId = undefined;
      throwIfAborted(rec);

      if (!freeform) {
        freeform = await executor.freeformExecute(command);
        throwIfAborted(rec);
      }

      results = [
        {
          ok: freeform.ok,
          name: ACT_NL_TOOL,
          prompt: freeform.prompt,
          durationMs: freeform.durationMs,
          result: summarizeMidsceneResult(freeform.result) ?? null,
          error: freeform.error,
          requestId,
        },
      ];
    }

    appendTurn(rec, { kind: 'tool_result', at: nowIso(), results });

    const first = results[0] as {
      ok?: boolean;
      error?: string;
      durationMs?: number;
      result?: unknown;
      prompt?: string;
    };
    emit({
      ...baseEvent(rec),
      type: 'turn.tool_result',
      ok: first?.ok === true,
      command: first?.prompt ?? command,
      durationMs: first?.durationMs,
      error: first?.error,
      resultPreview: summarizeMidsceneResult(first?.result),
    });

    rec.episode.status = 'judging';
    touch(rec);
    return structuredClone(rec.episode);
  }

  async function doJudge(rec: EpisodeRecord): Promise<Episode> {
    throwIfAborted(rec);
    rec.episode.status = 'judging';
    const text = await askPhaseLlm(phaseLlm, rec, 'judge');
    throwIfAborted(rec);
    const parsed = parseJudge(text);
    const judge: JudgeTurn = {
      turnId: randomUUID(),
      at: nowIso(),
      ...parsed,
    };
    rec.episode.lastJudge = judge;
    appendTurn(rec, { kind: 'judge', turn: judge });

    const round = (rec.episode.round ?? 0) + 1;
    rec.episode.round = round;

    emit({
      ...baseEvent(rec),
      type: 'turn.judge',
      satisfied: judge.satisfied,
      reason: judge.reason,
      evidence: judge.evidence,
      continue: judge.continue,
    });

    if (judge.satisfied) {
      rec.episode.consecutiveJudgeFailures = 0;
      rec.episode.status = 'completed';
      emit({
        ...baseEvent(rec),
        type: 'episode.completed',
        satisfied: true,
        reason: judge.reason,
      });
    } else {
      const consecutiveFailures =
        (rec.episode.consecutiveJudgeFailures ?? 0) + 1;
      rec.episode.consecutiveJudgeFailures = consecutiveFailures;

      if (consecutiveFailures >= maxJudgeFailures) {
        return await applyFail(
          rec,
          `judge unsatisfied ${consecutiveFailures} consecutive times (limit ${maxJudgeFailures}): ${judge.reason}`,
          true,
        );
      }
      if (judge.continue !== false && round < maxRounds) {
        rec.episode.status = 'acting';
      } else {
        return await applyFail(rec, judge.reason, true);
      }
    }
    touch(rec);
    return structuredClone(rec.episode);
  }

  const port: AgentPort = {
    async openEpisode(instruction) {
      const session = await client.createSession({
        title: `ep-${instruction.instructionId.slice(0, 8)}`,
      });
      const ts = nowIso();
      const episode: Episode = {
        episodeId: randomUUID(),
        status: 'open',
        instruction,
        turns: [],
        round: 0,
        consecutiveJudgeFailures: 0,
        createdAt: ts,
        updatedAt: ts,
      };
      const rec: EpisodeRecord = {
        episode,
        openCodeSessionId: session.id,
        systemPromptSent: false,
        streamId: streamIdOf(instruction),
        abortRequested: false,
      };
      episodes.set(episode.episodeId, rec);
      emit({
        ...baseEvent(rec),
        type: 'episode.started',
        expectationPreview: expectationPreview(instruction),
      });
      if (rec.streamId && pendingAbortStreamIds.has(rec.streamId)) {
        pendingAbortStreamIds.delete(rec.streamId);
        return applyAbort(rec, 'aborted by user (pending)');
      }
      return structuredClone(episode);
    },

    async runInstruction(instruction) {
      const episode = await port.openEpisode(instruction);
      const rec = get(episode.episodeId);
      try {
        while (!isTerminal(rec.episode.status)) {
          if (rec.abortRequested) {
            applyAbort(rec);
            break;
          }
          await port.advance(episode.episodeId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'EPISODE_ABORTED' || rec.abortRequested) {
          applyAbort(rec);
        } else {
          throw error;
        }
      }
      return toInstructionResult(rec);
    },

    async advance(episodeId) {
      const rec = get(episodeId);
      const { status } = rec.episode;

      if (isTerminal(status)) {
        return structuredClone(rec.episode);
      }
      if (rec.abortRequested) {
        return applyAbort(rec);
      }

      try {
        if (status === 'open' || status === 'acting') {
          const last = rec.episode.turns[rec.episode.turns.length - 1];
          if (status === 'acting' && last?.kind === 'act') {
            if (
              rec.episode.lastAct?.next === 'act' &&
              actNlCommand(rec.episode.lastAct.toolCalls)
            ) {
              return await doDispatch(rec);
            }
            return await doJudge(rec);
          }
          return await doAct(rec);
        }

        if (status === 'dispatching') return await doDispatch(rec);

        if (status === 'judging') {
          const last = rec.episode.turns[rec.episode.turns.length - 1];
          if (last?.kind === 'judge') return await doAct(rec);
          return await doJudge(rec);
        }

        return await doAct(rec);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'EPISODE_ABORTED') {
          return applyAbort(rec);
        }
        throw error;
      }
    },

    async askLlm(episodeId, phase: LlmPhase) {
      const rec = get(episodeId);
      if (rec.abortRequested || isTerminal(rec.episode.status)) {
        return structuredClone(rec.episode);
      }
      try {
        return phase === 'act' ? await doAct(rec) : await doJudge(rec);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'EPISODE_ABORTED') {
          return applyAbort(rec);
        }
        throw error;
      }
    },

    async dispatchTools(episodeId, toolCalls) {
      const rec = get(episodeId);
      if (rec.abortRequested || isTerminal(rec.episode.status)) {
        return structuredClone(rec.episode);
      }
      try {
        return await doDispatch(rec, toolCalls);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'EPISODE_ABORTED') {
          return applyAbort(rec);
        }
        throw error;
      }
    },

    async ingest(episodeId, payload) {
      const rec = get(episodeId);
      await client.postText(
        rec.openCodeSessionId,
        `Observation ingest (opaque JSON):\n${JSON.stringify(payload)}`,
        { noReply: true },
      );
      const obs: ObservationTurn = {
        kind: 'observation',
        at: nowIso(),
        payload: payload as OpaqueJson,
      };
      appendTurn(rec, obs);
      return structuredClone(rec.episode);
    },

    async closeEpisode(episodeId) {
      const rec = get(episodeId);
      if (!isTerminal(rec.episode.status)) {
        return applyAbort(rec, 'closed');
      }
      touch(rec);
      return structuredClone(rec.episode);
    },

    async abortEpisode(episodeId) {
      return applyAbort(get(episodeId));
    },

    async abortByStreamId(streamId) {
      const needle = streamId.trim();
      if (!needle) return null;
      for (const rec of episodes.values()) {
        if (rec.streamId === needle && !isTerminal(rec.episode.status)) {
          pendingAbortStreamIds.delete(needle);
          return applyAbort(rec);
        }
      }
      for (const rec of episodes.values()) {
        if (rec.streamId === needle) {
          pendingAbortStreamIds.delete(needle);
          return structuredClone(rec.episode);
        }
      }
      // Episode 尚未 open：登记 pending，open 时立即 abort
      pendingAbortStreamIds.add(needle);
      return null;
    },

    async getEpisode(episodeId) {
      return structuredClone(get(episodeId).episode);
    },
  };

  return port;
}

/** @deprecated 使用 createAgentLoop */
export const createOpenCodeAgent = createAgentLoop;
