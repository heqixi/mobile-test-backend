/**
 * @module @mtp/domain-goal-space/models/media-ref
 *
 * 媒体引用：域模型只持路径/URI，不持有大图 blob。
 * 上传 API 可短暂携带 base64，由适配器落盘后回写 MediaRef。
 */

export type MediaKind = 'screenshot' | 'thumbnail' | 'other';

export interface MediaRef {
  /** 相对版本目录或可解析 URI */
  uri: string;
  kind: MediaKind;
  mimeType?: string;
  width?: number;
  height?: number;
  /** 内容指纹（可选，提交时由适配器填写） */
  contentSha256?: string;
}
