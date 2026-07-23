/**
 * @module @mtp/domain-goal-space/ports/screen-identity-port
 */

import type {
  ScreenIdentityJudgeInput,
  ScreenIdentityJudgeResult,
} from '../models/screen-identity.js';

export interface ScreenIdentityPort {
  judge(input: ScreenIdentityJudgeInput): Promise<ScreenIdentityJudgeResult>;
}
