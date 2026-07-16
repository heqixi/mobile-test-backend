/**
 * @module @mtp/domain-agent/adapters/executor-http
 *
 * Executor HTTP 客户端（默认 :4098）。
 * Agent Loop 用：截图 + Midscene freeform（act_nl）。
 */

export interface ExecutorHttpOptions {
  /** 例：http://127.0.0.1:4098 */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface ExecutorScreenshot {
  ok: boolean;
  /** data:image/png;base64,... */
  dataUrl?: string;
  base64?: string;
  mime?: string;
  error?: string;
}

export interface ExecutorFreeformResult {
  ok: boolean;
  prompt: string;
  durationMs?: number;
  result?: unknown;
  error?: string;
}

export class ExecutorHttpError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string, path: string) {
    super(`Executor ${status} ${path}: ${body}`);
    this.name = 'ExecutorHttpError';
    this.status = status;
    this.body = body;
  }
}

export class ExecutorHttpClient {
  readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ExecutorHttpOptions = {}) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.EXECUTOR_URL ??
      'http://127.0.0.1:4098'
    ).replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new ExecutorHttpError(res.status, text, path);
    }
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  async captureScreenshot(): Promise<ExecutorScreenshot> {
    try {
      const shot = await this.request<{
        ok?: boolean;
        base64?: string;
        dataUrl?: string;
        format?: string;
        error?: string;
      }>('GET', '/preview/screenshot');
      const mime =
        shot.format === 'jpeg' || shot.format === 'jpg'
          ? 'image/jpeg'
          : 'image/png';
      const dataUrl =
        shot.dataUrl ??
        (shot.base64 ? `data:${mime};base64,${shot.base64}` : undefined);
      return {
        ok: Boolean(dataUrl),
        dataUrl,
        base64: shot.base64,
        mime,
        error: shot.error,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * POST /aep/v0.2/sample — Midscene aiQuery UI 文本描述（同源模型）。
   */
  async sample(phase = 'on_demand'): Promise<{
    ok: boolean;
    screenTitle?: string;
    pageDescription?: string;
    keyElements?: string[];
    overlays?: string[];
    error?: string;
  }> {
    try {
      const snap = await this.request<{
        screenTitle?: string;
        pageDescription?: string;
        keyElements?: string[];
        overlays?: string[];
        error?: string;
      }>('POST', '/aep/v0.2/sample', { phase });
      return {
        ok: true,
        screenTitle: snap.screenTitle,
        pageDescription: snap.pageDescription,
        keyElements: snap.keyElements,
        overlays: snap.overlays,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * POST /freeform/execute — Midscene aiAct 自然语言直控。
   */
  async freeformExecute(
    prompt: string,
    timeoutMs?: number,
  ): Promise<ExecutorFreeformResult> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return { ok: false, prompt: '', error: 'prompt is required' };
    }
    try {
      const res = await this.request<{
        ok?: boolean;
        prompt?: string;
        durationMs?: number;
        result?: unknown;
        report?: { result?: unknown };
        error?: string;
      }>('POST', '/freeform/execute', {
        prompt: trimmed,
        timeoutMs,
      });
      return {
        ok: res.ok === true,
        prompt: trimmed,
        durationMs: res.durationMs,
        result: res.report?.result ?? res.result ?? null,
        error: res.error,
      };
    } catch (error) {
      return {
        ok: false,
        prompt: trimmed,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export function createExecutorHttpClient(
  options?: ExecutorHttpOptions,
): ExecutorHttpClient {
  return new ExecutorHttpClient(options);
}
