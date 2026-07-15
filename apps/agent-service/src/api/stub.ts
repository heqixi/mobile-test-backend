/**
 * @module @mtp/agent-service/api/stub
 *
 * 骨架阶段：所有 handler 抛出 NOT_IMPLEMENTED。
 * 实现阶段替换为真实端口调用。
 */

/**
 * 统一未实现错误。
 * HTTP 层可映射为 501 Not Implemented。
 */
export class NotImplementedError extends Error {
  readonly code = 'NOT_IMPLEMENTED' as const;

  constructor(endpoint: string) {
    super(`API not implemented: ${endpoint}`);
    this.name = 'NotImplementedError';
  }
}

/** 抛出未实现错误的便捷函数 */
export function notImplemented(endpoint: string): never {
  throw new NotImplementedError(endpoint);
}
