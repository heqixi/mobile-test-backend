/**
 * @module @mtp/domain-executor/freeform
 *
 * Client 直连的 freeform / preview 模型。
 * **不**进入 Agent Episode 语义（§4.2 freeform_execute / preview）。
 */

import type { OpaqueJson } from '@mtp/shared-kernel';

/**
 * 自然语言直控请求（Playground）。
 * 绕过 Agent Loop，直接让 Executor 执行一句自然语言操作。
 */
export interface FreeformExecuteRequest {
  /** 自然语言指令，如「点击底部输入框」 */
  prompt: string;
  timeoutMs?: number;
  /**
   * 本次 aiAct 最多执行的设备操作数；不传则用 executor 默认 / 不限制。
   */
  maxActions?: number;
  metadata?: OpaqueJson;
}

/**
 * freeform 执行技术结果。
 */
export interface FreeformExecuteResult {
  ok: boolean;
  durationMs: number;
  report?: OpaqueJson;
  error?: { code: string; message: string };
}

/**
 * 预览流元信息（Scrcpy / 截图流）。
 * 实际流媒体协议由实现方定义；此处仅描述控制面契约。
 */
export interface PreviewInfo {
  /** 预览是否可用 */
  available: boolean;
  /** Scrcpy 流地址 */
  streamUrl?: string;
  /** Midscene Playground URL（含 /execute /status） */
  playgroundUrl?: string;
  /** 最近一帧截图路径（可选） */
  latestFramePath?: string;
  message?: string;
}
