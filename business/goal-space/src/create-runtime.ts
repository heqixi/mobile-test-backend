/**
 * 组装 Goal Space 业务运行时（文件存储 + 词法检索 + dHash 视觉 + 检索门面）。
 */

import type {
  CaptureSessionPort,
  GoalSpaceIndexPort,
  GoalSpaceRetrievePort,
  GoalSpaceStorePort,
  GoalSpaceSubmitPort,
  GraphNeighborhoodPort,
  GuidedCapturePort,
  KeyframeLabelPort,
  ScreenIdentityPort,
  TextSearchPort,
  VisualMatchPort,
} from '@mtp/domain-goal-space';
import { createFileCaptureSessionPort } from './adapters/file-capture-session.js';
import {
  createDHashVisualMatchPort,
  createFileGoalSpaceIndexPort,
} from './adapters/dhash-visual-match.js';
import { createFileGoalSpaceStorePort } from './adapters/file-store.js';
import { createFileSubmitPort } from './adapters/file-submit.js';
import { createGraphNeighborhoodPort } from './adapters/graph-neighborhood.js';
import { createGuidedCapturePort } from './adapters/guided-capture.js';
import { createLexicalTextSearchPort } from './adapters/lexical-text-search.js';
import { createKeyframeLabelPortFromEnv } from './adapters/openai-keyframe-label.js';
import { createScreenIdentityPortFromEnv } from './adapters/openai-screen-identity.js';
import { createRetrievePort } from './adapters/retrieve.js';

export interface GoalSpaceRuntime {
  capture: CaptureSessionPort;
  store: GoalSpaceStorePort;
  submit: GoalSpaceSubmitPort;
  index: GoalSpaceIndexPort;
  text: TextSearchPort;
  visual: VisualMatchPort;
  neighborhood: GraphNeighborhoodPort;
  retrieve: GoalSpaceRetrievePort;
  guided: GuidedCapturePort;
  label: KeyframeLabelPort;
  identity: ScreenIdentityPort;
}

export function createGoalSpaceRuntime(): GoalSpaceRuntime {
  const capture = createFileCaptureSessionPort();
  const store = createFileGoalSpaceStorePort();
  const index = createFileGoalSpaceIndexPort(store);
  const submit = createFileSubmitPort({ capture, index });
  const text = createLexicalTextSearchPort(store);
  const visual = createDHashVisualMatchPort(store);
  const neighborhood = createGraphNeighborhoodPort(store);
  const retrieve = createRetrievePort({
    store,
    text,
    visual,
    neighborhood,
  });
  const label = createKeyframeLabelPortFromEnv();
  const identity = createScreenIdentityPortFromEnv();
  const guided = createGuidedCapturePort({ capture, label, identity });
  return {
    capture,
    store,
    submit,
    index,
    text,
    visual,
    neighborhood,
    retrieve,
    guided,
    label,
    identity,
  };
}
