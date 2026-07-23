/**
 * @module @mtp/domain-goal-space/ports/keyframe-label-port
 */

import type {
  KeyframeLabelInput,
  KeyframeLabelResult,
} from '../models/keyframe-label.js';

export interface KeyframeLabelPort {
  label(input: KeyframeLabelInput): Promise<KeyframeLabelResult>;
}
