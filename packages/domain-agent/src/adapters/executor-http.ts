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
    options?: {
      acceptStatuses?: number[];
      timeoutMs?: number;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    const timeoutMs = options?.timeoutMs;
    const ctrl =
      timeoutMs != null && timeoutMs > 0 ? new AbortController() : null;
    const timer =
      ctrl && timeoutMs != null
        ? setTimeout(() => ctrl.abort(), timeoutMs)
        : null;
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options?.signal ?? ctrl?.signal,
      });
      const text = await res.text();
      const accepted = options?.acceptStatuses ?? [];
      if (!res.ok && !accepted.includes(res.status)) {
        throw new ExecutorHttpError(res.status, text, path);
      }
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (error) {
      if (
        ctrl?.signal.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw new ExecutorHttpError(
          408,
          `timeout after ${timeoutMs}ms`,
          path,
        );
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
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
        base64:
          shot.base64 ??
          (dataUrl?.includes('base64,')
            ? dataUrl.split('base64,')[1]
            : undefined),
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
    opts?: { maxActions?: number },
  ): Promise<ExecutorFreeformResult> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return { ok: false, prompt: '', error: 'prompt is required' };
    }
    const effectiveTimeout =
      typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
        ? Math.floor(timeoutMs)
        : 45_000;
    try {
      const res = await this.request<{
        ok?: boolean;
        prompt?: string;
        durationMs?: number;
        result?: unknown;
        report?: { result?: unknown };
        error?: string;
      }>(
        'POST',
        '/freeform/execute',
        {
          prompt: trimmed,
          timeoutMs: effectiveTimeout,
          ...(opts?.maxActions !== undefined
            ? { maxActions: opts.maxActions }
            : {}),
        },
        // HTTP 层略宽于 Midscene abort，避免竞态先断连接
        { timeoutMs: effectiveTimeout + 2_000 },
      );
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

  /**
   * 预置下一次 aiAct（含 Playground /execute）的 maxActions。
   * `null` = 本次不限制（覆盖 executor 默认）。
   */
  async armNextAiActMaxActions(
    maxActions: number | null,
  ): Promise<{ ok: boolean }> {
    try {
      return await this.request<{ ok: boolean }>(
        'POST',
        '/aep/v0.2/arm-ai-act',
        { maxActions },
      );
    } catch {
      return { ok: false };
    }
  }

  /** POST /aep/v0.2/abort — 中止当前 Midscene aiAct */
  async abort(reason?: string): Promise<{ aborted: boolean }> {
    try {
      return await this.request<{ aborted: boolean }>(
        'POST',
        '/aep/v0.2/abort',
        reason ? { reason } : {},
      );
    } catch {
      return { aborted: false };
    }
  }

  /** POST /aep/v0.2/locate */
  async locate(input: {
    phrase: string;
    deepLocate?: boolean;
    screenshotBase64?: string;
    /** 默认 20s；Visual Evidence 应设更短以免拖死 Episode */
    timeoutMs?: number;
  }): Promise<{
    phrase: string;
    ok: boolean;
    rectPx?: { left: number; top: number; width: number; height: number };
    center?: [number, number];
    dpr?: number;
    quality?: 'bbox' | 'point_fallback';
    deepLocate?: boolean;
    durationMs?: number;
    error?: string;
  }> {
    const timeoutMs = input.timeoutMs ?? 20_000;
    try {
      return await this.request(
        'POST',
        '/aep/v0.2/locate',
        {
          phrase: input.phrase,
          deepLocate: input.deepLocate,
          screenshotBase64: input.screenshotBase64,
        },
        { acceptStatuses: [422], timeoutMs },
      );
    } catch (error) {
      return {
        phrase: input.phrase,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** POST /aep/v0.2/annotate */
  async annotate(input: {
    screenshotBase64?: string;
    regions: Array<{
      rectPx: { left: number; top: number; width: number; height: number };
      label: string;
      color?: string;
    }>;
    style?: { strokeWidth?: number; fontSize?: number };
  }): Promise<{
    ok: boolean;
    annotatedBase64?: string;
    width?: number;
    height?: number;
    mime?: string;
    error?: string;
  }> {
    return this.request('POST', '/aep/v0.2/annotate', input);
  }
}

export function createExecutorHttpClient(
  options?: ExecutorHttpOptions,
): ExecutorHttpClient {
  return new ExecutorHttpClient(options);
}
