/**
 * @module @mtp/domain-executor/device
 *
 * 设备引用与绑定模型。
 * Executor **不理解** Case / Instruction / Expectation 业务语义。
 */

import type { Platform } from '@mtp/shared-kernel';

/**
 * 被测设备引用。
 * Agent 经 AEP `BindDevice` 设置；Client 预览流也可查询。
 */
export interface DeviceRef {
  platform: Platform;

  /** ADB serial / iOS udid / web browser id */
  deviceId?: string;

  /** Android package / iOS bundle id（可选） */
  appPackage?: string;
}

/**
 * 绑定设备请求（AEP BindDevice payload / ExecutorPort.bindDevice）。
 */
export interface BindDeviceRequest {
  device: DeviceRef;

  /** 可选：启动时打开的 URI 或 deep link */
  launchUri?: string;
}

/** 绑定结果 */
export interface BindDeviceResult {
  bound: boolean;
  device: DeviceRef;
  message?: string;
}

/**
 * 设备健康检查结果（`health` / GetDeviceHealth）。
 * 仅描述技术可达性，不描述业务态。
 */
export interface DeviceHealth {
  available: boolean;
  device?: DeviceRef;
  /** Midscene / 驱动是否就绪 */
  driverReady?: boolean;
  /** Scrcpy 预览是否就绪 */
  scrcpyReady?: boolean;
  message?: string;
  /** 当前 ADB 设备列表 */
  adbDevices?: string[];
  /** Playground 侧车（对话协议 :5800） */
  playground?: {
    ok: boolean;
    url?: string;
    port?: number;
    scrcpyPort?: number;
  };
  /** Scrcpy 侧车（实时流 :5700） */
  scrcpy?: {
    ok: boolean;
    url?: string;
    port?: number;
  };
}
