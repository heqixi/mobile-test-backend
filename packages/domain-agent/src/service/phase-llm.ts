/**
 * @module @mtp/domain-agent/service/phase-llm
 *
 * 相位 LLM 调用：截图 + user prompt + OpenCode postRound。
 */

import type { ExecutorHttpClient } from '../adapters/executor-http.js';
import {
  extractAssistantText,
  type OpenCodeHttpClient,
} from '../adapters/opencode-http.js';
import type { AgentLoopEventListener } from '../models/agent-event.js';
import type { LlmPhase } from '../ports/external-llm-port.js';
import { lastToolFromEpisode } from './act-nl.js';
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

  const userText = buildPhaseUserPrompt(
    phase,
    rec.episode.instruction,
    lastToolFromEpisode(rec.episode),
  );

  const sseText = imageDataUrl
    ? `${userText}\n\n[screenshot attached: device-screen.png]`
    : `${userText}\n\n[screenshot unavailable: ${shot.error ?? 'unknown'}]`;

  try {
    onEvent?.({
      ...baseEvent(rec),
      type: 'turn.user',
      phase,
      text: sseText,
    });
  } catch {
    // 推流失败不影响 Loop
  }

  const system = rec.systemPromptSent
    ? undefined
    : buildEpisodeSystemPrompt(rec.episode.instruction);

  const reply = await client.postRound(rec.openCodeSessionId, {
    text: userText,
    system,
    imageDataUrl,
    imageFilename: 'device-screen.png',
    model: openCodeModel,
  });

  if (!rec.systemPromptSent) {
    rec.systemPromptSent = true;
  }

  return extractAssistantText(reply);
}
