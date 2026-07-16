/**
 * @module @mtp/domain-agent/ports/agent-port
 *
 * Agent 领域端口：Instruction Loop 的全部能力（§4.1 Can）。
 * HTTP 层 `/api/agent/*` 应薄包装此端口，不包含业务逻辑。
 */

import type { OpaqueJson, UUID } from '@mtp/shared-kernel';
import type { Episode } from '../models/episode.js';
import type { Instruction } from '../models/instruction.js';
import type { InstructionResult } from '../models/instruction-result.js';
import type { LlmPhase } from './external-llm-port.js';

/**
 * Agent 领域服务端口。
 *
 * 实现约束：
 * - **不得** 读取 Instruction.metadata 做业务分支
 * - **不得** 本地 judge（禁止比对 StateId / 信号词）
 * - `dispatchTools` 按名转发 Executor AEP，不校验「该不该调」
 */
export interface AgentPort {
  /**
   * 开启一轮 Instruction 生命周期。
   * 存档 Instruction，初始化 Episode。
   */
  openEpisode(instruction: Instruction): Promise<Episode>;

  /**
   * 便捷 API：open（若需要）+ 循环 advance 直到 JudgeTurn 或失败/超时。
   * Case `step_next` 与 Client 调试均可用此入口。
   */
  runInstruction(instruction: Instruction): Promise<InstructionResult>;

  /**
   * 推进 Loop 一拍（act → judge）：
   * - acting：askLlm(act) → next=act 则 dispatch；next=judge 则进入 judging
   * - dispatching：freeform act_nl → judging
   * - judging：askLlm(judge) → satisfied 则 completed，否则回到 acting
   */
  advance(episodeId: UUID): Promise<Episode>;

  /**
   * 显式请求外部 LLM 一次（act | judge）。
   * 写入 ActTurn / JudgeTurn 到 Episode.turns。
   */
  askLlm(episodeId: UUID, phase: LlmPhase): Promise<Episode>;

  /**
   * 执行 ActTurn 中的 tool_calls，经 AEP 转发 Executor。
   * 结果以 tool_result Turn 追加到 Episode。
   *
   * @param toolCalls - 可选；缺省时使用 lastAct.toolCalls
   */
  dispatchTools(episodeId: UUID, toolCalls?: OpaqueJson): Promise<Episode>;

  /**
   * 追加观察/上下文（如 sample 原始 JSON）。
   * 不解析 payload 业务字段。
   */
  ingest(episodeId: UUID, payload: OpaqueJson): Promise<Episode>;

  /** 结束 Episode（正常或中止） */
  closeEpisode(episodeId: UUID): Promise<Episode>;

  /**
   * 中止正在运行的 Episode（打断 runInstruction / advance 等待）。
   * 已 completed/failed 的 Episode 原样返回。
   */
  abortEpisode(episodeId: UUID): Promise<Episode>;

  /**
   * 按 streamId 中止活跃 Episode（前端 Stop 常用）。
   * 无匹配时返回 null。
   */
  abortByStreamId(streamId: string): Promise<Episode | null>;

  /** 查询 Episode 当前状态与 transcript */
  getEpisode(episodeId: UUID): Promise<Episode>;
}
