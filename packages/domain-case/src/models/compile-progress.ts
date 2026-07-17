/**
 * @module @mtp/domain-case/models/compile-progress
 *
 * 业务库 LLM 编译进度（NDJSON 流 / 回调共用）。
 */

import type { Instruction } from '@mtp/domain-agent';
import type { CompileReport } from './compile-report.js';
import type { ConnectedCompiledBundle } from './connected-case.js';

export interface CompileStepPreview {
  order: number;
  stepId: string;
  text: string;
}

export type CompileProgressEvent =
  | {
      type: 'start';
      caseId: string;
      total: number;
      steps: CompileStepPreview[];
    }
  | {
      type: 'step_start';
      caseId: string;
      index: number;
      total: number;
      stepOrder: number;
      stepId: string;
      stepText: string;
    }
  | {
      type: 'step_done';
      caseId: string;
      index: number;
      total: number;
      stepOrder: number;
      instruction: Instruction;
      report: CompileReport;
    }
  | {
      type: 'done';
      caseId: string;
      bundle: ConnectedCompiledBundle;
    }
  | {
      type: 'error';
      caseId?: string;
      code?: string;
      message: string;
      index?: number;
      total?: number;
      stepOrder?: number;
    };
