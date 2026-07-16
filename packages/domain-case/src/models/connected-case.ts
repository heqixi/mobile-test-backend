/**
 * @module @mtp/domain-case/models/connected-case
 *
 * DataConnector 对外暴露的用例视图（与业务源格式无关）。
 */

import type { Instruction } from '@mtp/domain-agent';
import type { CompileCaseInput } from './compile-case-input.js';
import type { CompileReport } from './compile-report.js';

/** 用例库列表项 */
export interface ConnectedCaseSummary {
  caseId: string;
  title: string;
  /** 目录路径，如 ["功能测试","WPS首页入口","拍照挂载"] */
  path?: string[];
  priority?: string;
  /** 外部源是否已持久化编译结果 */
  hasCompiled: boolean;
}

/** 用例梳理 / 大纲（列表点进后的摘要） */
export interface ConnectedCaseOutline {
  caseId: string;
  title: string;
  path?: string[];
  preconditions?: string;
  stepsPreview?: string;
  expectedPreview?: string;
  priority?: string;
  hasCompiled: boolean;
  instructionCount?: number;
}

/**
 * 用例详情。
 * `compileInput` 供业务侧按需调用 LlmInstructionCompiler；
 * DataConnector **不会**自动编译。
 */
export interface ConnectedCaseDetail {
  caseId: string;
  title: string;
  path?: string[];
  preconditions?: string;
  stepsText: string;
  expectedText: string;
  priority?: string;
  compileInput: CompileCaseInput;
  hasCompiled: boolean;
  /**
   * 业务源原始字段（列名 → 值），如 CSV 中文表头。
   * 面板 JSON 预览优先展示此对象。
   */
  sourceFields?: Record<string, string>;
}

/** 外部源已持久化的编译产物 */
export interface ConnectedCompiledBundle {
  caseId: string;
  instructions: Instruction[];
  compiledAt?: string;
  reports?: CompileReport[];
  /** 业务自定义标记，如 compiler=llm|rule|manual */
  sourceTag?: string;
}

export interface CaseDataSourceInfo {
  sourceId: string;
  displayName: string;
}
