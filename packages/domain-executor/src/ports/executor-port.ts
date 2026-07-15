/**
 * @module @mtp/domain-executor/ports/executor-port
 *
 * Executor 领域端口（architecture §4.2 Can）。
 * HTTP 门面（apps/executor-service）只转发到本端口，不实现设备/Midscene 逻辑。
 *
 * **Must not**：
 * - 不知道 Case / Expectation / judge 业务语义
 * - 不维护「测到第几步」
 * - 不做「是否达成期望」的最终权威
 */

import type {
  BindDeviceRequest,
  BindDeviceResult,
  DeviceHealth,
} from '../models/device.js';
import type {
  FreeformExecuteRequest,
  FreeformExecuteResult,
  PreviewInfo,
} from '../models/freeform.js';
import type { ScreenshotResult } from '../models/screenshot.js';
import type { SampleRequest, UiSnapshot } from '../models/snapshot.js';
import type {
  InvokeToolRequest,
  ToolDescription,
  ToolResult,
} from '../models/tool.js';

/**
 * Executor 领域服务端口。
 */
export interface ExecutorPort {
  /**
   * 连接/启动设备。
   * @throws BIND_FAILED | DEVICE_UNAVAILABLE
   */
  bindDevice(request: BindDeviceRequest): Promise<BindDeviceResult>;

  /**
   * 返回工具列表 JSON。
   * 给 Case/LLM 看；**不**要求 Agent 建工具语义模型。
   */
  listTools(): Promise<ToolDescription[]>;

  /**
   * UI 感知 → UiSnapshot。
   * 原始观察；**不是**业务态判定。
   */
  sample(request: SampleRequest): Promise<UiSnapshot>;

  /**
   * 按名执行工具。
   * 入参不透明转发；不是 case step。
   * @throws TOOL_NOT_FOUND | TOOL_TIMEOUT | EXECUTOR_BUSY
   */
  invokeTool(request: InvokeToolRequest): Promise<ToolResult>;

  /**
   * Scrcpy / Playground 预览元信息（Client 直连）。
   */
  getPreview(): Promise<PreviewInfo>;

  /**
   * ADB 截图（Scrcpy 不可用时的回退）。
   */
  captureScreenshot(): Promise<ScreenshotResult>;

  /**
   * 自然语言直控（Playground / freeform）。
   * **不**进入 Agent Episode 语义。
   */
  freeformExecute(
    request: FreeformExecuteRequest,
  ): Promise<FreeformExecuteResult>;

  /** 设备/驱动/侧车可达性 */
  health(): Promise<DeviceHealth>;

  /** 中止当前正在执行的操作（若有） */
  abort(): Promise<{ aborted: boolean }>;

  /** 释放设备、Agent、侧车资源 */
  destroy(): Promise<void>;
}
