/**
 * @module @mtp/domain-case/errors
 *
 * Case 域可抛出的领域错误（供 HTTP 门面映射状态码）。
 */

import type { CaseErrorCode } from '@mtp/shared-kernel';

export class CaseDomainError extends Error {
  readonly code: CaseErrorCode;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    code: CaseErrorCode,
    message: string,
    options?: { retryable?: boolean; details?: Record<string, unknown> },
  ) {
    super(message);
    this.name = 'CaseDomainError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
  }
}
