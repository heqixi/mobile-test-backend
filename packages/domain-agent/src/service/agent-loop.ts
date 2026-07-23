/**
 * @module @mtp/domain-agent/service/agent-loop
 *
 * # Agent Loop：plan ⇄ act
 *
 * 状态只表示下一步：`plan` | `act` | 终端。
 * 转移矩阵见 `loop/episode-fsm.ts`。
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
import type { ObservationTurn, PlanTurn } from '../models/turns.js';
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
  actTimeoutMsForKind,
  maxActionsForKind,
  type MidsceneActionKind,
} from '../models/midscene-action-kind.js';
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
import {
  isTerminalStatus,
  transitionFromAct,
  transitionFromPlan,
  type FsmLimits,
} from './loop/episode-fsm.js';
import { parsePlan } from './parse-phase.js';
import { askPhaseLlm, askPhaseLlmRepair } from './phase-llm.js';
import { expectationText } from './system-prompt.js';
import {
  buildCommandRepairPrompt,
  validateMidsceneNlCommand,
} from './validate-act-command.js';
import { persistVisualEvidencePng } from './visual-evidence-store.js';

export { ACT_NL_TOOL, summarizeMidsceneResult } from './act-nl.js';
export {
  parseAct,
  parseJudge,
  parsePlan,
  parsePrecondition,
} from './parse-phase.js';
export {
  buildCommandRepairPrompt,
  validateMidsceneNlCommand,
} from './validate-act-command.js';

export interface CreateAgentLoopOptions extends OpenCodeHttpOptions {
  client?: OpenCodeHttpClient;
  executor?: ExecutorHttpClient;
  executorOptions?: ExecutorHttpOptions;
  /** plan 最大轮次；默认 8（原 maxRounds） */
  maxRounds?: number;
  maxPlanRounds?: number;
  /** 连续 recovery 上限；默认 3 */
  maxRecovery?: number;
  maxPreconditionFailures?: number;
  /** 连续 Act 失败上限；默认 3 */
  maxActFailures?: number;
  /** @deprecated 映射到 maxActFailures */
  maxJudgeFailures?: number;
  onEvent?: AgentLoopEventListener;
  model?: { providerID: string; modelID: string };
  runActNlViaPlayground?: (input: {
    command: string;
    requestId: string;
    actionKind?: MidsceneActionKind;
    maxActions?: number;
    /** Playground 等结果超时；缺省用 hub 默认 */
    timeoutMs?: number;
  }) => Promise<{
    ok: boolean;
    prompt: string;
    durationMs?: number;
    result?: unknown;
    error?: string;
  } | null>;
  cancelPlaygroundRun?: (requestId: string) => void;
  /**
   * Business 组装层注入的 phase 上下文（不透明 markdown）。
   * 域内不依赖 Goal Space；由 agent-service 等绑定 retrieve。
   */
  enrichPhaseContext?: import('./phase-llm.js').EnrichPhaseContext;
}

function envLimit(
  option: number | undefined,
  envName: string,
  fallback: number,
): number {
  const raw = option ?? Number(process.env[envName] ?? fallback);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createAgentLoop(
  options: CreateAgentLoopOptions = {},
): AgentPort {
  const client = options.client ?? createOpenCodeHttpClient(options);
  const executor =
    options.executor ?? createExecutorHttpClient(options.executorOptions);

  const limits: FsmLimits = {
    maxPlanRounds: envLimit(
      options.maxPlanRounds ?? options.maxRounds,
      'AGENT_MAX_PLAN_ROUNDS',
      envLimit(options.maxRounds, 'AGENT_MAX_ROUNDS', 8),
    ),
    maxRecovery: envLimit(
      options.maxRecovery ?? options.maxPreconditionFailures,
      'AGENT_MAX_RECOVERY',
      envLimit(
        options.maxPreconditionFailures,
        'AGENT_MAX_PRECONDITION_FAILURES',
        3,
      ),
    ),
    maxIllegalRepairs: envLimit(
      undefined,
      'AGENT_MAX_COMMAND_REPAIRS',
      2,
    ),
    maxActFailures: envLimit(
      options.maxActFailures ?? options.maxJudgeFailures,
      'AGENT_MAX_ACT_FAILURES',
      envLimit(options.maxJudgeFailures, 'AGENT_MAX_JUDGE_FAILURES', 3),
    ),
  };

  const onEvent = options.onEvent;
  const openCodeModel = resolveOpenCodeModel(options.model);
  const runActNlViaPlayground = options.runActNlViaPlayground;
  const cancelPlaygroundRun = options.cancelPlaygroundRun;
  /** Midscene aiAct / Playground 执行超时基线（点击等；Input 另见 AGENT_ACT_INPUT_TIMEOUT_MS） */
  const actTimeoutMs = envLimit(
    undefined,
    'AGENT_ACT_TIMEOUT_MS',
    45_000,
  );
  /** act 结果返回后、下一轮 plan 截图前的稳定等待（默认 1s） */
  const postActScreenshotDelayMs = envLimit(
    undefined,
    'AGENT_POST_ACT_SCREENSHOT_DELAY_MS',
    1_000,
  );
  const episodes = new Map<UUID, EpisodeRecord>();
  const pendingAbortStreamIds = new Set<string>();

  const phaseLlm = {
    client,
    executor,
    openCodeModel,
    onEvent,
    enrichPhaseContext: options.enrichPhaseContext,
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
        ...(event.type === 'turn.plan'
          ? { strategy: event.strategy, command: event.command?.slice(0, 80) }
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
      await executor.abort('agent loop stop');
    } catch {
      // ignore
    }
  }

  async function applyFail(
    rec: EpisodeRecord,
    reason: string,
    stopDevice = false,
  ): Promise<Episode> {
    if (isTerminalStatus(rec.episode.status)) {
      return structuredClone(rec.episode);
    }
    rec.abortRequested = true;
    rec.episode.status = 'failed';
    rec.pendingCommand = undefined;
    rec.pendingActionKind = undefined;
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

  function applyAbort(rec: EpisodeRecord, reason = 'aborted by user'): Episode {
    if (isTerminalStatus(rec.episode.status) && rec.episode.status !== 'aborted') {
      return structuredClone(rec.episode);
    }
    const already = rec.episode.status === 'aborted';
    rec.abortRequested = true;
    rec.episode.status = 'aborted';
    rec.pendingCommand = undefined;
    rec.pendingActionKind = undefined;
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

  async function maybeCompileVisualEvidence(
    rec: EpisodeRecord,
    evidence: string,
    satisfied: boolean,
    terminal: boolean,
  ): Promise<void> {
    const mode = resolveVisualEvidenceMode();
    if (mode === 'off') return;
    if (mode === 'final' && !terminal) return;
    if (mode === 'failed' && !(terminal && !satisfied)) return;
    if (rec.abortRequested) return;

    const t0 = Date.now();
    try {
      const ve = await compileVisualEvidence({
        executor,
        instruction: rec.episode.instruction,
        episodeId: rec.episode.episodeId,
        phase: 'judge',
        textEvidence: evidence,
        judgeSatisfied: satisfied,
        screenshotBase64: rec.lastScreenshotBase64,
      });
      if (!ve) return;
      rec.lastVisualEvidence = ve;

      const bindOk = Boolean(satisfied && ve.screenshot.dataUrl);
      const caseTail = isCaseTailInstruction(rec.episode.instruction.metadata);
      const bindAsGolden = bindOk && caseTail;
      const bindAsCandidate = bindOk && !caseTail;

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
      }

      if (bindOk) {
        const caseId =
          typeof rec.episode.instruction.metadata?.caseId === 'string'
            ? rec.episode.instruction.metadata.caseId
            : undefined;
        const stored = visualEvidenceToStored(ve, {
          caseId,
          round: rec.episode.round,
          judgeReason: evidence,
          reviewStatus: caseTail ? 'approved' : 'pending',
          reviewer: caseTail ? 'case-tail' : 'plan-pass',
          reviewNote: caseTail
            ? 'last instruction — no successor required'
            : 'awaiting successor instruction success',
          validation: caseTail
            ? {
                status: 'true_positive',
                validatedAt: new Date().toISOString(),
                note: '末步无需下游验证；Plan pass 即 Golden',
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
        planPassed: satisfied,
        bindAsCandidate,
        bindAsGolden,
      });
      log('info', 'visual evidence done', {
        episodeId: rec.episode.episodeId,
        ms: Date.now() - t0,
        satisfied,
      });
    } catch (error) {
      log('error', 'visual evidence failed', {
        episodeId: rec.episode.episodeId,
        ms: Date.now() - t0,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function runPlan(rec: EpisodeRecord): Promise<Episode> {
    throwIfAborted(rec);
    rec.episode.status = 'plan';
    log('info', 'phase plan start', {
      episodeId: rec.episode.episodeId,
      round: rec.episode.round,
    });

    let text = await askPhaseLlm(phaseLlm, rec, 'plan');
    throwIfAborted(rec);
    let parsed = parsePlan(text);

    for (let repair = 0; repair <= limits.maxIllegalRepairs; repair++) {
      const needsCommand =
        parsed.strategy === 'act' || parsed.strategy === 'recovery';
      const check = needsCommand
        ? validateMidsceneNlCommand(parsed.command, { required: true })
        : parsed.strategy === 'illegal' || !parsed.evidence.trim()
          ? {
              ok: false as const,
              reason:
                parsed.strategy === 'illegal'
                  ? parsed.evidence || 'illegal strategy'
                  : 'evidence is required',
            }
          : { ok: true as const };

      if (check.ok && parsed.strategy !== 'illegal') break;

      if (repair >= limits.maxIllegalRepairs) {
        return await applyFail(
          rec,
          `plan illegal after ${repair} repairs: ${'reason' in check ? check.reason : parsed.evidence}`,
          true,
        );
      }

      const rejected =
        parsed.command ??
        (parsed.strategy === 'illegal' ? '(illegal)' : '(missing)');
      log('warn', 'plan rejected — re-prompt', {
        episodeId: rec.episode.episodeId,
        strategy: parsed.strategy,
        command: parsed.command,
        reason: 'reason' in check ? check.reason : 'illegal',
        repair: repair + 1,
      });
      const repairText = buildCommandRepairPrompt({
        phase: 'plan',
        rejectedCommand: rejected,
        reason: 'reason' in check ? check.reason : parsed.evidence,
        previousRaw: parsed.raw,
        evidence: parsed.evidence,
      });
      text = await askPhaseLlmRepair(phaseLlm, rec, 'plan', repairText);
      throwIfAborted(rec);
      parsed = parsePlan(text);
    }

    const turn: PlanTurn = {
      turnId: randomUUID(),
      at: nowIso(),
      ...parsed,
    };
    rec.episode.lastPlan = turn;
    appendTurn(rec, { kind: 'plan', turn });

    emit({
      ...baseEvent(rec),
      type: 'turn.plan',
      strategy: turn.strategy,
      command: turn.command,
      actionKind: turn.actionKind,
      maxActions: turn.actionKind
        ? maxActionsForKind(turn.actionKind)
        : undefined,
      evidence: turn.evidence,
    });

    const tr = transitionFromPlan({
      strategy: turn.strategy,
      command: turn.command,
      evidence: turn.evidence,
      planRound: rec.episode.round ?? 0,
      consecutiveRecovery: rec.episode.consecutiveRecoveryFailures ?? 0,
      limits,
    });

    if (tr.next === 'plan' && 'needRepair' in tr && tr.needRepair) {
      // 校验层应已耗尽；再非法则失败
      return await applyFail(rec, tr.reason, true);
    }

    if (tr.next === 'failed') {
      await maybeCompileVisualEvidence(rec, turn.evidence, false, true);
      return await applyFail(rec, tr.reason, tr.stopDevice ?? true);
    }

    if (tr.next === 'completed') {
      rec.episode.round = tr.planRound;
      rec.episode.consecutiveRecoveryFailures = 0;
      rec.episode.status = 'completed';
      await maybeCompileVisualEvidence(rec, turn.evidence, true, true);
      emit({
        ...baseEvent(rec),
        type: 'episode.completed',
        satisfied: true,
        reason: turn.evidence,
      });
      touch(rec);
      return structuredClone(rec.episode);
    }

    if (tr.next !== 'act') {
      return await applyFail(rec, 'unexpected plan transition', true);
    }

    // → act
    rec.episode.round = tr.planRound;
    rec.episode.consecutiveRecoveryFailures = tr.consecutiveRecovery;
    rec.pendingCommand = tr.pendingCommand;
    rec.pendingActionKind = turn.actionKind;
    rec.planIntent = tr.planIntent;
    rec.episode.status = 'act';
    log('info', 'phase plan → act', {
      episodeId: rec.episode.episodeId,
      intent: tr.planIntent,
      actionKind: turn.actionKind,
      maxActions: turn.actionKind
        ? maxActionsForKind(turn.actionKind)
        : undefined,
      command: tr.pendingCommand.slice(0, 80),
    });
    touch(rec);
    return structuredClone(rec.episode);
  }

  async function runAct(rec: EpisodeRecord): Promise<Episode> {
    throwIfAborted(rec);
    rec.episode.status = 'act';

    const command =
      rec.pendingCommand?.trim() ||
      actNlCommand(rec.episode.lastPlan?.toolCalls ?? []) ||
      '';
    const actionKind =
      rec.pendingActionKind ??
      rec.episode.lastPlan?.actionKind ??
      undefined;
    const maxActions = actionKind
      ? maxActionsForKind(actionKind)
      : undefined;
    const timeoutMs = actionKind
      ? actTimeoutMsForKind(actionKind)
      : actTimeoutMs;

    log('info', 'phase act start', {
      episodeId: rec.episode.episodeId,
      intent: rec.planIntent,
      command,
      actionKind,
      maxActions,
      timeoutMs,
      viaPlayground: Boolean(runActNlViaPlayground),
    });

    let results: OpaqueJson[];
    let ok = false;
    let error: string | undefined;
    let durationMs: number | undefined;
    let prompt = command;
    let resultPreview: string | undefined;

    if (!command) {
      results = [
        { ok: false, name: ACT_NL_TOOL, error: 'empty act_nl command' },
      ];
      error = 'empty act_nl command';
    } else {
      const requestId = randomUUID();
      emit({
        ...baseEvent(rec),
        type: 'turn.playground_run',
        requestId,
        command,
        actionKind,
        maxActions,
      });

      // Playground /execute 与 freeform 共用同一 Agent：预置下一次 aiAct 的 maxActions
      await executor.armNextAiActMaxActions(maxActions ?? null).catch(() => undefined);

      rec.activePlaygroundRequestId = requestId;
      let freeform = runActNlViaPlayground
        ? await runActNlViaPlayground({
            command,
            requestId,
            actionKind,
            maxActions,
            timeoutMs,
          })
        : null;
      rec.activePlaygroundRequestId = undefined;
      throwIfAborted(rec);

      if (!freeform) {
        freeform = await executor.freeformExecute(command, timeoutMs, {
          maxActions,
        });
        throwIfAborted(rec);
      } else if (
        freeform.ok === false &&
        /timeout/i.test(freeform.error ?? '')
      ) {
        // Playground 已超时：打断仍在跑的 Midscene，避免后台继续点
        await executor.abort(`act timeout after ${timeoutMs}ms`).catch(
          () => undefined,
        );
      }

      ok = freeform.ok;
      error = freeform.error;
      durationMs = freeform.durationMs;
      prompt = freeform.prompt || command;
      resultPreview = summarizeMidsceneResult(freeform.result);
      results = [
        {
          ok,
          name: ACT_NL_TOOL,
          prompt,
          actionKind,
          maxActions,
          durationMs,
          result: resultPreview ?? null,
          error,
          requestId,
        },
      ];
    }

    appendTurn(rec, { kind: 'tool_result', at: nowIso(), results });
    emit({
      ...baseEvent(rec),
      type: 'turn.tool_result',
      ok,
      command: prompt,
      durationMs,
      error,
      resultPreview,
    });

    // 等 UI 动画/页面稳定后再截图给下一轮 Plan LLM
    if (command && postActScreenshotDelayMs > 0) {
      log('info', 'post-act screenshot delay', {
        episodeId: rec.episode.episodeId,
        delayMs: postActScreenshotDelayMs,
      });
      await sleep(postActScreenshotDelayMs);
      throwIfAborted(rec);
    }
    const tr = transitionFromAct({
      actResult: ok ? 'success' : 'failure',
      consecutiveActFailures: rec.episode.consecutiveActFailures ?? 0,
      limits,
      error,
    });

    rec.pendingCommand = undefined;
    rec.pendingActionKind = undefined;
    rec.planIntent = undefined;

    if (tr.next === 'failed') {
      rec.episode.consecutiveActFailures = tr.consecutiveActFailures;
      await maybeCompileVisualEvidence(
        rec,
        error ?? tr.reason,
        false,
        true,
      );
      return await applyFail(rec, tr.reason, true);
    }

    rec.episode.consecutiveActFailures = tr.consecutiveActFailures;
    rec.episode.status = 'plan';
    log('info', 'phase act → plan', {
      episodeId: rec.episode.episodeId,
      ok,
      consecutiveActFailures: tr.consecutiveActFailures,
    });
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
        consecutiveRecoveryFailures: 0,
        consecutiveActFailures: 0,
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
      rec.episode.status = 'plan';
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
      });
      const episode = await port.openEpisode(instruction);
      const rec = get(episode.episodeId);
      try {
        while (!isTerminalStatus(rec.episode.status)) {
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
      });
      return result;
    },

    async advance(episodeId) {
      const rec = get(episodeId);
      const { status } = rec.episode;

      if (isTerminalStatus(status)) {
        return structuredClone(rec.episode);
      }
      if (rec.abortRequested) {
        return applyAbort(rec);
      }

      try {
        if (status === 'plan' || status === 'open') {
          return await runPlan(rec);
        }
        if (status === 'act') {
          return await runAct(rec);
        }
        return structuredClone(rec.episode);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'EPISODE_ABORTED') {
          return applyAbort(rec);
        }
        throw error;
      }
    },

    async askLlm(episodeId, _phase: LlmPhase) {
      const rec = get(episodeId);
      if (rec.abortRequested || isTerminalStatus(rec.episode.status)) {
        return structuredClone(rec.episode);
      }
      try {
        return await runPlan(rec);
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
      if (rec.abortRequested || isTerminalStatus(rec.episode.status)) {
        return structuredClone(rec.episode);
      }
      try {
        if (Array.isArray(toolCalls) && toolCalls.length) {
          const cmd = actNlCommand(toolCalls as never);
          if (cmd) {
            rec.pendingCommand = cmd;
            rec.pendingActionKind =
              rec.episode.lastPlan?.actionKind ?? rec.pendingActionKind;
            rec.planIntent = rec.planIntent ?? 'act';
          }
        }
        rec.episode.status = 'act';
        return await runAct(rec);
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
      if (!isTerminalStatus(rec.episode.status)) {
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
        if (rec.streamId === needle && !isTerminalStatus(rec.episode.status)) {
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
