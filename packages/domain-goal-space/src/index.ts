/**
 * @mtp/domain-goal-space
 *
 * 目标状态空间域：交互式关键帧采样与多通道检索的模型、端口、HTTP 协议形状。
 *
 * 关注点分离：
 * - 本包不依赖具体存储（SQLite / 文件 / 外部引擎）或具体视觉算法（pHash / CLIP）。
 * - 通道端口可替换；门面 GoalSpaceRetrievePort 对 compile/agent 稳定。
 *
 * 方案：docs/goal-space-interactive-sampling.md
 */

export * from './models/ids.js';
export * from './models/media-ref.js';
export * from './models/image-input.js';
export * from './models/widget.js';
export * from './models/keyframe-note.js';
export * from './models/keyframe.js';
export * from './models/transition.js';
export * from './models/goal-space.js';
export * from './models/capture-session.js';
export * from './models/ranking.js';
export * from './models/text-search.js';
export * from './models/visual-match.js';
export * from './models/neighborhood.js';
export * from './models/retrieve-strategy.js';
export * from './models/context-pack.js';
export * from './models/retrieve.js';
export * from './models/submit.js';
export * from './models/index-rebuild.js';
export * from './models/guided-act.js';
export * from './models/keyframe-label.js';
export * from './models/screen-identity.js';
export * from './logic/decide-graph-growth.js';
export * from './logic/apply-screen-identity.js';
export * from './ports/capture-session-port.js';
export * from './ports/goal-space-submit-port.js';
export * from './ports/goal-space-store-port.js';
export * from './ports/goal-space-index-port.js';
export * from './ports/text-search-port.js';
export * from './ports/visual-match-port.js';
export * from './ports/graph-neighborhood-port.js';
export * from './ports/goal-space-retrieve-port.js';
export * from './ports/screenshot-capture-port.js';
export * from './ports/guided-capture-port.js';
export * from './ports/keyframe-label-port.js';
export * from './ports/screen-identity-port.js';
export * from './protocol/goal-space-http.js';
export * from './adapters/goal-space-http-client.js';
export * from './errors.js';
