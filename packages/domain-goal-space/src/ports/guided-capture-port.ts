/**
 * @module @mtp/domain-goal-space/ports/guided-capture-port
 */

import type {
  GuidedActInput,
  GuidedActResult,
} from '../models/guided-act.js';

export interface GuidedCapturePort {
  reconcileAfterAct(input: GuidedActInput): Promise<GuidedActResult>;
}
