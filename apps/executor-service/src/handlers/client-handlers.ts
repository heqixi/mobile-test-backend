/**
 * @module @mtp/executor-service/handlers/client-handlers
 *
 * Client 直连 HTTP 契约的实现：请求校验 / 响应组装 → ExecutorPort。
 */

import type { ExecutorPort } from '@mtp/domain-executor';
import type {
  ClientHealthResponse,
  ClientHttpHandlers,
  FreeformHttpRequest,
} from '../api/client-http.js';
import { ClientHttpRoutes } from '../api/client-http.js';
import { fail, ok } from '../api/http-kit.js';

export function createClientHttpHandlers(
  executor: ExecutorPort,
): ClientHttpHandlers {
  return {
    async health() {
      const h = await executor.health();
      const body: ClientHealthResponse = {
        status: h.available ? 'ok' : 'down',
        ok: h.available,
        available: h.available,
        deviceId: h.device?.deviceId,
        adbDevices: h.adbDevices,
        device: h.device,
        preview: ClientHttpRoutes.previewScreenshot,
        agentAct: ClientHttpRoutes.agentAct,
        freeform: ClientHttpRoutes.freeformExecute,
        playground: h.playground,
        scrcpy: h.scrcpy,
        message: h.message,
      };
      return ok(body);
    },

    async getPreview() {
      return ok(await executor.getPreview());
    },

    async captureScreenshot() {
      const shot = await executor.captureScreenshot();
      return ok(shot, shot.ok ? 200 : 502);
    },

    async freeformExecute(body) {
      const req = body as Partial<FreeformHttpRequest>;
      const prompt = req.prompt?.trim();
      if (!prompt) {
        return fail(400, { ok: false, error: 'prompt is required' });
      }
      const result = await executor.freeformExecute({
        prompt,
        timeoutMs: req.timeoutMs,
        metadata: req.metadata,
      });
      const report = result.report as
        | { prompt?: string; result?: unknown }
        | undefined;
      return ok(
        {
          ok: result.ok,
          prompt,
          durationMs: result.durationMs,
          result: report?.result ?? null,
          report: result.report ?? null,
          error: result.error?.message,
        },
        result.ok ? 200 : 502,
      );
    },
  };
}
