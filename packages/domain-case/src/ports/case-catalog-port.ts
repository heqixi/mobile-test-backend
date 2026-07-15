/**
 * @module @mtp/domain-case/ports/case-catalog-port
 *
 * 用例目录只读端口（阶段一可选）。
 * 加载 CaseDefinition / CaseSummary；**不写** Context。
 */

import type { CaseDefinition, CaseSummary } from '../models/case-definition.js';

/**
 * 用例目录端口。
 * 实现方：文件 CSV loader、未来 DB 等（L1 适配层，本骨架不实现）。
 */
export interface CaseCatalogPort {
  /** 列出所有用例摘要 */
  listCases(): Promise<CaseSummary[]>;

  /**
   * 按 caseId 加载完整定义。
   * @throws CASE_NOT_FOUND
   */
  getCaseDefinition(caseId: string): Promise<CaseDefinition>;
}
