/**
 * @module @mtp/domain-goal-space/models/widget
 *
 * 控件别名：供 compile / act 用词对齐。
 */

export interface WidgetAlias {
  /** 稳定别名，如「底部输入框」「+号」 */
  name: string;
  /** 自然语言说明 */
  description?: string;
  /** 可选：归一化框 [x,y,w,h] 相对截图 0–1 */
  bboxNorm?: [number, number, number, number];
  tags?: string[];
}
