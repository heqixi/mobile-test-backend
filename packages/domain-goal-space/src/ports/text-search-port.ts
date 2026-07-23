/**
 * @module @mtp/domain-goal-space/ports/text-search-port
 *
 * 文本检索通道。实现可替换（FTS5、内存、外部引擎），域接口不变。
 */

import type {
  TextSearchQuery,
  TextSearchResult,
} from '../models/text-search.js';

export interface TextSearchPort {
  search(query: TextSearchQuery): Promise<TextSearchResult>;
}
