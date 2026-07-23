/**
 * Agent Service 进程入口
 *
 * OpenCode LLM + Executor Midscene + SSE 事件流 → :4100
 * act_nl 优先经前端 UniversalPlayground 推流执行。
 */

import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createAgentLoop,
  createExecutorHttpClient,
  createOpenCodeHttpClient,
  probeOpenCode,
} from '@mtp/domain-agent';
import { createGoalSpaceHttpClient } from '@mtp/domain-goal-space';
import { createAgentHttpServer } from './http-server.js';
import { createAgentEventHub } from './sse/agent-event-hub.js';
import { createPlaygroundRunHub } from './sse/playground-run-hub.js';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../.env') });
loadEnv();

const port = Number(
  process.env.AGENT_PORT ?? process.env.MTP_AGENT_PORT ?? 4100,
);
const openCodeUrl =
  process.env.OPENCODE_URL ?? 'http://127.0.0.1:4096';
const executorUrl =
  process.env.EXECUTOR_URL ?? 'http://127.0.0.1:4098';
const goalSpaceUrl =
  process.env.GOAL_SPACE_URL ?? 'http://127.0.0.1:4104';

async function main() {
  const eventHub = createAgentEventHub();
  const playgroundRuns = createPlaygroundRunHub({
    claimTimeoutMs: Number(process.env.AGENT_PLAYGROUND_CLAIM_TIMEOUT_MS ?? 8_000),
    resultTimeoutMs: Number(process.env.AGENT_ACT_TIMEOUT_MS ?? 15_000),
  });
  const openCode = createOpenCodeHttpClient({
    baseUrl: openCodeUrl,
    directory: process.env.OPENCODE_DIRECTORY,
    username: process.env.OPENCODE_SERVER_USERNAME,
    password: process.env.OPENCODE_SERVER_PASSWORD,
  });
  const executor = createExecutorHttpClient({ baseUrl: executorUrl });
  const goalSpace =
    process.env.AGENT_GOAL_SPACE === '0'
      ? undefined
      : createGoalSpaceHttpClient({ baseUrl: goalSpaceUrl });
  const agent = createAgentLoop({
    client: openCode,
    executor,
    goalSpace,
    goalSpaceRef: process.env.GOAL_SPACE_ID
      ? {
          spaceId: process.env.GOAL_SPACE_ID,
          version: process.env.GOAL_SPACE_VERSION || undefined,
        }
      : undefined,
    onEvent: (event) => eventHub.publish(event),
    runActNlViaPlayground: async ({ command, requestId }) => {
      return playgroundRuns.wait(requestId, command);
    },
    cancelPlaygroundRun: (requestId) => {
      playgroundRuns.cancel(requestId, 'aborted by user');
    },
  });
  const http = createAgentHttpServer(
    { agent, openCode, eventHub, playgroundRuns },
    { port },
  );
  await http.listen();

  const probe = await probeOpenCode({
    baseUrl: openCode.baseUrl,
    directory: openCode.directory,
  });

  console.log('');
  console.log('[agent-service] ready (OpenCode + Midscene + SSE)');
  console.log(`  HTTP       http://${http.host}:${http.port}`);
  console.log(`  SSE        http://${http.host}:${http.port}/api/agent/events`);
  console.log(`  OpenCode   ${openCode.baseUrl} (${probe.ok ? 'up' : 'DOWN'})`);
  console.log(`  Executor   ${executor.baseUrl}`);
  console.log(
    `  GoalSpace  ${goalSpaceUrl} (${goalSpace ? 'enabled' : 'disabled'})`,
  );
  console.log(`  Playground act_nl → UniversalPlayground (ack/result)`);
  if (!probe.ok) {
    console.log(`  warn       ${probe.message ?? 'OpenCode unreachable'}`);
  }
  console.log(`  GET        /health /api/agent/health /api/agent/events`);
  console.log(`  POST       /api/agent/instructions/run`);
  console.log(`  POST       /api/agent/abort  |  /api/agent/episodes/:id/abort`);
  console.log(`  POST       /api/agent/playground-runs/:id/ack|result`);
  console.log('');

  const shutdown = async () => {
    console.log('[agent-service] shutting down...');
    await http.close().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
