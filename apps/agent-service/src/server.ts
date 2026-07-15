/**
 * @module @mtp/agent-service/server
 *
 * Agent 进程（:4100）路由注册表。
 * 仅声明「有哪些 API」；不启动 HTTP server、不实现业务。
 */

import {
  AgentHttpRoutes,
  agentHttpHandlersStub,
  type AgentHttpHandlers,
} from './api/agent-http.js';
import {
  CaseHttpRoutes,
  caseHttpHandlersStub,
  type CaseHttpHandlers,
} from './api/case-http.js';
import { AGENT_SERVICE_PORT } from './api/agent-http.js';

/** HTTP 方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * 单条路由描述（骨架用）。
 * 实现阶段可映射到 Express/Fastify。
 */
export interface RouteDescriptor {
  method: HttpMethod;
  path: string;
  /**
   * 领域归属：agent | case。
   * 同进程部署时仍需代码分域。
   */
  domain: 'agent' | 'case';
  /** 简要说明 */
  summary: string;
}

/**
 * Agent 进程完整路由表（含同进程挂载的 Case API）。
 */
export const agentServiceRouteTable: RouteDescriptor[] = [
  // Agent
  {
    method: 'POST',
    path: AgentHttpRoutes.runInstruction,
    domain: 'agent',
    summary: '跑完 Instruction Loop，返回 InstructionResult',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.openEpisode,
    domain: 'agent',
    summary: '开启 Episode',
  },
  {
    method: 'GET',
    path: AgentHttpRoutes.getEpisode,
    domain: 'agent',
    summary: '查询 Episode',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.advance,
    domain: 'agent',
    summary: '推进 Loop 一拍',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.askLlm,
    domain: 'agent',
    summary: '请求外部 LLM（act|judge）',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.dispatchTools,
    domain: 'agent',
    summary: '按名派发 tool_calls 到 Executor',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.ingest,
    domain: 'agent',
    summary: '注入观察 payload',
  },
  {
    method: 'POST',
    path: AgentHttpRoutes.closeEpisode,
    domain: 'agent',
    summary: '关闭 Episode',
  },
  {
    method: 'GET',
    path: AgentHttpRoutes.health,
    domain: 'agent',
    summary: 'Agent 健康检查',
  },
  // Case（同进程分域）
  {
    method: 'GET',
    path: CaseHttpRoutes.listCases,
    domain: 'case',
    summary: '用例摘要列表（只读）',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.startRun,
    domain: 'case',
    summary: '创建 CaseRun',
  },
  {
    method: 'GET',
    path: CaseHttpRoutes.getRun,
    domain: 'case',
    summary: '查询 CaseRun',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.stepNext,
    domain: 'case',
    summary: 'compile → run_instruction → 记账推进游标',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.stepRetry,
    domain: 'case',
    summary: '重跑当前失败步',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.stepSkip,
    domain: 'case',
    summary: '跳过并 advance',
  },
  {
    method: 'POST',
    path: CaseHttpRoutes.abortRun,
    domain: 'case',
    summary: '中止 CaseRun',
  },
];

/**
 * Agent 进程骨架配置。
 * handlers 当前为 stub，全部抛 NOT_IMPLEMENTED。
 */
export interface AgentServiceSkeleton {
  port: number;
  routes: RouteDescriptor[];
  agentHandlers: AgentHttpHandlers;
  caseHandlers: CaseHttpHandlers;
}

export const agentServiceSkeleton: AgentServiceSkeleton = {
  port: AGENT_SERVICE_PORT,
  routes: agentServiceRouteTable,
  agentHandlers: agentHttpHandlersStub,
  caseHandlers: caseHttpHandlersStub,
};
