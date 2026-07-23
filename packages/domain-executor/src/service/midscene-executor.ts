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
import type {
  AnnotateRequest,
  AnnotateResult,
  LocateHit,
  LocateRequest,
} from '../models/visual-evidence.js';
import { annotateScreenshotBase64 } from './annotate-image.js';

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
  {
    name: 'locate_nl',
    description: '自然语言定位 UI 元素，返回像素坐标',
    parameters: { phrase: 'string', deepLocate: 'boolean?' },
  },
  {
    name: 'annotate_rects',
    description: '在当前截图上按像素框绘制红框标签',
    parameters: { regions: 'AnnotateRegion[]' },
  },
];

export interface MidsceneExecutorDeps {
  agent: MidsceneAgentLike;
  deviceId: string;
  appPackage?: string;
  sidecar: EmbeddedSidecarHandle | null;
  getScreenshotBase64: () => Promise<string>;
  /** 中止当前 aiAct（含 Playground / freeform 共用同一 Agent） */
  onAbortAct?: () => void;
  /** 预置下一次 aiAct 的 maxActions（null=不限制） */
  onArmNextAiActMaxActions?: (maxActions: number | null) => void;
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
  private readonly onAbortAct?: () => void;
  private readonly onArmNextAiActMaxActions?: (
    maxActions: number | null,
  ) => void;
  private readonly onDestroy?: () => Promise<void>;
  private destroyed = false;

  constructor(deps: MidsceneExecutorDeps) {
    this.agent = deps.agent;
    this.deviceId = deps.deviceId;
    this.appPackage = deps.appPackage;
    this.sidecar = deps.sidecar;
    this.getScreenshotBase64 = deps.getScreenshotBase64;
    this.onAbortAct = deps.onAbortAct;
    this.onArmNextAiActMaxActions = deps.onArmNextAiActMaxActions;
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
        const args = request.arguments as
          | { prompt?: string; maxActions?: number }
          | undefined;
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
        const data = await this.agent.aiAct(prompt, {
          maxActions: args?.maxActions,
        });
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
      if (name === 'locate_nl') {
        const args = request.arguments as
          | { phrase?: string; deepLocate?: boolean }
          | undefined;
        const hit = await this.locate({
          phrase: args?.phrase ?? '',
          deepLocate: args?.deepLocate,
        });
        return {
          name,
          ok: hit.ok,
          data: hit,
          durationMs: Date.now() - startedAt,
          error: hit.ok
            ? undefined
            : { code: 'LOCATE_FAILED', message: hit.error ?? 'locate failed' },
        };
      }
      if (name === 'annotate_rects') {
        const args = request.arguments as AnnotateRequest | undefined;
        const result = await this.annotate({
          screenshotBase64: args?.screenshotBase64,
          regions: args?.regions ?? [],
          style: args?.style,
        });
        return {
          name,
          ok: result.ok,
          data: result,
          durationMs: Date.now() - startedAt,
          error: result.ok
            ? undefined
            : {
                code: 'ANNOTATE_FAILED',
                message: result.error ?? 'annotate failed',
              },
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
    const timeoutMsRaw = request.timeoutMs;
    const timeoutMs =
      typeof timeoutMsRaw === 'number' && Number.isFinite(timeoutMsRaw)
        ? Math.max(0, Math.floor(timeoutMsRaw))
        : Number(process.env.MIDSCENE_AI_ACT_TIMEOUT_MS ?? 120_000);
    const ac = new AbortController();
    try {
      // Agent 控机面板已通过 UniversalPlayground → /execute 推流。
      // freeform 回退必须直调 agent.aiAct，避免再占 Playground currentTaskId
      //（否则会出现 UI 无任务、却 409 Another task is already running）。
      const timer =
        timeoutMs > 0
          ? setTimeout(() => {
              ac.abort(`timeout after ${timeoutMs}ms`);
            }, timeoutMs)
          : null;
      try {
        const result = await this.agent.aiAct(prompt, {
          maxActions: request.maxActions,
          abortSignal: ac.signal,
        });
        return {
          ok: true,
          durationMs: Date.now() - startedAt,
          report: { prompt, result: result ?? null },
        };
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (error) {
      const err = error as {
        message?: string;
        name?: string;
        reason?: unknown;
        rawResponse?: unknown;
        rawChoiceMessage?: unknown;
        cause?: unknown;
      };
      const rawMessage = err?.message ?? String(error);
      const abortReason =
        typeof ac.signal.reason === 'string'
          ? ac.signal.reason
          : ac.signal.reason != null
            ? String(ac.signal.reason)
            : '';
      const timedOut =
        ac.signal.aborted ||
        /timeout/i.test(`${rawMessage} ${abortReason}`);
      const timeoutLabel =
        /timeout/i.test(abortReason) ? abortReason : `timeout after ${timeoutMs}ms`;
      console.error('[midscene-executor] freeformExecute failed:', {
        prompt,
        message: rawMessage,
        timedOut,
        abortReason: abortReason || undefined,
        rawResponse: err?.rawResponse,
        rawChoiceMessage: err?.rawChoiceMessage,
        cause:
          err?.cause instanceof Error
            ? err.cause.message
            : err?.cause != null
              ? String(err.cause)
              : undefined,
      });
      return {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: {
          code: timedOut ? 'FREEFORM_TIMEOUT' : 'FREEFORM_FAILED',
          message: timedOut
            ? /timeout/i.test(rawMessage)
              ? rawMessage
              : timeoutLabel
            : rawMessage,
        },
      };
    }
  }

  async locate(request: LocateRequest): Promise<LocateHit> {
    const phrase = request.phrase?.trim();
    const startedAt = Date.now();
    if (!phrase) {
      return {
        phrase: '',
        ok: false,
        error: 'phrase is required',
        durationMs: 0,
      };
    }
    if (typeof this.agent.aiLocate !== 'function') {
      return {
        phrase,
        ok: false,
        error: 'aiLocate not available on Midscene agent',
        durationMs: Date.now() - startedAt,
      };
    }
    const deepLocate =
      request.deepLocate ?? process.env.EXECUTOR_DEEP_LOCATE !== '0';
    try {
      const hit = await this.agent.aiLocate(phrase, { deepLocate });
      const rect = hit.rect;
      const area = (rect?.width ?? 0) * (rect?.height ?? 0);
      const pointFallback = area > 0 && area <= 64;
      const rectPx = rect
        ? {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.max(1, Math.round(rect.width)),
            height: Math.max(1, Math.round(rect.height)),
          }
        : undefined;
      return {
        phrase,
        ok: Boolean(rectPx || hit.center),
        rect: rectPx,
        rectPx,
        center: hit.center,
        dpr: hit.dpr,
        quality: pointFallback ? 'point_fallback' : 'bbox',
        deepLocate,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        phrase,
        ok: false,
        deepLocate,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async annotate(request: AnnotateRequest): Promise<AnnotateResult> {
    if (!request.regions?.length) {
      return { ok: false, error: 'regions required' };
    }
    try {
      const base64 =
        request.screenshotBase64?.replace(/^data:image\/\w+;base64,/, '') ??
        (await this.getScreenshotBase64());
      return await annotateScreenshotBase64(
        base64,
        request.regions,
        request.style,
      );
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
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
    this.onAbortAct?.();
    return { aborted: true };
  }

  async armNextAiActMaxActions(
    maxActions: number | null,
  ): Promise<{ ok: boolean }> {
    this.onArmNextAiActMaxActions?.(maxActions);
    return { ok: true };
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    await this.sidecar?.close().catch(() => undefined);
    this.sidecar = null;
    await this.onDestroy?.().catch(() => undefined);
  }
}
