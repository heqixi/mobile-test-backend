/**
 * @module @mtp/domain-case/ports/case-data-connector-port
 *
 * Case 域 DataConnector：连接外部用例库，按需读取，回写编译产物。
 *
 * - **不**主动编译（编译属业务范畴；需要时业务/UI 调 LlmInstructionCompiler，再 sync）
 * - 连接后优先通过 getCompiled / getInstructions 使用已编译结果
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
import type { Instruction } from '@mtp/domain-agent';
import type {
  CaseDataSourceListFilter,
  CaseDataSourcePort,
} from './case-data-source-port.js';

export interface CaseDataConnectorPort {
  /** 挂载外部数据源（替换当前连接） */
  connect(source: CaseDataSourcePort): void;

  disconnect(): void;

  isConnected(): boolean;

  getSourceInfo(): CaseDataSourceInfo | null;

  listCases(
    filter?: CaseDataSourceListFilter,
  ): Promise<ConnectedCaseSummary[]>;

  getOutline(caseId: string): Promise<ConnectedCaseOutline>;

  getCase(caseId: string): Promise<ConnectedCaseDetail>;

  /**
   * 仅返回外部已持久化的编译包；无则 null。
   * 不调用 LLM。
   */
  getCompiled(caseId: string): Promise<ConnectedCompiledBundle | null>;

  /**
   * 便捷：只要 Instruction[]；无编译产物则 null。
   */
  getInstructions(caseId: string): Promise<Instruction[] | null>;

  /** 同步编译结果到外部数据源 */
  syncCompiled(bundle: ConnectedCompiledBundle): Promise<void>;

  /**
   * 业务侧编译（切步 + LLM），代理远端 `compileCase`。
   */
  compileCase(caseId: string): Promise<ConnectedCompiledBundle>;

  /**
   * 流式编译：逐步回调进度事件。
   */
  compileCaseStream(
    caseId: string,
    onEvent: (event: CompileProgressEvent) => void,
  ): Promise<ConnectedCompiledBundle>;

  listRunReports(): Promise<LibraryRunReportSummaryItem[]>;

  getRunReport(reportId: string): Promise<LibraryRunReport | null>;

  saveRunReport(input: {
    groupName?: string;
    groupDescription?: string;
    deviceType?: string;
    cases: LibraryCaseRunResult[];
    reportId?: string;
    createdAt?: string;
  }): Promise<LibraryRunReport>;

  writebackRunReport(
    reportId: string,
    body?: LibraryRunReportWritebackRequest,
  ): Promise<LibraryRunReportWritebackResponse>;

  /** 按 caseIds 重排并回写业务源；返回最新列表 */
  reorderCases(caseIds: string[]): Promise<ConnectedCaseSummary[]>;
}
