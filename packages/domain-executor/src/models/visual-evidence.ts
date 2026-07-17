/**
 * @module @mtp/domain-executor/models/visual-evidence
 *
 * Locate / Annotate 契约（Executor 无业务语义）。
 */

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LocateRequest {
  phrase: string;
  deepLocate?: boolean;
  /** 可选：已有截图 base64（无 data URL 前缀）；缺省现场截图 */
  screenshotBase64?: string;
}

export interface LocateHit {
  phrase: string;
  ok: boolean;
  rect?: PixelRect;
  center?: [number, number];
  dpr?: number;
  /** 与截图像素对齐后的权威框 */
  rectPx?: PixelRect;
  quality?: 'bbox' | 'point_fallback';
  deepLocate?: boolean;
  durationMs?: number;
  error?: string;
}

export interface AnnotateRegion {
  rectPx: PixelRect;
  label: string;
  color?: string;
}

export interface AnnotateRequest {
  /** 缺省现场截图 */
  screenshotBase64?: string;
  regions: AnnotateRegion[];
  style?: {
    strokeWidth?: number;
    fontSize?: number;
  };
}

export interface AnnotateResult {
  ok: boolean;
  annotatedBase64?: string;
  width?: number;
  height?: number;
  mime?: 'image/png';
  error?: string;
}
