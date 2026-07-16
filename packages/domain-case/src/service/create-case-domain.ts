/**
 * @module @mtp/domain-case/service/create-case-domain
 *
 * 组装 Case 域：Catalog + Compiler + CaseRun（依赖注入 AgentPort）。
 * apps/case-service 只调用本工厂，不实现游标/账本逻辑。
 */

import type { AgentPort, Instruction, InstructionResult } from '@mtp/domain-agent';
import { randomUUID } from 'node:crypto';
import type { CaseDefinition } from '../models/case-definition.js';
import type { CaseCatalogPort } from '../ports/case-catalog-port.js';
import type { CaseRunPort } from '../ports/case-run-port.js';
import type { InstructionCompilerPort } from '../ports/instruction-compiler-port.js';
import { createCaseRunService } from './case-run-service.js';
import { createInstructionCompiler } from './simple-compiler.js';
import {
  createInMemoryCatalog,
  DEMO_CASES,
} from './in-memory-catalog.js';

/**
 * 可视化 / 开发用 Agent 桩：不调真实 LLM，直接 satisfied。
 * 正式跑用例时由 case-service 注入真实 AgentPort（HTTP 客户端）。
 */
export function createSatisfiedAgentStub(
  reason = 'stub: Agent not wired; step marked satisfied for visualization',
): AgentPort {
  const unsupported = async () => {
    throw new Error('Agent stub only implements runInstruction');
  };

  return {
    openEpisode: unsupported as AgentPort['openEpisode'],
    advance: unsupported as AgentPort['advance'],
    askLlm: unsupported as AgentPort['askLlm'],
    dispatchTools: unsupported as AgentPort['dispatchTools'],
    ingest: unsupported as AgentPort['ingest'],
    closeEpisode: unsupported as AgentPort['closeEpisode'],
    abortEpisode: unsupported as AgentPort['abortEpisode'],
    abortByStreamId: unsupported as AgentPort['abortByStreamId'],
    getEpisode: unsupported as AgentPort['getEpisode'],
    async runInstruction(
      instruction: Instruction,
    ): Promise<InstructionResult> {
      return {
        episodeId: randomUUID(),
        instructionId: instruction.instructionId,
        satisfied: true,
        reason,
        status: 'completed',
        turns: [],
        finishedAt: new Date().toISOString(),
      };
    },
  };
}

export interface CaseDomain {
  catalog: CaseCatalogPort;
  compiler: InstructionCompilerPort;
  runs: CaseRunPort;
}

export interface CreateCaseDomainOptions {
  /** 种子用例；默认 DEMO_CASES */
  cases?: CaseDefinition[];
  /** 缺省使用 satisfied stub（便于前端可视化） */
  agent?: AgentPort;
}

export function createCaseDomain(
  options: CreateCaseDomainOptions = {},
): CaseDomain {
  const catalog = createInMemoryCatalog(options.cases ?? DEMO_CASES);
  const compiler = createInstructionCompiler();
  const agent = options.agent ?? createSatisfiedAgentStub();
  const runs = createCaseRunService({ catalog, compiler, agent });
  return { catalog, compiler, runs };
}

export { DEMO_CASES };
