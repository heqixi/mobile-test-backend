# @mtp/domain-goal-space

目标状态空间（Goal Space）域：交互式关键帧采样与**实现无关**的检索通道模型/端口。

方案全文：[`../../docs/goal-space-interactive-sampling.md`](../../docs/goal-space-interactive-sampling.md)

## 边界

| 层 | 职责 |
|----|------|
| **本包** | 实体、值对象、通道端口、Retrieve 门面、HTTP 协议形状 |
| **业务 / App（域外）** | 落盘、文本索引引擎、视觉匹配算法、HTTP 服务 |
| **domain-case / domain-agent** | 只调用 `GoalSpaceRetrievePort` → `ContextPack` |

**禁止**在本包出现：SQLite / FTS5 / pHash / CLIP / Midscene / OpenCode 客户端等实现依赖。  
**本包无 IO 实现。**

## 端口分层

```
ScreenshotCapturePort          取当前帧（可选）
        │
        ▼
VisualMatchPort ──┐
TextSearchPort ───┼──► GoalSpaceRetrievePort ──► ContextPack
GraphNeighborhoodPort ─┘         ▲
GoalSpaceStorePort ──────────────┘（渲染节点详情）

CaptureSessionPort → GoalSpaceSubmitPort → GoalSpaceIndexPort
GoalSpaceStorePort（读已发布版本）
```

| 端口 | 职责 | 可替换实现示例（域外） |
|------|------|------------------------|
| `CaptureSessionPort` | 采样草稿 | 内存 / 文件草稿 |
| `GoalSpaceSubmitPort` | 发布不可变版本 | 写 `graph.json` + md + png |
| `GoalSpaceIndexPort` | 重建派生索引 | FTS 表、指纹表、向量表… |
| `GoalSpaceStorePort` | 读空间/图/Pack 清单 | 文件系统 |
| `TextSearchPort` | 意图 → 排序节点/边 | FTS5、内存词法、Meilisearch… |
| `VisualMatchPort` | 截图 → 定屏/候选 | pHash、CLIP、… |
| `GraphNeighborhoodPort` | ±hop 邻域 | 内存邻接表 |
| `GoalSpaceRetrievePort` | 级联/纯文本/晚融合门面 | 编排上述端口 |
| `ScreenshotCapturePort` | 设备截图 | executor / adb |

## 检索策略（领域枚举）

`RetrieveStrategy`：`cascade` | `text_only` | `late_fusion`（见方案 §7.2.5）。  
调用方可传 `strategy: 'auto'`；实际策略写入 `ContextPack.diagnostics`。
