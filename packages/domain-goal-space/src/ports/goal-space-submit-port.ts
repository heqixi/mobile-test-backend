/**
 * @module @mtp/domain-goal-space/ports/goal-space-submit-port
 *
 * 草稿校验并发布为不可变 GoalSpaceVersion。
 */

import type {
  SubmitCaptureSessionInput,
  SubmitCaptureSessionResult,
} from '../models/submit.js';

export interface GoalSpaceSubmitPort {
  submit(input: SubmitCaptureSessionInput): Promise<SubmitCaptureSessionResult>;
}
