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
  PreconditionTurn,
  ToolCall,
} from '../models/turns.js';
import {
  bindJudgeSuccessAsCandidate,
  bindJudgeSuccessAsCaseTailGolden,
  isCaseTailInstruction,
  readExpectationEvidence,
  visualEvidenceToStored,
} from '../models/visual-evidence.js';
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
import {
  compileVisualEvidence,
  resolveVisualEvidenceMode,
} from './evidence-compiler.js';
import { parseAct, parseJudge, parsePrecondition } from './parse-phase.js';
import { askPhaseLlm } from './phase-llm.js';
import { expectationText, hasPreconditions } from './system-prompt.js';
import { persistVisualEvidencePng } from './visual-evidence-store.js';

export { ACT_NL_TOOL, summarizeMidsceneResult } from './act-nl.js';
export { parseAct, parseJudge, parsePrecondition } from './parse-phase.js';

export interface CreateAgentLoopOptions extends OpenCodeHttpOptions {
  client?: OpenCodeHttpClient;
  executor?: ExecutorHttpClient;
  executorOptions?: ExecutorHttpOptions;
  /** act→judge 最大轮次；默认 8 */
  maxRounds?: number;
  /** 连续 judge 未满足（unsatisfied）上限；默认 3，连续达到后直接 failed 并中止 Midscene */
  maxJudgeFailures?: number;
  /** 连续 precondition 修复次数上限；默认 3 */
  maxPreconditionFailures?: number;
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
  const maxPreconditionFailures = (() => {
    const raw =
      options.maxPreconditionFailures ??
      Number(process.env.AGENT_MAX_PRECONDITION_FAILURES ?? 3);
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

  function log(
    level: 'info' | 'warn' | 'error',
    msg: string,
    extra?: Record<string, unknown>,
  ): void {
    const suffix =
      extra && Object.keys(extra).length
        ? ` ${JSON.stringify(extra)}`
        : '';
    const line = `[agent-loop] ${msg}${suffix}`;
    if (level === 'warn') console.warn(line);
    else if (level === 'error') console.error(line);
    else console.log(line);
  }

  /** SSE 过大时浏览器 EventSource 会丢事件；限制图片 dataUrl */
  const SSE_IMAGE_MAX_CHARS = Number(
    process.env.AGENT_SSE_IMAGE_MAX_CHARS ?? 120_000,
  );

  function sseSafeImage(
    dataUrl: string | undefined,
    kind: string,
  ): string | undefined {
    if (!dataUrl) return undefined;
    if (
      Number.isFinite(SSE_IMAGE_MAX_CHARS) &&
      SSE_IMAGE_MAX_CHARS > 0 &&
      dataUrl.length > SSE_IMAGE_MAX_CHARS
    ) {
      log('warn', `SSE omit ${kind} image`, {
        len: dataUrl.length,
        max: SSE_IMAGE_MAX_CHARS,
      });
      return undefined;
    }
    return dataUrl;
  }

  function emit(event: AgentLoopEvent): void {
    try {
      log('info', `emit ${event.type}`, {
        episodeId: event.episodeId,
        instructionId: event.instructionId,
        streamId: event.streamId,
        round: event.round,
        ...(event.type === 'turn.act'
          ? { next: event.next, command: event.command?.slice(0, 80) }
          : {}),
        ...(event.type === 'turn.judge'
          ? { satisfied: event.satisfied }
          : {}),
        ...(event.type === 'turn.visual_evidence'
          ? {
              evidenceId: event.evidenceId,
              regions: event.regions?.length,
              hasAnnotated: Boolean(event.annotatedDataUrl),
              hasScreenshot: Boolean(event.screenshotDataUrl),
              bindAsCandidate: event.bindAsCandidate,
            }
          : {}),
      });
      onEvent?.(event);
    } catch (error) {
      log('error', `emit ${event.type} failed`, {
        message: error instanceof Error ? error.message : String(error),
      });
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

  async function doPrecondition(rec: EpisodeRecord): Promise<Episode> {
    throwIfAborted(rec);
    if (!hasPreconditions(rec.episode.instruction)) {
      rec.episode.status = 'acting';
      touch(rec);
      return doAct(rec);
    }

    rec.episode.status = 'checking_precondition';
    log('info', 'phase precondition start', {
      episodeId: rec.episode.episodeId,
      round: rec.episode.round,
    });
    const text = await askPhaseLlm(phaseLlm, rec, 'precondition');
    throwIfAborted(rec);
    const parsed = parsePrecondition(text);
    const turn: PreconditionTurn = {
      turnId: randomUUID(),
      at: nowIso(),
      ...parsed,
    };
    rec.episode.lastPrecondition = turn;
    appendTurn(rec, { kind: 'precondition', turn });

    const command = actNlCommand(turn.toolCalls);
    emit({
      ...baseEvent(rec),
      type: 'turn.precondition',
      met: turn.met,
      command,
      evidence: turn.evidence,
      reason: turn.reason,
    });

    if (turn.met) {
      rec.episode.consecutivePreconditionFailures = 0;
      rec.episode.status = 'acting';
      log('info', 'phase precondition met → act', {
        episodeId: rec.episode.episodeId,
      });
      touch(rec);
      return structuredClone(rec.episode);
    }

    const failures =
      (rec.episode.consecutivePreconditionFailures ?? 0) + 1;
    rec.episode.consecutivePreconditionFailures = failures;

    if (!command) {
      return await applyFail(
        rec,
        `precondition unmet and no recovery command: ${turn.reason ?? turn.evidence}`,
        true,
      );
    }
    if (failures >= maxPreconditionFailures) {
      return await applyFail(
        rec,
        `precondition unmet ${failures} consecutive times (limit ${maxPreconditionFailures}): ${turn.reason ?? turn.evidence}`,
        true,
      );
    }

    rec.dispatchOrigin = 'precondition';
    rec.episode.status = 'dispatching';
    // stash toolCalls on lastAct-compatible path: doDispatch reads lastAct
    rec.episode.lastAct = {
      turnId: turn.turnId,
      at: turn.at,
      raw: turn.raw,
      next: 'act',
      toolCalls: turn.toolCalls,
      evidence: turn.evidence,
    };
    log('info', 'phase precondition unmet → dispatch', {
      episodeId: rec.episode.episodeId,
      failures,
      command: command.slice(0, 80),
    });
    touch(rec);
    return structuredClone(rec.episode);
  }

  async function doAct(rec: EpisodeRecord): Promise<Episode> {
    throwIfAborted(rec);
    rec.episode.status = 'acting';
    log('info', 'phase act start', {
      episodeId: rec.episode.episodeId,
      round: rec.episode.round,
    });
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
    if (rec.episode.status === 'dispatching') {
      rec.dispatchOrigin = 'act';
    }
    log('info', 'phase act done', {
      episodeId: rec.episode.episodeId,
      next: act.next,
      nextStatus: rec.episode.status,
      command: command?.slice(0, 80),
    });
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
    log('info', 'phase dispatch start', {
      episodeId: rec.episode.episodeId,
      command: command?.slice(0, 80),
      viaPlayground: Boolean(runActNlViaPlayground),
    });
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
        log('info', 'dispatch fallback freeform', {
          episodeId: rec.episode.episodeId,
          requestId,
        });
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

    rec.episode.status =
      rec.dispatchOrigin === 'precondition'
        ? 'checking_precondition'
        : 'judging';
    rec.dispatchOrigin = undefined;
    log('info', 'phase dispatch done', {
      episodeId: rec.episode.episodeId,
      ok: first?.ok === true,
      durationMs: first?.durationMs,
      nextStatus: rec.episode.status,
    });
    touch(rec);
    return structuredClone(rec.episode);
  }

  async function maybeCompileVisualEvidence(
    rec: EpisodeRecord,
    judge: JudgeTurn,
    terminal: boolean,
  ): Promise<void> {
    const mode = resolveVisualEvidenceMode();
    log('info', 'visual evidence begin', {
      episodeId: rec.episode.episodeId,
      mode,
      terminal,
      satisfied: judge.satisfied,
      hasScreenshot: Boolean(rec.lastScreenshotBase64),
      actions: rec.episode.instruction.actions?.length ?? 0,
      hints: rec.episode.instruction.hints?.length ?? 0,
    });
    if (mode === 'off') {
      log('info', 'visual evidence skipped mode=off');
      return;
    }
    if (mode === 'final' && !terminal) {
      log('info', 'visual evidence skipped non-terminal (mode=final)');
      return;
    }
    if (mode === 'failed' && !(terminal && !judge.satisfied)) {
      log('info', 'visual evidence skipped (mode=failed, not failed terminal)');
      return;
    }
    if (rec.abortRequested) {
      log('warn', 'visual evidence skipped abortRequested');
      return;
    }

    const t0 = Date.now();
    try {
      const ve = await compileVisualEvidence({
        executor,
        instruction: rec.episode.instruction,
        episodeId: rec.episode.episodeId,
        phase: 'judge',
        textEvidence: judge.evidence,
        judgeSatisfied: judge.satisfied,
        screenshotBase64: rec.lastScreenshotBase64,
      });
      if (!ve) {
        log('warn', 'visual evidence null (no screenshot)', {
          episodeId: rec.episode.episodeId,
          ms: Date.now() - t0,
        });
        return;
      }
      rec.lastVisualEvidence = ve;

      // Judge 成功：末步直接 Golden；否则 candidate 待下游验证
      const bindOk = Boolean(judge.satisfied && ve.screenshot.dataUrl);
      const caseTail = isCaseTailInstruction(rec.episode.instruction.metadata);
      const bindAsGolden = bindOk && caseTail;
      const bindAsCandidate = bindOk && !caseTail;

      log('info', 'visual evidence compiled', {
        episodeId: rec.episode.episodeId,
        ms: Date.now() - t0,
        regions: ve.regions.length,
        hit: ve.regions.filter((r) => r.locateOk).length,
        bindAsCandidate,
        bindAsGolden,
        caseTail,
        annotatedLen: ve.annotated.dataUrl?.length ?? 0,
        screenshotLen: ve.screenshot.dataUrl?.length ?? 0,
      });

      const saved = persistVisualEvidencePng({
        evidenceId: ve.evidenceId,
        annotatedDataUrl: ve.annotated.dataUrl,
        screenshotDataUrl: ve.screenshot.dataUrl,
      });
      let localPath: string | undefined;
      let fileUrl: string | undefined;
      let imageHttpUrl: string | undefined;
      if (saved) {
        localPath = saved.localPath;
        fileUrl = saved.fileUrl;
        imageHttpUrl = saved.httpUrl;
        log('info', 'visual evidence persisted', {
          evidenceId: ve.evidenceId,
          kind: saved.kind,
          localPath: saved.localPath,
          httpUrl: saved.httpUrl,
        });
      } else {
        log('warn', 'visual evidence persist failed', {
          evidenceId: ve.evidenceId,
        });
      }

      if (bindOk) {
        const caseId =
          typeof rec.episode.instruction.metadata?.caseId === 'string'
            ? rec.episode.instruction.metadata.caseId
            : undefined;
        const stored = visualEvidenceToStored(ve, {
          caseId,
          round: rec.episode.round,
          judgeReason: judge.reason,
          reviewStatus: caseTail ? 'approved' : 'pending',
          reviewer: caseTail ? 'case-tail' : 'judge-pass',
          reviewNote: caseTail
            ? 'last instruction — no successor required'
            : 'awaiting successor instruction success',
          validation: caseTail
            ? {
                status: 'true_positive',
                validatedAt: new Date().toISOString(),
                note: '末步无需下游验证；Judge 成功即 Golden',
              }
            : {
                status: 'awaiting_successor',
                note: '本步成功态是下一步初始条件；待下游 Instruction 成功后升为 Golden',
              },
          assets: {
            imageHttpUrl,
            localPath,
            fileUrl,
          },
        });
        const prev = readExpectationEvidence(
          rec.episode.instruction.metadata,
        );
        const snap = expectationText(rec.episode.instruction);
        const meta = {
          ...(rec.episode.instruction.metadata ?? {}),
          expectationEvidence: caseTail
            ? bindJudgeSuccessAsCaseTailGolden(prev, stored, snap)
            : bindJudgeSuccessAsCandidate(prev, stored, snap),
        };
        rec.episode.instruction = {
          ...rec.episode.instruction,
          metadata: meta,
        };
        log('info', 'visual evidence bound', {
          episodeId: rec.episode.episodeId,
          evidenceId: ve.evidenceId,
          as: caseTail ? 'golden(case-tail)' : 'candidate',
          imageHttpUrl,
        });
      }

      const annotatedDataUrl = sseSafeImage(ve.annotated.dataUrl, 'annotated');
      let screenshotDataUrl: string | undefined;
      if (!saved && !annotatedDataUrl) {
        screenshotDataUrl = sseSafeImage(ve.screenshot.dataUrl, 'screenshot');
      }

      emit({
        ...baseEvent(rec),
        type: 'turn.visual_evidence',
        evidenceId: ve.evidenceId,
        annotatedDataUrl,
        screenshotDataUrl,
        localPath,
        fileUrl,
        imageHttpUrl,
        regions: ve.regions.map((r) => ({
          id: r.id,
          label: r.label,
          phrase: r.phrase,
          locateOk: r.locateOk,
        })),
        judgeSatisfied: judge.satisfied,
        bindAsCandidate,
        bindAsGolden,
      });
    } catch (error) {
      log('error', 'visual evidence failed', {
        episodeId: rec.episode.episodeId,
        ms: Date.now() - t0,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function doJudge(rec: EpisodeRecord): Promise<Episode> {
    throwIfAborted(rec);
    rec.episode.status = 'judging';
    log('info', 'phase judge start', {
      episodeId: rec.episode.episodeId,
      round: rec.episode.round,
    });
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
      preconditionMet: judge.preconditionMet,
    });

    if (judge.satisfied) {
      rec.episode.consecutiveJudgeFailures = 0;
      rec.episode.status = 'completed';
      // VE 在 completed 之前：对话顺序 judge → VE → completed；locate 已有超时
      await maybeCompileVisualEvidence(rec, judge, true);
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
      log('info', 'judge unsatisfied', {
        episodeId: rec.episode.episodeId,
        consecutiveFailures,
        maxJudgeFailures,
        continue: judge.continue,
      });

      if (consecutiveFailures >= maxJudgeFailures) {
        await maybeCompileVisualEvidence(rec, judge, true);
        return await applyFail(
          rec,
          `judge unsatisfied ${consecutiveFailures} consecutive times (limit ${maxJudgeFailures}): ${judge.reason}`,
          true,
        );
      }
      if (judge.continue !== false && round < maxRounds) {
        // Judge 失败 → 回到 precondition（分步），不要直接塞满 act 上下文
        rec.episode.status = 'checking_precondition';
        if (resolveVisualEvidenceMode() === 'always') {
          await maybeCompileVisualEvidence(rec, judge, false);
        }
      } else {
        await maybeCompileVisualEvidence(rec, judge, true);
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
        consecutivePreconditionFailures: 0,
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
      // 首相位：有 preconditions 则先检查，否则直接 act
      rec.episode.status = hasPreconditions(instruction)
        ? 'checking_precondition'
        : 'acting';
      touch(rec);
      if (rec.streamId && pendingAbortStreamIds.has(rec.streamId)) {
        pendingAbortStreamIds.delete(rec.streamId);
        return applyAbort(rec, 'aborted by user (pending)');
      }
      return structuredClone(episode);
    },

    async runInstruction(instruction) {
      const t0 = Date.now();
      log('info', 'runInstruction start', {
        instructionId: instruction.instructionId,
        streamId: streamIdOf(instruction),
        expectation: expectationText(instruction).slice(0, 80),
        actions: instruction.actions?.length ?? 0,
      });
      const episode = await port.openEpisode(instruction);
      const rec = get(episode.episodeId);
      try {
        while (!isTerminal(rec.episode.status)) {
          if (rec.abortRequested) {
            applyAbort(rec);
            break;
          }
          log('info', 'advance', {
            episodeId: episode.episodeId,
            status: rec.episode.status,
            round: rec.episode.round,
          });
          await port.advance(episode.episodeId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'EPISODE_ABORTED' || rec.abortRequested) {
          applyAbort(rec);
        } else {
          log('error', 'runInstruction error', { message });
          throw error;
        }
      }
      const result = toInstructionResult(rec);
      log('info', 'runInstruction done', {
        episodeId: episode.episodeId,
        status: result.status,
        satisfied: result.satisfied,
        ms: Date.now() - t0,
        hasVisualEvidence: Boolean(result.visualEvidence),
      });
      return result;
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
        if (status === 'checking_precondition') {
          const last = rec.episode.turns[rec.episode.turns.length - 1];
          // dispatch 回来后 last 是 tool_result → 再检查 precondition
          if (last?.kind === 'precondition' && last.turn.met) {
            return await doAct(rec);
          }
          if (
            last?.kind === 'precondition' &&
            !last.turn.met &&
            actNlCommand(last.turn.toolCalls)
          ) {
            return await doDispatch(rec);
          }
          return await doPrecondition(rec);
        }

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
          // judge 失败后 status 已改为 checking_precondition；此处仅处理待执行 judge
          if (last?.kind === 'judge') {
            return await doPrecondition(rec);
          }
          return await doJudge(rec);
        }

        return await doPrecondition(rec);
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
        return phase === 'precondition'
          ? await doPrecondition(rec)
          : phase === 'act'
            ? await doAct(rec)
            : await doJudge(rec);
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
