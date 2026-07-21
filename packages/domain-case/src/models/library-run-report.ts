/**
 * @module @mtp/domain-case/models/library-run-report
 *
 * 用例库运行报告：结构对齐 Midscene `IReportActionDump` /
 * `ReportFileAttributes`（playwright_test_*），便于用 Midscene 报告查看器打开。
 */

/** Midscene TestStatus */
export type MidsceneTestStatus =
  | 'passed'
  | 'failed'
  | 'timedOut'
  | 'skipped'
  | 'interrupted';

/**
 * Midscene 报告 script 标签上的属性（与 Playwright reporter / ReportMergingTool 一致）。
 * Midscene 报告侧栏按这些字段展示用例标题与状态。
 */
export interface MidsceneReportDumpAttributes {
  playwright_test_id: string;
  playwright_test_title: string;
  playwright_test_description: string;
  playwright_test_status: MidsceneTestStatus;
  playwright_test_duration: number;
}

/** Midscene ExecutionTask 的可序列化子集（含截图 recorder，供报告查看器展示） */
export interface MidsceneDumpRecorderItem {
  type: 'screenshot';
  ts: number;
  /** 报告查看器读 screenshot.base64 */
  screenshot?: {
    base64: string;
    capturedAt?: number;
  };
  description?: string;
}

export interface MidsceneDumpTask {
  taskId: string;
  type: 'Planning' | 'Insight' | 'Action Space' | 'Log';
  subType?: string;
  status: 'pending' | 'running' | 'finished' | 'failed' | 'cancelled';
  param?: unknown;
  thought?: string;
  errorMessage?: string;
  timing?: {
    start: number;
    end?: number;
    cost?: number;
  };
  /** Midscene 时间线截图（无此字段则报告里看不到图） */
  recorder?: MidsceneDumpRecorderItem[];
}

/** Midscene IExecutionDump */
export interface MidsceneExecutionDump {
  id?: string;
  logTime: number;
  name: string;
  description?: string;
  tasks: MidsceneDumpTask[];
  aiActContext?: string;
}

/** Midscene IReportActionDump */
export interface MidsceneReportActionDump {
  sdkVersion: string;
  groupName: string;
  groupDescription?: string;
  modelBriefs: Array<{
    intent?: string;
    name?: string;
    modelDescription?: string;
  }>;
  executions: MidsceneExecutionDump[];
  deviceType?: string;
}

/** 单条 Instruction 运行摘要（业务层，非 Midscene 原生字段） */
export interface LibraryInstructionRunSummary {
  instructionId: string;
  label?: string;
  satisfied: boolean;
  status: string;
  reason?: string;
  durationMs?: number;
  /** 步骤结束时的设备截图（data URL 或 raw base64），写入 dump.recorder */
  screenshotDataUrl?: string;
}

/**
 * 单条用例在库级报告中的结果。
 * `dump` 必须是 Midscene 兼容的 ReportActionDump，可直接写入 midscene_web_dump。
 */
export interface LibraryCaseRunResult {
  caseId: string;
  title: string;
  path?: string[];
  priority?: string;
  /** 业务 CSV 原始字段快照 */
  sourceFields?: Record<string, string>;
  status: MidsceneTestStatus;
  durationMs: number;
  reason?: string;
  instructionResults?: LibraryInstructionRunSummary[];
  /** Midscene ReportActionDump（本用例） */
  dump: MidsceneReportActionDump;
  /** Midscene dump script attributes */
  attributes: MidsceneReportDumpAttributes;
}

export interface LibraryRunReportSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  interrupted: number;
  timedOut: number;
}

/** 用例库一次「依次运行」的完整报告 */
export interface LibraryRunReport {
  reportId: string;
  createdAt: string;
  finishedAt?: string;
  /** 对应 Midscene groupName */
  groupName: string;
  groupDescription?: string;
  sdkVersion: string;
  deviceType?: string;
  /** Midscene HTML 报告绝对路径（可直接用浏览器打开） */
  htmlPath?: string;
  /** 合并后的 dump JSON 路径（可选） */
  dumpPath?: string;
  cases: LibraryCaseRunResult[];
  summary: LibraryRunReportSummary;
  /** 已回写 CSV 的时间 */
  writtenBackAt?: string;
}

export interface LibraryRunReportSummaryItem {
  reportId: string;
  createdAt: string;
  finishedAt?: string;
  groupName: string;
  groupDescription?: string;
  summary: LibraryRunReportSummary;
  htmlPath?: string;
  writtenBackAt?: string;
}

export interface LibraryRunReportWritebackRequest {
  /** 缺省回写全部；可只回写部分 caseId */
  caseIds?: string[];
  /**
   * 写入 CSV「测试结果」列的值映射。
   * 缺省：passed→pass, failed→fail, skipped→skip, …
   */
  resultValueByStatus?: Partial<Record<MidsceneTestStatus, string>>;
}

export interface LibraryRunReportWritebackResponse {
  reportId: string;
  updatedCaseIds: string[];
  csvPath: string;
  writtenBackAt: string;
}
