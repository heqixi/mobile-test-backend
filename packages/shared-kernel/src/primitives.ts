/**
 * @module @mtp/shared-kernel/primitives
 *
 * 跨 Agent / Case / Executor 三域共用的基础类型。
 * 本包不得引入任何领域业务语义（如 CaseRun、StateId 判定规则）。
 */

/**
 * 全局唯一标识符（RFC 4122 UUID 字符串）。
 * 用于 runId、episodeId、messageId、snapshotId、instructionId 等。
 */
export type UUID = string;

/**
 * ISO 8601 时间戳字符串（含时区或 Z）。
 * 例：`2026-07-15T08:00:00.000Z`
 */
export type ISO8601 = string;

/**
 * 不透明 JSON 载荷。
 *
 * 用于：
 * - Agent 透传 tool `arguments`
 * - LLM 原始返回存档
 * - sample / invoke 的原始结果
 *
 * 消费方 **不建立业务 schema**，整包转发或存档。
 */
export type OpaqueJson = unknown;

/**
 * 被测端平台。
 * Executor 绑定设备时使用；Case 阶段一可不强制写入 Run。
 */
export type Platform = 'android' | 'ios' | 'web';
