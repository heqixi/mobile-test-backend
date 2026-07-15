/**
 * @module @mtp/executor-service/handlers/aep-handlers
 *
 * AEP HTTP 契约的实现：请求校验 / 状态码映射 → ExecutorPort。
 */

import type { ExecutorPort } from '@mtp/domain-executor';
import type {
  AepHealthHttpResponse,
  AepHttpHandlers,
  BindDeviceHttpRequest,
  InvokeToolHttpRequest,
  SampleHttpRequest,
} from '../api/aep-http.js';
import { fail, ok } from '../api/http-kit.js';

export function createAepHttpHandlers(executor: ExecutorPort): AepHttpHandlers {
  return {
    async listTools() {
      return ok(await executor.listTools());
    },

    async sample(body) {
      const req = body as SampleHttpRequest;
      try {
        return ok(
          await executor.sample({
            stepId: req.stepId,
            phase: req.phase,
            options: req.options,
          }),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return fail(502, { error: message });
      }
    },

    async invokeTool(body) {
      const req = body as Partial<InvokeToolHttpRequest>;
      if (!req.name?.trim()) {
        return fail(400, {
          ok: false,
          error: { code: 'INVALID_ARGS', message: 'name is required' },
        });
      }
      const result = await executor.invokeTool({
        name: req.name,
        arguments: req.arguments ?? {},
        timeoutMs: req.timeoutMs,
      });
      const status = result.ok
        ? 200
        : result.error?.code === 'TOOL_NOT_FOUND'
          ? 404
          : 502;
      return ok(result, status);
    },

    async bindDevice(body) {
      const req = body as Partial<BindDeviceHttpRequest>;
      const result = await executor.bindDevice({
        device: {
          platform: req.device?.platform ?? 'android',
          deviceId: req.device?.deviceId,
          appPackage: req.device?.appPackage,
        },
        launchUri: req.launchUri,
      });
      return ok(result, result.bound ? 200 : 400);
    },

    async abort() {
      return ok(await executor.abort());
    },

    async health() {
      const h = await executor.health();
      return ok({
        available: h.available,
        device: h.device,
        driverReady: h.driverReady,
        scrcpyReady: h.scrcpyReady,
        message: h.message ?? 'ok',
      } satisfies AepHealthHttpResponse);
    },
  };
}
