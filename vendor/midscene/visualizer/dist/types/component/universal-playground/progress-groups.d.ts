import type { InfoListItem } from '../../types';
/**
 * Returns the final progress item from each contiguous execution group.
 * Non-progress conversation items (such as a result or the next prompt)
 * terminate the current group.
 */
export declare function getLastProgressItemIdsByGroup(items: InfoListItem[]): Set<string>;
