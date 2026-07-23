/**
 * Cowork 业务：是否绑定 Goal Space 由本模块决定。
 * domain-case 只吃拼好的 caseText，不依赖 Goal Space。
 *
 * 注意：与前端用例面板的 Goal Space「连接/多选」无关。
 * 编译注入只看本进程 env：COWORK_GOAL_SPACE / GOAL_SPACE_URL / GOAL_SPACE_ID。
 * 前端绑定只影响 agent-service 跑 Instruction 时的按需 retrieve。
 */

import type { ConnectedCaseDetail } from '@mtp/domain-case';
import {
  createGoalSpaceHttpClient,
  type GoalSpaceRetrievePort,
} from '@mtp/domain-goal-space';
import type { CoworkStepSegment } from './split-steps.js';

export type EnrichCompileStepContext = (input: {
  detail: ConnectedCaseDetail;
  step: CoworkStepSegment;
}) => Promise<string | undefined>;

export type GoalSpaceCompileBindOptions = {
  /** COWORK_GOAL_SPACE=0 时不绑定 */
  enabled?: boolean;
  baseUrl?: string;
  spaceId?: string;
  version?: string;
  retrieve?: GoalSpaceRetrievePort;
};

/**
 * 组装层：创建「每步编译前拉取 ContextPack」的 enricher。
 * 失败降级为 undefined，不阻断编译。
 */
export function createGoalSpaceCompileEnricher(
  options?: GoalSpaceCompileBindOptions,
): EnrichCompileStepContext | undefined {
  const enabled =
    options?.enabled ?? process.env.COWORK_GOAL_SPACE !== '0';
  if (!enabled) {
    console.log(
      '[cowork-csv][goal-space] compile enricher disabled (COWORK_GOAL_SPACE=0)',
    );
    return undefined;
  }

  const baseUrl =
    options?.baseUrl ?? process.env.GOAL_SPACE_URL ?? 'http://127.0.0.1:4104';
  const retrieve =
    options?.retrieve ?? createGoalSpaceHttpClient({ baseUrl });

  const spaceId =
    options?.spaceId?.trim() ||
    process.env.GOAL_SPACE_ID?.trim() ||
    'cowork-android';
  const version =
    options?.version?.trim() ||
    process.env.GOAL_SPACE_VERSION?.trim() ||
    undefined;

  console.log(
    `[cowork-csv][goal-space] compile enricher ON → ${baseUrl} space=${spaceId} version=${version ?? 'latest'} (env-bound, not FE bind)`,
  );

  return async ({ detail, step }) => {
    const intentPreview = step.text.slice(0, 80);
    console.log(
      `[cowork-csv][goal-space] retrieve before compile step#${step.order} case=${detail.caseId} intent="${intentPreview}${step.text.length > 80 ? '…' : ''}"`,
    );
    try {
      const pack = await retrieve.retrieve({
        spaceId,
        ref: version ? { spaceId, version } : undefined,
        intentText: [
          detail.title,
          step.text,
          detail.preconditions,
          detail.expectedText,
        ]
          .filter(Boolean)
          .join('\n'),
        strategy: 'text_only',
      });
      const md = pack.textMarkdown?.trim();
      if (!md) {
        console.log(
          `[cowork-csv][goal-space] step#${step.order} retrieve empty markdown → no inject`,
        );
        return undefined;
      }
      console.log(
        `[cowork-csv][goal-space] step#${step.order} inject ContextPack chars=${md.length} ref=${pack.ref.spaceId}@${pack.ref.version} strategy=${pack.diagnostics?.strategyUsed ?? '?'}`,
      );
      return `## App 目标空间上下文\n\n${md}`;
    } catch (err) {
      console.warn(
        '[cowork-csv][goal-space] retrieve skipped:',
        err instanceof Error ? err.message : err,
      );
      return undefined;
    }
  };
}
