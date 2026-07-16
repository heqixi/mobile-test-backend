/**
 * @module @mtp/domain-agent/adapters/opencode-http
 *
 * OpenCode Server HTTP 客户端（默认 :4096）。
 * 仅做 session / message / health；不解析业务语义。
 */

export interface OpenCodeHttpOptions {
  /** 例：http://127.0.0.1:4096 */
  baseUrl?: string;
  /** Basic auth（OPENCODE_SERVER_PASSWORD） */
  username?: string;
  password?: string;
  /** 绑定项目目录；解决 project-local agent 需 directory 的问题 */
  directory?: string;
  fetchImpl?: typeof fetch;
}

export interface OpenCodeSession {
  id: string;
  title?: string;
  directory?: string;
  [key: string]: unknown;
}

export interface OpenCodeMessagePart {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface OpenCodeMessageResponse {
  info: Record<string, unknown>;
  parts: OpenCodeMessagePart[];
}

export class OpenCodeHttpError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string, path: string) {
    super(`OpenCode ${status} ${path}: ${body}`);
    this.name = 'OpenCodeHttpError';
    this.status = status;
    this.body = body;
  }
}

export class OpenCodeHttpClient {
  readonly baseUrl: string;
  private readonly username?: string;
  private readonly password?: string;
  readonly directory?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenCodeHttpOptions = {}) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.OPENCODE_URL ??
      'http://127.0.0.1:4096'
    ).replace(/\/$/, '');
    this.username =
      options.username ?? process.env.OPENCODE_SERVER_USERNAME ?? 'opencode';
    this.password =
      options.password ?? process.env.OPENCODE_SERVER_PASSWORD ?? undefined;
    this.directory = options.directory ?? process.env.OPENCODE_DIRECTORY;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private headers(extra?: HeadersInit): Headers {
    const h = new Headers(extra);
    if (!h.has('Content-Type')) {
      h.set('Content-Type', 'application/json');
    }
    if (this.password) {
      const token = Buffer.from(
        `${this.username}:${this.password}`,
        'utf8',
      ).toString('base64');
      h.set('Authorization', `Basic ${token}`);
    }
    if (this.directory) {
      h.set('x-opencode-directory', this.directory);
    }
    return h;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new OpenCodeHttpError(res.status, text, path);
    }
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  health(): Promise<{ healthy: boolean; version?: string }> {
    return this.request('GET', '/global/health');
  }

  createSession(input?: {
    title?: string;
    parentID?: string;
  }): Promise<OpenCodeSession> {
    return this.request('POST', '/session', input ?? {});
  }

  getSession(sessionId: string): Promise<OpenCodeSession> {
    return this.request('GET', `/session/${encodeURIComponent(sessionId)}`);
  }

  /**
   * 同步发消息并等待 assistant 回复。
   * body.parts 必填（OpenCode Server API）。
   */
  postMessage(
    sessionId: string,
    input: {
      parts: OpenCodeMessagePart[];
      agent?: string;
      system?: string;
      noReply?: boolean;
      model?: { providerID: string; modelID: string };
    },
  ): Promise<OpenCodeMessageResponse> {
    return this.request(
      'POST',
      `/session/${encodeURIComponent(sessionId)}/message`,
      input,
    );
  }

  /** 便捷：纯文本消息 */
  postText(
    sessionId: string,
    text: string,
    extra?: Omit<Parameters<OpenCodeHttpClient['postMessage']>[1], 'parts'>,
  ): Promise<OpenCodeMessageResponse> {
    return this.postMessage(sessionId, {
      ...extra,
      parts: [{ type: 'text', text }],
    });
  }

  /**
   * 一轮带可选截图的消息。
   * `system` 仅应在 Session 第一轮传入。
   */
  postRound(
    sessionId: string,
    input: {
      text: string;
      /** 仅首轮：统一 SystemPrompt */
      system?: string;
      /** data:image/...;base64,... */
      imageDataUrl?: string;
      imageFilename?: string;
      noReply?: boolean;
      agent?: string;
      model?: { providerID: string; modelID: string };
    },
  ): Promise<OpenCodeMessageResponse> {
    const parts: OpenCodeMessagePart[] = [{ type: 'text', text: input.text }];
    if (input.imageDataUrl) {
      const mimeMatch = /^data:([^;]+);base64,/.exec(input.imageDataUrl);
      const mime = mimeMatch?.[1] ?? 'image/png';
      parts.push({
        type: 'file',
        mime,
        filename: input.imageFilename ?? 'screen.png',
        url: input.imageDataUrl,
      });
    }
    return this.postMessage(sessionId, {
      parts,
      system: input.system,
      noReply: input.noReply,
      agent: input.agent,
      model: input.model,
    });
  }
}

export function extractAssistantText(
  response: OpenCodeMessageResponse,
): string {
  return (response.parts ?? [])
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text as string)
    .join('\n')
    .trim();
}

export function createOpenCodeHttpClient(
  options?: OpenCodeHttpOptions,
): OpenCodeHttpClient {
  return new OpenCodeHttpClient(options);
}

export async function probeOpenCode(
  options?: OpenCodeHttpOptions,
): Promise<{ ok: boolean; version?: string; message?: string }> {
  try {
    const client = createOpenCodeHttpClient(options);
    const h = await client.health();
    return { ok: h.healthy === true, version: h.version };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
