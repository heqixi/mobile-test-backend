/**
 * @module @mtp/domain-executor/midscene/sample
 *
 * UI 采样：aiQuery → UiSnapshot（不做业务 State 判定）。
 */

import { randomUUID } from 'node:crypto';
import type { Platform, UUID } from '@mtp/shared-kernel';
import type { SnapshotPhase, UiSnapshot } from '../models/snapshot.js';
import type { MidsceneAgentLike } from './agent-types.js';

interface UiQueryResult {
  screenTitle?: string;
  pageDescription?: string;
  keyElements?: string[];
  overlays?: string[];
}

const UI_QUERY_PROMPT =
  '{ screenTitle: string, pageDescription: string, keyElements: string[], overlays: string[] }, describe the current Android screen: navigation/title bar text, one-sentence page summary, up to 8 visible UI labels (buttons, tabs, headings), and any modal/dialog titles in overlays';

export async function captureUiSnapshot(
  agent: MidsceneAgentLike,
  phase: SnapshotPhase = 'on_demand',
  stepId?: string,
  platform: Platform = 'android',
): Promise<UiSnapshot> {
  const query = await agent.aiQuery<UiQueryResult>(UI_QUERY_PROMPT);
  return {
    snapshotId: randomUUID() as UUID,
    stepId,
    phase,
    timestamp: new Date().toISOString(),
    platform,
    screenTitle: query.screenTitle,
    pageDescription: query.pageDescription,
    keyElements: query.keyElements,
    overlays: query.overlays,
    rawQueryResult: query as Record<string, unknown>,
  };
}
