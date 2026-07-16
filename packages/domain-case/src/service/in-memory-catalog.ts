/**
 * @module @mtp/domain-case/service/in-memory-catalog
 *
 * 内存用例目录（阶段一可视化 / 开发用）。
 */

import { CaseDomainError } from '../errors.js';
import type {
  CaseDefinition,
  CaseSummary,
} from '../models/case-definition.js';
import type { CaseCatalogPort } from '../ports/case-catalog-port.js';

/** 内置演示用例，便于前端立刻可视化游标与账本 */
export const DEMO_CASES: CaseDefinition[] = [
  {
    caseId: 'demo-login-smoke',
    title: 'WPS App 打开测试',
    preconditions: 'Wps App 已安装, 可以在手机桌面上找到并打开',
    steps: [
      {
        stepId: 'step-1',
        order: 1,
        intent: '打开手机桌面, 找到WPS Office App 并且点击',
      },
      {
        stepId: 'step-2',
        order: 2,
        intent: '打开 WPS App 并进入首页',
      },
      {
        stepId: 'step-3',
        order: 3,
        intent: '确认已进入首页',
      },
    ],
    expected: ['可见首页主内容'],
    priority: 'P0',
    categories: ['smoke', 'demo'],
  },
  {
    caseId: 'demo-nav-tabs',
    title: '底部 Tab 导航（演示）',
    steps: [
      {
        stepId: 'step-1',
        order: 1,
        intent: '点击底部「文档」Tab',
      },
      {
        stepId: 'step-2',
        order: 2,
        intent: '点击底部「我」Tab',
      },
    ],
    expected: [],
    priority: 'P1',
    categories: ['nav', 'demo'],
  },
];

function toSummary(def: CaseDefinition): CaseSummary {
  return {
    caseId: def.caseId,
    title: def.title,
    priority: def.priority,
    stepCount: def.steps.length,
  };
}

export function createInMemoryCatalog(
  seed: CaseDefinition[] = DEMO_CASES,
): CaseCatalogPort {
  const byId = new Map(seed.map((c) => [c.caseId, c]));

  return {
    async listCases() {
      return [...byId.values()].map(toSummary);
    },

    async getCaseDefinition(caseId: string) {
      const def = byId.get(caseId);
      if (!def) {
        throw new CaseDomainError(
          'CASE_NOT_FOUND',
          `Case not found: ${caseId}`,
          { details: { caseId } },
        );
      }
      return structuredClone(def);
    },
  };
}
