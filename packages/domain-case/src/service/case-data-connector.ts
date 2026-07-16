/**
 * @module @mtp/domain-case/service/case-data-connector
 *
 * DataConnector 实现：薄封装 CaseDataSourcePort。
 */

import { CaseDomainError } from '../errors.js';
import type { Instruction } from '@mtp/domain-agent';
import type {
  CaseDataSourceInfo,
  ConnectedCaseDetail,
  ConnectedCaseOutline,
  ConnectedCaseSummary,
  ConnectedCompiledBundle,
} from '../models/connected-case.js';
import type { CaseDataConnectorPort } from '../ports/case-data-connector-port.js';
import type {
  CaseDataSourceListFilter,
  CaseDataSourcePort,
} from '../ports/case-data-source-port.js';

function requireSource(source: CaseDataSourcePort | null): CaseDataSourcePort {
  if (!source) {
    throw new CaseDomainError(
      'CONNECTOR_NOT_CONNECTED',
      'No case data source connected',
    );
  }
  return source;
}

export function createCaseDataConnector(): CaseDataConnectorPort {
  let source: CaseDataSourcePort | null = null;

  return {
    connect(next) {
      source = next;
    },

    disconnect() {
      source = null;
    },

    isConnected() {
      return source != null;
    },

    getSourceInfo(): CaseDataSourceInfo | null {
      return source?.info ?? null;
    },

    async listCases(filter?: CaseDataSourceListFilter) {
      return requireSource(source).listCases(filter);
    },

    async getOutline(caseId: string): Promise<ConnectedCaseOutline> {
      return requireSource(source).getOutline(caseId);
    },

    async getCase(caseId: string): Promise<ConnectedCaseDetail> {
      return requireSource(source).getCase(caseId);
    },

    async getCompiled(
      caseId: string,
    ): Promise<ConnectedCompiledBundle | null> {
      return requireSource(source).getCompiled(caseId);
    },

    async getInstructions(caseId: string): Promise<Instruction[] | null> {
      const bundle = await requireSource(source).getCompiled(caseId);
      if (!bundle?.instructions?.length) return null;
      return bundle.instructions;
    },

    async syncCompiled(bundle: ConnectedCompiledBundle) {
      await requireSource(source).saveCompiled(bundle);
    },

    async compileCase(caseId: string) {
      const s = requireSource(source);
      if (!s.compileCase) {
        throw new CaseDomainError(
          'COMPILE_REJECTED',
          'Connected source does not support compileCase',
          { details: { caseId } },
        );
      }
      return s.compileCase(caseId);
    },
  };
}
