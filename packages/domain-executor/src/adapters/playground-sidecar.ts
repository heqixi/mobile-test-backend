import path from 'node:path';
import { createRequire } from 'node:module';
import {
  playgroundForAgent,
  type LaunchPlaygroundResult,
} from '@midscene/playground';
import {
  PLAYGROUND_SERVER_PORT,
} from '@midscene/shared/constants';
import type { MidsceneAgentLike } from '../midscene/agent-types.js';
import { ScrcpyServer, SCRCPY_SERVER_PORT } from '../scrcpy/index.js';

export interface EmbeddedSidecarHandle {
  /** Playground HTTP API（UniversalPlayground / PromptInput 连此地址） */
  playgroundUrl: string;
  playgroundPort: number;
  /** Scrcpy 实时流 */
  scrcpyUrl: string;
  scrcpyPort: number;
  close: () => Promise<void>;
}

/** package.json 不在 exports 里，从入口文件反推包根目录 */
function resolvePlaygroundStaticDir(): string | undefined {
  try {
    const require = createRequire(import.meta.url);
    const entry = require.resolve('@midscene/playground');
    // .../dist/lib/index.js → package root
    const root = path.resolve(path.dirname(entry), '../..');
    return path.join(root, 'static');
  } catch {
    return undefined;
  }
}

/**
 * 启动：
 * 1) Scrcpy 推流（左侧画面）
 * 2) PlaygroundServer（官方 /execute 协议，复用 PromptInput + 对话流）
 * 与 MTP 共用同一 Midscene Agent。
 */
export async function startEmbeddedSidecars(options: {
  agent: MidsceneAgentLike;
  deviceId: string;
}): Promise<EmbeddedSidecarHandle | null> {
  if (process.env.MIDSCENE_PLAYGROUND === '0') {
    console.log('Embedded Playground/Scrcpy disabled (MIDSCENE_PLAYGROUND=0)');
    return null;
  }

  const playgroundPort = Number(
    process.env.MIDSCENE_PLAYGROUND_PORT ?? PLAYGROUND_SERVER_PORT,
  );
  const scrcpyPort = Number(
    process.env.MIDSCENE_SCRCPY_PORT ?? SCRCPY_SERVER_PORT,
  );

  const scrcpyEnabled = process.env.MIDSCENE_SCRCPY !== '0';
  let scrcpy: ScrcpyServer | null = null;
  if (scrcpyEnabled) {
    scrcpy = new ScrcpyServer();
    scrcpy.currentDeviceId = options.deviceId;
    await scrcpy.launch(scrcpyPort);
  }

  let launched: LaunchPlaygroundResult;
  try {
    const staticPath = resolvePlaygroundStaticDir();
    launched = await playgroundForAgent(options.agent as never).launch({
      port: playgroundPort,
      openBrowser: false,
      verbose: true,
      enableCors: true,
      ...(staticPath ? { staticPath } : {}),
      configureServer(server) {
        if (scrcpy) {
          server.scrcpyPort = scrcpyPort;
        }
      },
    });
  } catch (error) {
    scrcpy?.close();
    throw error;
  }

  const playgroundUrl =
    process.env.MIDSCENE_PLAYGROUND_URL?.replace(/\/$/, '') ??
    `http://127.0.0.1:${launched.port}`;
  const scrcpyUrl =
    process.env.MIDSCENE_SCRCPY_URL?.replace(/\/$/, '') ??
    `http://127.0.0.1:${scrcpyPort}`;

  return {
    playgroundUrl,
    playgroundPort: launched.port,
    scrcpyUrl,
    scrcpyPort,
    close: async () => {
      await launched.close();
      scrcpy?.close();
    },
  };
}

/** @deprecated 使用 startEmbeddedSidecars */
export async function startEmbeddedScrcpy(options: {
  deviceId: string;
  agent?: MidsceneAgentLike;
}): Promise<EmbeddedSidecarHandle | null> {
  if (!options.agent) {
    console.warn('startEmbeddedScrcpy requires agent; skipping Playground API');
    return null;
  }
  return startEmbeddedSidecars({
    agent: options.agent,
    deviceId: options.deviceId,
  });
}
