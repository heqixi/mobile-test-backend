/**
 * Executor Service 进程入口
 *
 * 职责：加载环境变量 → 创建领域 ExecutorPort → 挂 HTTP 门面 → 监听。
 * 设备 / Midscene / Scrcpy 逻辑全部在 @mtp/domain-executor。
 */

import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAndroidExecutor } from '@mtp/domain-executor';
import { createExecutorHttpServer } from './http-server.js';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../.env') });
loadEnv();

const port = Number(
  process.env.EXECUTOR_PORT ?? process.env.MTP_EXECUTOR_PORT ?? 4098,
);

async function main() {
  const executor = await createAndroidExecutor();
  const http = createExecutorHttpServer(executor, { port });
  await http.listen();

  const health = await executor.health();

  console.log('');
  console.log('[executor-service] ready (HTTP facade only)');
  console.log(`  HTTP       http://${http.host}:${http.port}`);
  console.log(`  GET        /health /preview /preview/screenshot`);
  console.log(`  POST       /freeform/execute /agent/act`);
  console.log(`  POST       /aep/v0.2/*`);
  if (health.playground?.ok && health.playground.url) {
    console.log(`  Playground ${health.playground.url}`);
  }
  if (health.scrcpy?.ok && health.scrcpy.url) {
    console.log(`  Scrcpy     ${health.scrcpy.url}`);
  }
  console.log('');

  const shutdown = async () => {
    console.log('[executor-service] shutting down...');
    await http.close().catch(() => undefined);
    await executor.destroy().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // ADB / scrcpy 底层流偶发断开（ExactReadable ended）不应直接拖垮整站 HTTP
  process.on('unhandledRejection', (reason) => {
    const message =
      reason instanceof Error ? reason.message : String(reason ?? '');
    console.error('[executor-service] unhandledRejection:', message);
    if (/ExactReadable ended|device offline|ADB/i.test(message)) {
      console.error(
        '[executor-service] ADB/stream error absorbed — HTTP stays up; reconnect device then refresh frontend',
      );
      return;
    }
  });
  process.on('uncaughtException', (error) => {
    console.error('[executor-service] uncaughtException:', error);
    if (/ExactReadable ended/i.test(error.message)) {
      console.error(
        '[executor-service] ADB stream ended absorbed — keep listening on HTTP',
      );
      return;
    }
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
