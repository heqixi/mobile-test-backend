/**
 * @module @mtp/domain-agent/service/phase-llm
 *
 * 相位 LLM：按 phase 分步附带参考图，避免把 PreCondition/Expectation 塞进同一 act 上下文。
 * - precondition → 仅 PreCondition Golden
 * - act → 仅 Expectation Golden（judge 失败后的重试）
 * - judge → 仅 Expectation Golden（软参考）
 */

import type { ExecutorHttpClient } from '../adapters/executor-http.js';
import {
  extractAssistantText,
  type OpenCodeHttpClient,
} from '../adapters/opencode-http.js';
import type { AgentLoopEventListener } from '../models/agent-event.js';
import {
  readExpectationEvidence,
  readPreconditionEvidence,
  resolvePreconditionEvidence,
  resolveReferenceEvidence,
} from '../models/visual-evidence.js';
import type { LlmPhase } from '../ports/external-llm-port.js';
import { lastToolFromEpisode } from './act-nl.js';
import {
  loadStoredEvidenceDataUrl,
  shouldAttachReferenceImage,
} from './evidence-compiler.js';
import {
  baseEvent,
  type EpisodeRecord,
} from './episode-record.js';
import {
  buildEpisodeSystemPrompt,
  buildPhaseUserPrompt,
} from './system-prompt.js';

export interface PhaseLlmDeps {
  client: OpenCodeHttpClient;
  executor: ExecutorHttpClient;
  openCodeModel: { providerID: string; modelID: string };
  onEvent?: AgentLoopEventListener;
}

export async function askPhaseLlm(
  deps: PhaseLlmDeps,
  rec: EpisodeRecord,
  phase: LlmPhase,
): Promise<string> {
  const { client, executor, openCodeModel, onEvent } = deps;

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
  const preconditionRef = resolvePreconditionEvidence(
    readPreconditionEvidence(meta),
  );

  const attachImagesOff =
    process.env.AGENT_VISUAL_EVIDENCE_ATTACH_IMAGE === '0';

  let attachPrecondition = false;
  let attachExpectation = false;
  if (!attachImagesOff) {
    if (phase === 'precondition') {
      attachPrecondition = Boolean(preconditionRef);
    } else if (phase === 'act') {
      attachExpectation = shouldAttachReferenceImage({
        phase: 'act',
        lastJudgeSatisfied: rec.episode.lastJudge?.satisfied,
        consecutiveJudgeFailures: rec.episode.consecutiveJudgeFailures,
      });
    } else if (phase === 'judge') {
      attachExpectation = Boolean(expectationRef);
    }
  }

  const expectationDataUrl =
    attachExpectation && expectationRef
      ? await loadStoredEvidenceDataUrl(expectationRef)
      : undefined;
  const preconditionDataUrl =
    attachPrecondition && preconditionRef
      ? await loadStoredEvidenceDataUrl(preconditionRef)
      : undefined;

  const hasExpectationRef = Boolean(expectationDataUrl);
  const hasPreconditionRef = Boolean(preconditionDataUrl);

  const userText = buildPhaseUserPrompt(
    phase,
    rec.episode.instruction,
    lastToolFromEpisode(rec.episode),
    { hasExpectationRef, hasPreconditionRef },
  );

  const sseBits = [
    imageDataUrl
      ? '[screenshot attached: device-screen.png]'
      : `[screenshot unavailable: ${shot.error ?? 'unknown'}]`,
    preconditionDataUrl
      ? '[reference attached: precondition-reference.png]'
      : undefined,
    expectationDataUrl
      ? '[reference attached: expectation-reference.png]'
      : undefined,
  ].filter(Boolean);

  try {
    onEvent?.({
      ...baseEvent(rec),
      type: 'turn.user',
      phase,
      text: `${userText}\n\n${sseBits.join('\n')}`,
    });
  } catch {
    // 推流失败不影响 Loop
  }

  const system = rec.systemPromptSent
    ? undefined
    : buildEpisodeSystemPrompt(rec.episode.instruction);

  const extraImages: Array<{ dataUrl: string; filename: string }> = [];
  if (preconditionDataUrl) {
    extraImages.push({
      dataUrl: preconditionDataUrl,
      filename: 'precondition-reference.png',
    });
  }
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
