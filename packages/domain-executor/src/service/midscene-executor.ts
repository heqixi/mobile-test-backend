/**
 * @module @mtp/domain-executor/service/midscene-executor
 *
 * Midscene + Android 的 ExecutorPort 实现。
 * 设备绑定、采样、工具、freeform、预览均在此域内完成。
 */

import type {
  BindDeviceRequest,
  BindDeviceResult,
  DeviceHealth,
  DeviceRef,
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
import type { ExecutorPort } from '../ports/executor-port.js';
import type { MidsceneAgentLike } from '../midscene/agent-types.js';
import { captureUiSnapshot } from '../midscene/sample.js';
import type { EmbeddedSidecarHandle } from '../adapters/playground-sidecar.js';
import { listAdbDevices } from '../adapters/adb-screenshot.js';

const BUILTIN_TOOLS: ToolDescription[] = [
  {
    name: 'act_nl',
    description: '自然语言操作当前 Android 界面',
    parameters: { prompt: 'string' },
  },
  {
    name: 'sample_ui',
    description: '截图并描述当前 UI',
  },
];

export interface MidsceneExecutorDeps {
  agent: MidsceneAgentLike;
  deviceId: string;
  appPackage?: string;
  sidecar: EmbeddedSidecarHandle | null;
  getScreenshotBase64: () => Promise<string>;
  /** 释放底层 device / agent（不含 sidecar，由本类统一 close） */
  onDestroy?: () => Promise<void>;
}

/**
 * ExecutorPort 的 Midscene 实现。
 */
export class MidsceneExecutor implements ExecutorPort {
  private readonly agent: MidsceneAgentLike;
  private deviceId: string;
  private appPackage?: string;
  private sidecar: EmbeddedSidecarHandle | null;
  private readonly getScreenshotBase64: () => Promise<string>;
  private readonly onDestroy?: () => Promise<void>;
  private destroyed = false;

  constructor(deps: MidsceneExecutorDeps) {
    this.agent = deps.agent;
    this.deviceId = deps.deviceId;
    this.appPackage = deps.appPackage;
    this.sidecar = deps.sidecar;
    this.getScreenshotBase64 = deps.getScreenshotBase64;
    this.onDestroy = deps.onDestroy;
  }

  private deviceRef(): DeviceRef {
    return {
      platform: 'android',
      deviceId: this.deviceId,
      appPackage: this.appPackage,
    };
  }

  async bindDevice(request: BindDeviceRequest): Promise<BindDeviceResult> {
    // 进程启动时已绑定；阶段一不支持热切换，返回当前设备
    if (request.device.deviceId && request.device.deviceId !== this.deviceId) {
      return {
        bound: false,
        device: this.deviceRef(),
        message: `hot-swap not supported; current=${this.deviceId}`,
      };
    }
    return {
      bound: true,
      device: this.deviceRef(),
      message: 'already bound at process start',
    };
  }

  async listTools(): Promise<ToolDescription[]> {
    return BUILTIN_TOOLS;
  }

  async sample(request: SampleRequest): Promise<UiSnapshot> {
    return captureUiSnapshot(
      this.agent,
      request.phase ?? 'on_demand',
      request.stepId,
    );
  }

  async invokeTool(request: InvokeToolRequest): Promise<ToolResult> {
    const startedAt = Date.now();
    const name = request.name?.trim();
    try {
      if (name === 'act_nl') {
        const args = request.arguments as { prompt?: string } | undefined;
        const prompt = args?.prompt?.trim();
        if (!prompt) {
          return {
            name: name ?? 'act_nl',
            ok: false,
            durationMs: Date.now() - startedAt,
            error: {
              code: 'INVALID_ARGS',
              message: 'arguments.prompt required',
            },
          };
        }
        const data = await this.agent.aiAct(prompt);
        return {
          name,
          ok: true,
          data,
          durationMs: Date.now() - startedAt,
        };
      }
      if (name === 'sample_ui') {
        const data = await captureUiSnapshot(this.agent);
        return {
          name,
          ok: true,
          data,
          durationMs: Date.now() - startedAt,
        };
      }
      return {
        name: name ?? '',
        ok: false,
        durationMs: Date.now() - startedAt,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Unknown tool: ${name}`,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        name: name ?? '',
        ok: false,
        durationMs: Date.now() - startedAt,
        error: { code: 'TOOL_FAILED', message },
      };
    }
  }

  async getPreview(): Promise<PreviewInfo> {
    const sidecar = this.sidecar;
    return {
      available: true,
      streamUrl: sidecar?.scrcpyUrl,
      playgroundUrl: sidecar?.playgroundUrl,
      message: sidecar ? 'scrcpy+playground ready' : 'adb screenshot only',
    };
  }

  async captureScreenshot(): Promise<ScreenshotResult> {
    try {
      const base64 = await this.getScreenshotBase64();
      return {
        ok: true,
        format: 'png',
        base64,
        dataUrl: `data:image/png;base64,${base64}`,
        capturedAt: new Date().toISOString(),
        deviceId: this.deviceId,
        source: 'adb',
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        deviceId: this.deviceId,
        source: 'adb',
      };
    }
  }

  async freeformExecute(
    request: FreeformExecuteRequest,
  ): Promise<FreeformExecuteResult> {
    const prompt = request.prompt?.trim();
    const startedAt = Date.now();
    if (!prompt) {
      return {
        ok: false,
        durationMs: 0,
        error: { code: 'INVALID_ARGS', message: 'prompt is required' },
      };
    }
    try {
      // Agent 控机面板已通过 UniversalPlayground → /execute 推流。
      // freeform 回退必须直调 agent.aiAct，避免再占 Playground currentTaskId
      //（否则会出现 UI 无任务、却 409 Another task is already running）。
      const result = await this.agent.aiAct(prompt);
      return {
        ok: true,
        durationMs: Date.now() - startedAt,
        report: { prompt, result: result ?? null },
      };
    } catch (error) {
      return {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: {
          code: 'FREEFORM_FAILED',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async health(): Promise<DeviceHealth> {
    const sidecar = this.sidecar;
    return {
      available: !this.destroyed,
      device: this.deviceRef(),
      driverReady: !this.destroyed,
      scrcpyReady: Boolean(sidecar),
      message: 'ok',
      adbDevices: await listAdbDevices(),
      playground: sidecar
        ? {
            ok: true,
            url: sidecar.playgroundUrl,
            port: sidecar.playgroundPort,
            scrcpyPort: sidecar.scrcpyPort,
          }
        : { ok: false },
      scrcpy: sidecar
        ? {
            ok: true,
            url: sidecar.scrcpyUrl,
            port: sidecar.scrcpyPort,
          }
        : { ok: false },
    };
  }

  async abort(): Promise<{ aborted: boolean }> {
    // Midscene 暂无统一 cancel；占位成功
    return { aborted: true };
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    await this.sidecar?.close().catch(() => undefined);
    this.sidecar = null;
    await this.onDestroy?.().catch(() => undefined);
  }
}
