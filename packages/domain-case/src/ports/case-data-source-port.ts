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
import type { CompileProgressEvent } from '../models/compile-progress.js';
import type {
  LibraryCaseRunResult,
  LibraryRunReport,
  LibraryRunReportSummaryItem,
  LibraryRunReportWritebackRequest,
  LibraryRunReportWritebackResponse,
} from '../models/library-run-report.js';

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

  /**
   * 流式编译：每步回调 `onEvent`（与 NDJSON 事件同形），最终返回完整 bundle。
   */
  compileCaseStream?(
    caseId: string,
    onEvent: (event: CompileProgressEvent) => void,
  ): Promise<ConnectedCompiledBundle>;

  /** Midscene 兼容：列出用例库运行报告 */
  listRunReports?(): Promise<LibraryRunReportSummaryItem[]>;

  /** Midscene 兼容：读取单份运行报告 */
  getRunReport?(reportId: string): Promise<LibraryRunReport | null>;

  /**
   * Midscene 兼容：落盘运行报告（写 dump HTML + JSON）。
   * body.cases[].dump 须为 Midscene ReportActionDump 形状。
   */
  saveRunReport?(input: {
    groupName?: string;
    groupDescription?: string;
    deviceType?: string;
    cases: LibraryCaseRunResult[];
    reportId?: string;
    createdAt?: string;
    sessionId?: string;
  }): Promise<LibraryRunReport>;

  /** 将报告结果回写到业务源（如 CSV「测试结果」） */
  writebackRunReport?(
    reportId: string,
    body?: LibraryRunReportWritebackRequest,
  ): Promise<LibraryRunReportWritebackResponse>;

  /** Midscene HTML 报告的可访问 URL（相对业务库 base） */
  getRunReportHtmlPath?(reportId: string): string | null;

  /**
   * 按 caseIds 重排业务源中的用例顺序（如 CSV 行序）并持久化。
   * 返回重排后的列表。
   */
  reorderCases?(caseIds: string[]): Promise<ConnectedCaseSummary[]>;
}
