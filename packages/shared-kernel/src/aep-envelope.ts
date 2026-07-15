/**
 * @module @mtp/shared-kernel/aep-envelope
 *
 * AEP（Agent–Executor Protocol）统一消息信封。
 * Agent ↔ Executor 跨进程通讯的唯一外层包装；版本固定 `0.2`。
 *
 * 参见 architecture-domain-design.md §7.2 / §7.3。
 */

import type { ISO8601, UUID } from './primitives.js';

/** AEP 协议版本 */
export type AepVersion = '0.2';

/**
 * AEP 消息类型字面量。
 *
 * | type | 方向 | 含义 |
 * |------|------|------|
 * | ListTools / ListToolsResult | Agent↔Executor | 查询可用工具 |
 * | Sample / SampleResult | Agent↔Executor | UI 采样 |
 * | InvokeTool / ToolResult | Agent↔Executor | 按名调用工具 |
 * | BindDevice / BindDeviceResult | 双向 | 绑定设备 |
 * | Abort / AbortResult | Agent→Executor | 中止当前操作 |
 * | GetDeviceHealth / DeviceHealthResult | 查询 | 设备健康 |
 * | Error | 任一方 | 协议层错误 |
 */
export type AepMessageType =
  | 'ListTools'
  | 'ListToolsResult'
  | 'Sample'
  | 'SampleResult'
  | 'InvokeTool'
  | 'ToolResult'
  | 'BindDevice'
  | 'BindDeviceResult'
  | 'Abort'
  | 'AbortResult'
  | 'GetDeviceHealth'
  | 'DeviceHealthResult'
  | 'Error';

/**
 * 所有 AEP 消息的通用信封。
 *
 * @typeParam T - 消息类型字面量
 * @typeParam P - 业务载荷类型
 */
export interface AepEnvelope<T extends string = string, P = unknown> {
  /** 协议版本，固定 `0.2` */
  aepVersion: AepVersion;

  /** 本消息唯一 id */
  messageId: UUID;

  /**
   * 关联 id：同一 Instruction Loop 内多轮 Sample/Invoke 共享，
   * 便于日志与追踪串联。
   */
  correlationId: UUID;

  /** 消息产生时间 */
  timestamp: ISO8601;

  /** 消息类型，决定 payload 结构 */
  type: T;

  /** 类型相关载荷 */
  payload: P;
}
