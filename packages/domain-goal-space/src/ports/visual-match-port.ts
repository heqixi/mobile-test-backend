/**
 * @module @mtp/domain-goal-space/ports/visual-match-port
 *
 * 视觉定屏通道。实现可替换（感知哈希、图嵌入等），域接口不变。
 */

import type {
  VisualMatchQuery,
  VisualMatchResult,
} from '../models/visual-match.js';

export interface VisualMatchPort {
  match(query: VisualMatchQuery): Promise<VisualMatchResult>;
}
