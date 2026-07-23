/**
 * Agent Service 进程入口
 *
 * OpenCode LLM + Executor Midscene + SSE 事件流 → :4100
 * Goal Space：FE/env 绑定 URL+spaceIds scope；每轮 plan 按需 retrieve（裁剪 ContextPack），禁止整图硬塞。
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
import {
  createGoalSpaceHttpClient,
  type GoalSpaceRetrievePort,
} from '@mtp/domain-goal-space';
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
const defaultGoalSpaceUrl =
  process.env.GOAL_SPACE_URL ?? 'http://127.0.0.1:4104';

export type GoalSpaceBind = {
  baseUrl: string;
  spaceIds: string[];
};

const RETRIEVE_LIMITS = {
  maxKeyframes: 3,
  maxTransitions: 6,
  maxThumbnails: 0,
  hop: 1,
} as const;

function expectationAsText(expectation: unknown): string {
  if (typeof expectation === 'string') return expectation;
  try {
    return JSON.stringify(expectation);
  } catch {
    return String(expectation);
  }
}

function envFallbackBind(): GoalSpaceBind | null {
  if (process.env.AGENT_GOAL_SPACE === '0') return null;
  const spaceId = process.env.GOAL_SPACE_ID?.trim() || 'cowork-android';
  return {
    baseUrl: defaultGoalSpaceUrl,
    spaceIds: [spaceId],
  };
}

async function retrieveScopedMarkdown(
  bind: GoalSpaceBind,
  input: {
    intentText: string;
    screenshotBase64?: string;
  },
): Promise<string | undefined> {
  const client: GoalSpaceRetrievePort = createGoalSpaceHttpClient({
    baseUrl: bind.baseUrl,
  });
  console.log(
    `[agent-service][goal-space] on-demand retrieve scope=[${bind.spaceIds.join(',')}] base=${bind.baseUrl} hasShot=${Boolean(input.screenshotBase64)} intentChars=${input.intentText.length}`,
  );
  const chunks: string[] = [];
  for (const spaceId of bind.spaceIds) {
    try {
      const pack = await client.retrieve({
        spaceId,
        intentText: input.intentText || '当前界面下一步操作',
        currentScreenshot: input.screenshotBase64
          ? { base64: input.screenshotBase64 }
          : undefined,
        strategy: input.screenshotBase64 ? 'auto' : 'text_only',
        limits: { ...RETRIEVE_LIMITS },
      });
      const md = pack.textMarkdown?.trim();
      if (md) {
        console.log(
          `[agent-service][goal-space] retrieve ok ${spaceId}@${pack.ref.version} chars=${md.length} strategy=${pack.diagnostics?.strategyUsed ?? '?'}`,
        );
        chunks.push(`### ${spaceId}\n\n${md}`);
      } else {
        console.log(
          `[agent-service][goal-space] retrieve empty ${spaceId}`,
        );
      }
    } catch (err) {
      console.warn(
        `[agent-service] goal-space retrieve skipped (${spaceId}):`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  if (chunks.length === 0) {
    console.log('[agent-service][goal-space] no ContextPack chunks this turn');
    return undefined;
  }
  const out = `## App 目标空间上下文（按需检索）\n\n${chunks.join('\n\n')}`;
  console.log(
    `[agent-service][goal-space] enrichPhaseContext totalChars=${out.length}`,
  );
  return out;
}

async function main() {
  const eventHub = createAgentEventHub();
  const playgroundRuns = createPlaygroundRunHub({
    claimTimeoutMs: Number(process.env.AGENT_PLAYGROUND_CLAIM_TIMEOUT_MS ?? 8_000),
    resultTimeoutMs: Number(process.env.AGENT_ACT_TIMEOUT_MS ?? 45_000),
  });
  const openCode = createOpenCodeHttpClient({
    baseUrl: openCodeUrl,
    directory: process.env.OPENCODE_DIRECTORY,
    username: process.env.OPENCODE_SERVER_USERNAME,
    password: process.env.OPENCODE_SERVER_PASSWORD,
  });
  const executor = createExecutorHttpClient({ baseUrl: executorUrl });

  /** FE 会话绑定；null 时回退 env（若未禁用） */
  const goalSpaceBindRef: { current: GoalSpaceBind | null } = {
    current: envFallbackBind(),
  };

  const setGoalSpaceBind = (bind: GoalSpaceBind | null) => {
    if (
      bind &&
      bind.baseUrl.trim() &&
      Array.isArray(bind.spaceIds) &&
      bind.spaceIds.length > 0
    ) {
      goalSpaceBindRef.current = {
        baseUrl: bind.baseUrl.trim().replace(/\/$/, ''),
        spaceIds: [...new Set(bind.spaceIds.map((s) => s.trim()).filter(Boolean))],
      };
    } else {
      goalSpaceBindRef.current = null;
    }
  };

  const agent = createAgentLoop({
    client: openCode,
    executor,
    enrichPhaseContext: async ({
      instruction,
      pendingCommand,
      screenshotBase64,
    }) => {
      const bind = goalSpaceBindRef.current;
      if (!bind?.spaceIds.length) {
        console.log(
          '[agent-service][goal-space] enrichPhaseContext skip (no FE/env bind)',
        );
        return undefined;
      }
      const intent = [
        expectationAsText(instruction.expectation),
        ...(instruction.actions ?? []),
        pendingCommand,
      ]
        .filter(Boolean)
        .join('\n');
      return retrieveScopedMarkdown(bind, {
        intentText: intent,
        screenshotBase64,
      });
    },
    onEvent: (event) => eventHub.publish(event),
    runActNlViaPlayground: async ({ command, requestId, timeoutMs }) => {
      return playgroundRuns.wait(requestId, command, {
        resultTimeoutMs: timeoutMs,
      });
    },
    cancelPlaygroundRun: (requestId) => {
      playgroundRuns.cancel(requestId, 'aborted by user');
    },
  });
  const http = createAgentHttpServer(
    {
      agent,
      openCode,
      eventHub,
      playgroundRuns,
      goalSpaceBind: {
        get: () => goalSpaceBindRef.current,
        set: setGoalSpaceBind,
      },
    },
    { port },
  );
  await http.listen();

  const probe = await probeOpenCode({
    baseUrl: openCode.baseUrl,
    directory: openCode.directory,
  });

  const bind = goalSpaceBindRef.current;
  console.log('');
  console.log('[agent-service] ready (OpenCode + Midscene + SSE)');
  console.log(`  HTTP       http://${http.host}:${http.port}`);
  console.log(`  SSE        http://${http.host}:${http.port}/api/agent/events`);
  console.log(`  OpenCode   ${openCode.baseUrl} (${probe.ok ? 'up' : 'DOWN'})`);
  console.log(`  Executor   ${executor.baseUrl}`);
  console.log(
    `  GoalSpace  ${
      bind
        ? `scoped ${bind.baseUrl} [${bind.spaceIds.join(',')}] (on-demand retrieve)`
        : 'unbound (FE bind or GOAL_SPACE_* env)'
    }`,
  );
  console.log(`  Playground act_nl → UniversalPlayground (ack/result)`);
  if (!probe.ok) {
    console.log(`  warn       ${probe.message ?? 'OpenCode unreachable'}`);
  }
  console.log(`  GET        /health /api/agent/health /api/agent/events`);
  console.log(`  POST       /api/agent/instructions/run`);
  console.log(`  POST       /api/agent/goal-space/bind`);
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
