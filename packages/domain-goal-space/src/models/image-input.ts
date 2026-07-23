/**
 * @module @mtp/domain-goal-space/models/image-input
 *
 * 运行时截图输入：域模型不绑定编码算法或文件路径方案。
 */

export interface ImageInput {
  /** 原始图字节的 base64（可含 data URL 前缀，由适配器剥离） */
  base64: string;
  mimeType?: string;
}
