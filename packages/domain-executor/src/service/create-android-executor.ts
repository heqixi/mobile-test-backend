/**
 * @module @mtp/domain-executor/service/create-android-executor
 *
 * 组装 Android 设备 + Midscene Agent + Scrcpy/Playground 侧车 → ExecutorPort。
 * 启动编排属于领域适配层；HTTP 进程只调用本工厂。
 */

import {
  AndroidAgent,
  AndroidDevice,
  getConnectedDevices,
} from '@midscene/android';
import { sleep } from '@midscene/core/utils';
import {
  createScreenshotThrottle,
} from '../adapters/adb-screenshot.js';
import { installMidscenePlanningLogs } from '../adapters/midscene-planning-logs.js';
import { startEmbeddedSidecars } from '../adapters/playground-sidecar.js';
import { MidsceneExecutor } from './midscene-executor.js';
import type { ExecutorPort } from '../ports/executor-port.js';

export interface CreateAndroidExecutorOptions {
  /** 指定 ADB serial；缺省取第一台已连接设备 */
  deviceId?: string;
  /** 启动包名；默认 cn.wps.moffice_eng */
  appPackage?: string;
  /** launch 后等待毫秒数 */
  launchDelayMs?: number;
  /** 为 true 时不 launch App */
  skipLaunch?: boolean;
  /** Midscene aiActionContext */
  aiActionContext?: string;
  /**
   * Midscene aiAct 重规划上限（默认 5，可用 MIDSCENE_REPLANNING_CYCLE_LIMIT 覆盖）。
   * 过小可能截断合法多步任务；过大易在「界面几乎不变」时空转。
   */
  replanningCycleLimit?: number;
  /** 截图节流间隔 */
  screenshotMinIntervalMs?: number;
}

async function resolveDeviceId(preferred?: string): Promise<string> {
  if (preferred?.trim()) return preferred.trim();
  const devices = await getConnectedDevices();
  const id = devices.at(0)?.udid;
  if (!id) {
    throw new Error(
      'No Android devices found. Connect a device and run `adb devices`.',
    );
  }
  return id;
}

/** 默认 5；非法 / 未设时回退默认值 */
function resolveReplanningCycleLimit(option?: number): number {
  const fromOpt =
    typeof option === 'number' && Number.isFinite(option) ? option : undefined;
  const fromEnv = Number(process.env.MIDSCENE_REPLANNING_CYCLE_LIMIT);
  const raw =
    fromOpt ??
    (Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : undefined) ??
    5;
  return Math.max(1, Math.floor(raw));
}

/**
 * 创建并启动 Android Midscene Executor（实现 ExecutorPort）。
 */
export async function createAndroidExecutor(
  options: CreateAndroidExecutorOptions = {},
): Promise<ExecutorPort> {
  installMidscenePlanningLogs();

  const appPackage =
    options.appPackage?.trim() ||
    process.env.ANDROID_APP_PACKAGE?.trim() ||
    'cn.wps.moffice_eng';
  const launchDelay =
    options.launchDelayMs ??
    Number(process.env.ANDROID_LAUNCH_DELAY ?? 3000);
  const skipLaunch =
    options.skipLaunch ?? process.env.ANDROID_SKIP_LAUNCH === '1';
  const deviceId = await resolveDeviceId(
    options.deviceId ?? process.env.ANDROID_DEVICE_ID,
  );

  console.log(`[domain-executor] Connecting Android device: ${deviceId}`);
  const device = new AndroidDevice(deviceId);
  await device.connect();

  if (!skipLaunch) {
    console.log(`[domain-executor] Launching ${appPackage}...`);
    await device.launch(appPackage);
    if (launchDelay > 0) {
      await sleep(launchDelay);
    }
  } else {
    console.log('[domain-executor] skipLaunch=true — skip app launch');
  }

  const replanningCycleLimit = resolveReplanningCycleLimit(
    options.replanningCycleLimit,
  );

  const agent = new AndroidAgent(device, {
    aiActionContext:
      options.aiActionContext?.trim() ||
      process.env.MIDSCENE_AI_ACTION_CONTEXT?.trim() ||
      'Follow instructions precisely using visible UI labels on screen.',
    replanningCycleLimit,
  });
  console.log(
    `[domain-executor] Midscene replanningCycleLimit=${replanningCycleLimit}`,
  );

  /** Playground / freeform 共用同一 Agent；abort 时打断当前 aiAct */
  let actAbort: AbortController | null = null;
  const rawAiAct = agent.aiAct.bind(agent);
  agent.aiAct = async (prompt, opt) => {
    actAbort?.abort();
    const ac = new AbortController();
    actAbort = ac;
    const external = opt?.abortSignal;
    const onExternal = () => ac.abort(external?.reason);
    if (external?.aborted) {
      ac.abort(external.reason);
    } else {
      external?.addEventListener('abort', onExternal, { once: true });
    }
    try {
      return await rawAiAct(prompt, { ...opt, abortSignal: ac.signal });
    } finally {
      external?.removeEventListener('abort', onExternal);
      if (actAbort === ac) actAbort = null;
    }
  };
  const abortCurrentAct = () => {
    actAbort?.abort('aborted by user');
    actAbort = null;
  };

  const captureScreenshot = createScreenshotThrottle(
    options.screenshotMinIntervalMs ?? 2000,
  );

  let sidecar: Awaited<ReturnType<typeof startEmbeddedSidecars>> = null;
  try {
    sidecar = await startEmbeddedSidecars({ agent, deviceId });
  } catch (error) {
    console.warn(
      '[domain-executor] Embedded Playground/Scrcpy failed (ADB screenshot fallback still available):',
      error instanceof Error ? error.message : error,
    );
  }

  return new MidsceneExecutor({
    agent,
    deviceId,
    appPackage,
    sidecar,
    getScreenshotBase64: async () => {
      const shot = await captureScreenshot(deviceId);
      return shot.base64;
    },
    onAbortAct: abortCurrentAct,
    onDestroy: async () => {
      abortCurrentAct();
      await agent.destroy?.().catch(() => undefined);
      await device.destroy().catch(() => undefined);
    },
  });
}
