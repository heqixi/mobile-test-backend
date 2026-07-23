/**
 * @module @mtp/domain-goal-space/errors
 */

import type { GoalSpaceErrorCode } from '@mtp/shared-kernel';

export class GoalSpaceDomainError extends Error {
  readonly code: GoalSpaceErrorCode;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    code: GoalSpaceErrorCode,
    message: string,
    options?: { retryable?: boolean; details?: Record<string, unknown> },
  ) {
    super(message);
    this.name = 'GoalSpaceDomainError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
  }
}
