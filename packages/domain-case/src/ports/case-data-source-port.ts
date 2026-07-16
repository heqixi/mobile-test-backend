/**
 * @module @mtp/domain-case/ports/case-data-source-port
 *
 * 外部业务数据源适配器契约。
 * CSV/平台 API 等实现放在 domain-case **之外**（business adapter）。
 */

import type {
  CaseDataSourceInfo,
  ConnectedCaseDetail,
  ConnectedCaseOutline,
  ConnectedCaseSummary,
  ConnectedCompiledBundle,
} from '../models/connected-case.js';

export interface CaseDataSourceListFilter {
  /** 目录路径前缀匹配 */
  pathPrefix?: string[];
  /** 标题关键词 */
  q?: string;
}

/**
 * 业务 Adapter 实现此端口，挂到 CaseDataConnector。
 */
export interface CaseDataSourcePort {
  readonly info: CaseDataSourceInfo;

  listCases(
    filter?: CaseDataSourceListFilter,
  ): Promise<ConnectedCaseSummary[]>;

  getOutline(caseId: string): Promise<ConnectedCaseOutline>;

  getCase(caseId: string): Promise<ConnectedCaseDetail>;

  /**
   * 读取业务已持久化的编译结果；无则 null。
   * domain-case 连接后可直接使用，**不会**因此触发编译。
   */
  getCompiled(caseId: string): Promise<ConnectedCompiledBundle | null>;

  /**
   * 将编译结果写回业务侧（按需持久化）。
   * 由业务或 UI 显式调用 sync 时触发。
   */
  saveCompiled(bundle: ConnectedCompiledBundle): Promise<void>;

  /**
   * 业务侧编译（切步 + LLM），写回 sidecar 并返回 bundle。
   * 协议 `POST .../compile`。
   */
  compileCase?(caseId: string): Promise<ConnectedCompiledBundle>;
}
