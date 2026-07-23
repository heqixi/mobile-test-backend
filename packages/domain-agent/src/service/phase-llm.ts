/**
 * @module @mtp/domain-agent/service/phase-llm
 *
 * Plan LLM：附带截图 + 按需 Expectation Golden 参考图。
 * 不向模型注入 preconditions 文本或 PreCondition Golden。
 *
 * 可选业务上下文经 enrichPhaseContext 注入（域内不感知 Goal Space）。
 * Business 必须按需 retrieve 裁剪后的 markdown，禁止整图/全量关键帧硬塞。
 */

import type { Instruction } from '../models/instruction.js';
import type { ExecutorHttpClient } from '../adapters/executor-http.js';
import {
  extractAssistantText,
  type OpenCodeHttpClient,
} from '../adapters/opencode-http.js';
import type { AgentLoopEventListener } from '../models/agent-event.js';
import {
  readExpectationEvidence,
  resolveReferenceEvidence,
} from '../models/visual-evidence.js';
import type { LlmPhase } from '../ports/external-llm-port.js';
import { lastToolFromEpisode } from './act-nl.js';
import {
  loadStoredEvidenceDataUrl,
  shouldAttachReferenceImage,
} from './evidence-compiler.js';
import { baseEvent, type EpisodeRecord } from './episode-record.js';
import {
  buildEpisodeSystemPrompt,
  buildPhaseUserPrompt,
} from './system-prompt.js';

/** Business 组装层提供：返回不透明 markdown，失败则 undefined */
export type EnrichPhaseContext = (input: {
  phase: LlmPhase;
  instruction: Instruction;
  pendingCommand?: string;
  screenshotBase64?: string;
}) => Promise<string | undefined>;

export interface PhaseLlmDeps {
  client: OpenCodeHttpClient;
  executor: ExecutorHttpClient;
  openCodeModel: { providerID: string; modelID: string };
  onEvent?: AgentLoopEventListener;
  enrichPhaseContext?: EnrichPhaseContext;
}

export async function askPhaseLlm(
  deps: PhaseLlmDeps,
  rec: EpisodeRecord,
  phase: LlmPhase = 'plan',
): Promise<string> {
  const { client, executor, openCodeModel, onEvent, enrichPhaseContext } =
    deps;

  const shot = await executor.captureScreenshot();
  const imageDataUrl = shot.ok ? shot.dataUrl : undefined;
  if (shot.ok && shot.base64) {
    rec.lastScreenshotBase64 = shot.base64.replace(
      /^data:image\/\w+;base64,/,
      '',
    );
  }

  const meta = rec.episode.instruction.metadata;
  const expectationRef = resolveReferenceEvidence(
    readExpectationEvidence(meta),
  );

  const attachImagesOff =
    process.env.AGENT_VISUAL_EVIDENCE_ATTACH_IMAGE === '0';

  let attachExpectation = false;
  if (!attachImagesOff) {
    attachExpectation = shouldAttachReferenceImage({
      phase: 'plan',
      lastPlanEnded:
        rec.episode.lastPlan != null
          ? rec.episode.lastPlan.strategy === 'pass'
          : undefined,
      consecutiveRecoveryFailures: rec.episode.consecutiveRecoveryFailures,
    });
    if (!attachExpectation && expectationRef && !rec.episode.lastPlan) {
      attachExpectation = Boolean(expectationRef);
    }
  }

  const expectationDataUrl =
    attachExpectation && expectationRef
      ? await loadStoredEvidenceDataUrl(expectationRef)
      : undefined;

  const hasExpectationRef = Boolean(expectationDataUrl);

  let extraContextMarkdown: string | undefined;
  if (enrichPhaseContext) {
    try {
      extraContextMarkdown = await enrichPhaseContext({
        phase,
        instruction: rec.episode.instruction,
        pendingCommand: rec.pendingCommand,
        screenshotBase64: shot.ok
          ? (shot.base64 ?? imageDataUrl ?? undefined)
          : undefined,
      });
    } catch (err) {
      console.warn(
        '[phase-llm] enrichPhaseContext skipped:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  const userText = buildPhaseUserPrompt(
    phase,
    rec.episode.instruction,
    lastToolFromEpisode(rec.episode),
    { hasExpectationRef, extraContextMarkdown },
  );

  const sseBits = [
    imageDataUrl
      ? '[screenshot attached: device-screen.png]'
      : `[screenshot unavailable: ${shot.error ?? 'unknown'}]`,
    expectationDataUrl
      ? '[reference attached: expectation-reference.png]'
      : undefined,
  ].filter(Boolean);

  try {
    onEvent?.({
      ...baseEvent(rec),
      type: 'turn.user',
      phase: 'plan',
      text: `${userText}\n\n${sseBits.join('\n')}`,
    });
  } catch {
    // 推流失败不影响 Loop
  }

  const system = rec.systemPromptSent
    ? undefined
    : buildEpisodeSystemPrompt(rec.episode.instruction);

  const extraImages: Array<{ dataUrl: string; filename: string }> = [];
  if (expectationDataUrl) {
    extraImages.push({
      dataUrl: expectationDataUrl,
      filename: 'expectation-reference.png',
    });
  }

  const reply = await client.postRound(rec.openCodeSessionId, {
    text: userText,
    system,
    imageDataUrl,
    imageFilename: 'device-screen.png',
    extraImages: extraImages.length ? extraImages : undefined,
    model: openCodeModel,
  });

  if (!rec.systemPromptSent) {
    rec.systemPromptSent = true;
  }

  return extractAssistantText(reply);
}

/**
 * 同一 Session 内发送校验失败修复 prompt（不再次截图）。
 */
export async function askPhaseLlmRepair(
  deps: PhaseLlmDeps,
  rec: EpisodeRecord,
  _phase: LlmPhase,
  repairText: string,
): Promise<string> {
  const { client, openCodeModel, onEvent } = deps;
  try {
    onEvent?.({
      ...baseEvent(rec),
      type: 'turn.user',
      phase: 'plan',
      text: repairText,
    });
  } catch {
    // ignore
  }
  const reply = await client.postRound(rec.openCodeSessionId, {
    text: repairText,
    model: openCodeModel,
  });
  return extractAssistantText(reply);
}
