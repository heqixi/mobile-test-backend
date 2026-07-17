# Visual Evidence 技术方案

> 状态：**MVP 已落地（P1–P4）** — 见文末「实现状态」  
> 范围：`mobile-test-backend` + `mobile-test-frontend`  
> 路线：Midscene `aiLocate` + 自写绘制层 + Expectation 锚定（人工核验 → Golden → Replay）  
> 相关架构：`vitest-all-platforms-demo/docs/architecture-domain-design.md`

---

## 目录

1. [背景与问题](#1-背景与问题)
2. [目标与非目标](#2-目标与非目标)
3. [设计原则（领域边界）](#3-设计原则领域边界)
4. [能力调研结论](#4-能力调研结论)
5. [总体架构](#5-总体架构)
6. [核心数据模型](#6-核心数据模型)
7. [Executor：定位与标注](#7-executor定位与标注)
8. [Agent：EvidenceCompiler](#8-agentevidencecompiler)
9. [Expectation 锚定与人工核验](#9-expectation-锚定与人工核验)
10. [Replay：下次 Act / Judge 如何使用](#10-replay下次-act--judge-如何使用)
11. [Frontend 展示与交互](#11-frontend-展示与交互)
12. [落盘与 API](#12-落盘与-api)
13. [配置项](#13-配置项)
14. [风险与对策](#14-风险与对策)
15. [分阶段落地与验收](#15-分阶段落地与验收)
16. [结论](#16-结论)

---

## 1. 背景与问题

### 1.1 现状

当前 Instruction Loop 中：

```
act  → Midscene aiAct（内部有 Locate，坐标不回传）
judge → OpenCode VLM + 截图 → { satisfied, reason, evidence: string }
```

- `evidence` **仅为文字**，无法指出「底部输入框」在截图中的位置。
- Executor 已具备 Midscene `AndroidAgent`、截图、`freeform`/`sample`/`abort`，但 **未暴露 `aiLocate`**，也 **无红框绘制 API**。
- 前端 `annotate` 仍为 stub，无法做人工标注落盘。

### 1.2 典型诉求

对 expectation / precondition 例如：

> WPS 首页已打开，底部输入框可见且右侧有【拍照】按钮

需要：

1. 用自然语言定位「底部输入框」「拍照按钮」；
2. 在截图上用 **红色框** 标出；
3. 当 Instruction **`satisfied=true`** 时，把该 VisualEvidence **绑定到 expectation**，供人工核验；
4. 核验通过后作为 **Golden**，下次测试用于 **act 规划** 与 **judge 参考**（Replay）。

---

## 2. 目标与非目标

### 2.1 目标

| # | 目标 |
|---|------|
| G1 | 自然语言 → Midscene `aiLocate` → 像素坐标 |
| G2 | 自写绘制层在截图上画红框，产出标注图 |
| G3 | Judge 后（或终态）产出 Runtime VisualEvidence，经 SSE / Result 展示 |
| G4 | `satisfied` 时绑定到 Instruction.expectation（附件，不改写 expectation 文案） |
| G5 | 人工核验：通过 → Golden；驳回 / 重采 |
| G6 | 下次运行注入 Golden，辅助 act / judge；可选旁路 locate 对齐 |

### 2.2 非目标

- 不让 Judge LLM「猜 bbox」作为权威坐标；
- 不依赖 Midscene HTML Report 作为 Console 主证据流；
- 不引入 Grounding DINO 等外部检测栈（可作为远期备选）；
- **不改变**「`satisfied` 权威来自 LLM Judge」的架构铁律（MVP 不做 Hard IoU fail）。

---

## 3. 设计原则（领域边界）

对齐现有分层（Agent / Executor / Case / Frontend）：

| 域 | 可以做 | 不可以做 |
|----|--------|----------|
| **Executor** | 截图、`aiLocate`、画框、存图 | 理解 expectation / 判定是否通过 |
| **Agent** | 编排 EvidenceCompiler；把 Golden **当 Prompt 素材**嵌入 | 用坐标本地改写 `satisfied`；按 caseId 做业务分支 |
| **Case / Library** | 持久化 binding、artifacts、approve/reject | 自己调 Midscene |
| **Frontend** | 展示标注图、人工核验、syncCompiled | 自己算坐标 |

一句话：

> **坐标与画框是 Executor 能力；何时举证与注入 Prompt 是 Agent 编排；是否通过仍是 Judge LLM；Golden 落盘与人审是 Case + Frontend。**

---

## 4. 能力调研结论

### 4.1 Midscene 是否返回坐标？

**是。** 官方 API：

```ts
agent.aiLocate(phrase, { deepLocate?: boolean })
→ { rect: { left, top, width, height }, center: [x, y], dpr }
```

注意：

- 部分模型仅 **点定位**，`rect` 可能退化为以 center 为中心的小框（如 8×8）；展示需 `point_fallback`；
- `aiAct` / `aiTap` 内部 Locate 写入 dump/report，**默认不回传**给 Agent Loop；
- `aiQuery` 默认不保证 bbox。

### 4.2 是否有「NL 自动红框」开箱工具？

| 能力 | NL | 自动红框 | 与本栈 |
|------|----|----------|--------|
| Midscene `aiLocate` | ✅ | 需自写绘制 | **主路线** |
| Midscene Report 高亮 | 仅已执行步骤 | ✅ 内置 | 调试用，非主证据 |
| OpenCode Judge | 文本 | ❌ | 当前 judge |
| 自写 sharp/canvas | — | ✅ | Executor annotate |

**结论**：最契合路线 = **`aiLocate` + Executor 自写绘制层**。

---

## 5. 总体架构

```
┌──────────────── Frontend (Console) ─────────────────┐
│  · Runtime / Candidate / Golden 标注图展示            │
│  · 人工核验：通过 / 驳回 / 重采                        │
│  · syncCompiled 写回用例库                            │
└──────────────────────▲──────────────────────────────┘
                       │ SSE / InstructionResult / Bundle
┌──────────────── Agent (:4100) ──────────────────────┐
│  act → dispatch → judge                             │
│         │                                           │
│         ▼                                           │
│  EvidenceCompiler                                   │
│  · 抽取 locate phrases                              │
│  · 调 Executor locate / annotate                    │
│  · Runtime VE → SSE                                 │
│  · satisfied → 通知绑定 Candidate（或由前端合并）      │
│  · 下次：注入 Golden 到 act/judge Prompt              │
└──────────────────────▲──────────────────────────────┘
                       │ HTTP
┌──────────────── Executor (:4098) ───────────────────┐
│  Midscene AndroidAgent                              │
│  · locate  → aiLocate                               │
│  · annotate → 截图 + 红框绘制 → PNG                   │
└─────────────────────────────────────────────────────┘
                       │
┌──────────────── Case / Library (:4102 / :4103) ─────┐
│  CompiledBundle.instructions[].metadata             │
│    .expectationEvidence                             │
│  artifacts: evidence/{id}/original|annotated.png    │
└─────────────────────────────────────────────────────┘
```

### 5.1 端到端时序（含锚定）

```
首次跑通:
  judge satisfied
    → EvidenceCompiler → Runtime VE
    → Candidate 写入 Instruction.metadata（pending）
    → 人工「通过」→ Golden + syncCompiled

下次 Replay:
  load Instruction（含 golden）
    → Prompt 注入 golden phrases（+ 可选参考图）
    → act / judge 参考
    → （可选）本轮 locate vs golden IoU 旁路报告
```

---

## 6. 核心数据模型

### 6.1 LocateHit（Executor）

```ts
interface LocateHit {
  phrase: string;
  ok: boolean;
  rect?: { left: number; top: number; width: number; height: number };
  center?: [number, number];
  dpr?: number;
  /** 与截图像素对齐后的权威框 */
  rectPx?: { left: number; top: number; width: number; height: number };
  quality?: 'bbox' | 'point_fallback';
  deepLocate?: boolean;
  durationMs?: number;
  error?: string;
}
```

**坐标系约定**：权威空间 = Executor `/preview/screenshot` 同源像素；Frontend / 画框只认 `rectPx`。

### 6.2 VisualEvidence（运行时）

```ts
interface VisualEvidenceRegion {
  id: string;
  phrase: string;
  label: string;
  role?: 'precondition' | 'expectation' | 'hint' | 'custom';
  color?: string; // 默认红
  locate: LocateHit;
}

interface VisualEvidence {
  evidenceId: string;
  episodeId: string;
  instructionId: string;
  phase: 'judge' | 'act' | 'on_demand';
  capturedAt: string;
  screenshot: { mime: 'image/png'; dataUrl?: string; url?: string; width: number; height: number };
  annotated: { dataUrl?: string; url?: string; width: number; height: number };
  regions: VisualEvidenceRegion[];
  textEvidence?: string;
  judgeSatisfied?: boolean;
}
```

### 6.3 Expectation 绑定（落盘）

**不把 PNG 塞进 expectation 字符串。** expectation 保持自然语言；证据为附件：

```ts
/** Instruction.metadata.expectationEvidence */
interface ExpectationEvidenceBinding {
  /** 绑定时 expectation 原文快照 */
  expectationSnapshot: string;
  /** 人工通过后的黄金证据 */
  golden?: StoredVisualEvidence;
  /** 最近一次 satisfied 候选（待审） */
  candidate?: StoredVisualEvidence;
  history?: StoredVisualEvidence[];
}

interface StoredVisualEvidence {
  evidenceId: string;
  createdAt: string;
  source: {
    episodeId: string;
    caseId?: string;
    instructionId: string;
    round?: number;
  };
  review: {
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: string;
    reviewer?: string;
    note?: string;
  };
  assets: {
    screenshotUrl: string;
    annotatedUrl: string;
    width: number;
    height: number;
  };
  regions: Array<{
    id: string;
    label: string;
    phrase: string;
    role: 'expectation' | 'precondition' | 'hint';
    rectPx: { left: number; top: number; width: number; height: number };
    center?: [number, number];
    locateOk: boolean;
  }>;
  textEvidence?: string;
  judgeReason?: string;
}
```

### 6.4 概念分层

| 名称 | 生命周期 | 用途 |
|------|----------|------|
| Runtime VE | 单次 Episode | 本轮举证、SSE |
| Candidate VE | `review=pending` | 等人审 |
| Golden VE | `review=approved` | Replay / Prompt 参考 |

若用户事后修改 expectation 文案，应提示「锚点可能失效」，可清除或重采。

---

## 7. Executor：定位与标注

### 7.1 端口扩展

```ts
locate(request: {
  phrase: string;
  deepLocate?: boolean;
  screenshotBase64?: string;
}): Promise<LocateHit>;

annotate(request: {
  screenshotBase64?: string;
  regions: Array<{
    rectPx: { left: number; top: number; width: number; height: number };
    label: string;
    color?: string;
  }>;
  style?: { strokeWidth?: number; fontSize?: number };
}): Promise<{
  ok: boolean;
  annotatedBase64: string;
  width: number;
  height: number;
  error?: string;
}>;
```

**Must not**：接口不接收 `expectation` / `satisfied`。

### 7.2 Midscene 接线

- `MidsceneAgentLike` 增加 `aiLocate`；
- 实现调用 `AndroidAgent.aiLocate`；
- 建议默认 `deepLocate: true`（底部小控件、易遮挡场景）；
- 与 `aiAct` 共享 abort：`AbortSignal` / `/aep/v0.2/abort`。

### 7.3 绘制层规范

- 服务端：`sharp` 或 `@napi-rs/canvas`（MVP 推荐服务端出固化 PNG）；
- 红框描边；label 在框上方或左上；
- rect clamp 到图像边界；
- 过小框 → `point_fallback`（center 十字 + 虚线框）；
- 可选前端 SVG overlay 做交互放大，落盘仍以服务端 PNG 为准。

### 7.4 HTTP

| Method | Path | 说明 |
|--------|------|------|
| POST | `/aep/v0.2/locate` | 原子定位 |
| POST | `/aep/v0.2/annotate` | 原子画框 |

亦可挂 `invokeTool`：`locate_nl` / `annotate_rects`（与 `act_nl` 风格一致）。

---

## 8. Agent：EvidenceCompiler

### 8.1 触发策略

| 策略 | 何时 | 建议 |
|------|------|------|
| always | 每次 judge 后 | 调试 |
| **final** | Episode 终态 | **默认** |
| failed | 仅失败 | 归因 |
| off | 关闭 | — |

`satisfied=true` 且存在有效 region 时，额外进入 **Candidate 绑定** 流程。

### 8.2 Phrase 抽取

输入：`preconditions` / `expectation` / `hints`

1. **规则（MVP）**：hints 逐行；expectation/preconditions 按「可见 / 【按钮】/ 底部…输入框」等切分；去重，上限 N（默认 3）；
2. **可选 LLM 抽取**：只输出 `{ phrase, label, role }`，**禁止输出 bbox**；
3. 「关闭 popup」类 hint → 不当红框目标，或单独可选 region。

### 8.3 流水线

```
1. 复用 judge 截图缓存（强烈推荐，避免帧差）
2. locate(phrase)×N（deepLocate）
3. annotate(regions)
4. 组装 VisualEvidence → SSE turn.visual_evidence
5. 若 satisfied 且 locate 有效 → Candidate 绑定信号
```

### 8.4 与 satisfied 的关系

| 模式 | 行为 | 建议 |
|------|------|------|
| **Observe-only** | locate 失败只记 VE，不改 satisfied | **MVP** |
| Soft gate | reason 追加警告 | 二期 |
| Hard gate | 强制 unsatisfied | 实验开关，默认关 |

---

## 9. Expectation 锚定与人工核验

### 9.1 产品语义

核验通过后表达为：

> **该 expectation 已锚定一组可视化验收标准**（目标短语 + 参考标注图）

而不是改写 expectation 字符串。

### 9.2 核验操作

| 操作 | 结果 |
|------|------|
| 通过 | candidate → golden；旧 golden → history；syncCompiled |
| 驳回 | candidate.rejected；不替换 golden |
| 重采 | 再跑 locate+annotate，替换 candidate，仍 pending |

**默认下次运行只注入 `approved` 的 golden。**

### 9.3 UI 示意

```
expectation
  弹出拍照选择界面…
  ┌─ 期望视觉锚点（已核验 / 待核验）──────────┐
  │ [annotated.png]                          │
  │ · 底部输入框  · 拍照按钮                   │
  │ [通过核验] [驳回] [重采]                   │
  └──────────────────────────────────────────┘
```

---

## 10. Replay：下次 Act / Judge 如何使用

### 10.1 Prompt 注入（默认省 token）

文本化 Golden：

```
## Golden evidence (human-approved) for this expectation
expectation: …
Reference UI targets from a previously satisfied run:
- [底部输入框] phrase="…"
- [拍照按钮] phrase="…"
Prefer these phrases when acting; when judging, verify the same targets remain visible.
Do NOT treat old pixel boxes as absolute if layout shifted.
```

增强：首轮附带一张 golden annotated 图（多模态 file part）。

### 10.2 分相位

| 相位 | 用法 |
|------|------|
| act | 优先用 golden `regions[].phrase` 写 command；清障后再点参考目标 |
| judge | 成功标准仍是 expectation 原文；golden 提供「应看到什么」 |

### 10.3 坐标对齐（可选二期）

| 模式 | 行为 |
|------|------|
| Reference-only | 只影响 Prompt | **默认** |
| Align-check | 本轮 locate vs golden IoU → 旁路报告 | 推荐二期 |
| Hard match | IoU 低强制 fail | 不推荐 |

Agent 内核 **允许** 读取 `metadata.expectationEvidence.golden` **嵌入 Prompt**；  
**禁止** `if (!iouOk) satisfied = false` 写死在 Loop 状态机（除非显式实验开关）。

---

## 11. Frontend 展示与交互

1. SSE `turn.visual_evidence`：聊天流展示标注缩略图 + regions；
2. Instruction 卡片：candidate 核验条 / golden 锚点图；
3. `runLibraryInstruction` / 整案运行：原样提交带 `metadata` 的 Instruction；
4. 可选设备面板调试：NL → `/locate` + `/annotate` 预览（不经 Loop）。

---

## 12. 落盘与 API

### 12.1 存储布局（建议）

```
library/cases/{caseId}/
  compiled.json          # instructions[].metadata.expectationEvidence
  evidence/{evidenceId}/
    original.png
    annotated.png
    regions.json         # 可选
```

与现有 `getCompiled` / `syncCompiled` 对齐；长期避免只在 JSON 里塞超大 base64。

### 12.2 API 草案

**Executor**

- `POST /aep/v0.2/locate`
- `POST /aep/v0.2/annotate`

**Library / Case（或 MVP 由前端 syncCompiled 代替）**

- `POST .../instructions/:id/evidence` `{ as: "candidate", ... }`
- `POST .../evidence/:id/review` `{ status, note? }`
- `GET  .../evidence/:id/annotated.png`

**Agent SSE / Result**

- `turn.visual_evidence`
- `InstructionResult.visualEvidence?`
- JudgeTurn 可选挂 `visualEvidenceId`

---

## 13. 配置项

| 变量 | 默认 | 含义 |
|------|------|------|
| `AGENT_VISUAL_EVIDENCE` | `final` | `off` / `final` / `failed` / `always` |
| `AGENT_VISUAL_EVIDENCE_MAX_TARGETS` | `3` | 最多红框数 |
| `AGENT_VISUAL_EVIDENCE_DEEP_LOCATE` | `1` | 是否 deepLocate |
| `AGENT_VISUAL_EVIDENCE_PROMPT` | `1` | 是否注入 golden 到 Prompt |
| `AGENT_VISUAL_EVIDENCE_ATTACH_IMAGE` | `0` | 是否附带 golden 标注图 |
| `EXECUTOR_ANNOTATE_STROKE` | `3` | 红框线宽 |

---

## 14. 风险与对策

| 风险 | 对策 |
|------|------|
| rect 点定位退化 | `point_fallback`；deepLocate；展示注明 quality |
| popup 遮挡点错 | phrase 尊重清障 hints；先 locate 关闭按钮（可选） |
| 截图与 locate 不同帧 | 复用 judge 截图缓存 |
| 时延 / 费用 | 默认仅终态；上限 N；同 phrase 缓存 |
| 坐标空间混乱 | 统一截图像素；Executor 内完成 dpr 换算 |
| 与 aiAct 并发 | Midscene 串行队列；Stop 统一 abort |
| expectation 文案变更 | snapshot 比对；UI 提示失效 |

---

## 15. 分阶段落地与验收

### 15.1 阶段

| 阶段 | 内容 |
|------|------|
| **P0** | 脚本验证 `aiLocate` + 本地画框 |
| **P1** | Executor `locate` / `annotate` API |
| **P2** | Agent EvidenceCompiler + SSE；Observe-only |
| **P3** | satisfied → Candidate；核验 UI；golden + syncCompiled |
| **P4** | Prompt 注入 golden 文本；回归验证 |
| **P5** | 附图注入、IoU 旁路、文案变更失效策略 |

### 15.2 验收标准

1. NL「底部输入框」可 locate 并出红框标注 PNG；  
2. 终态 judge 后 SSE 可收到 `turn.visual_evidence`；  
3. `satisfied` 后出现 pending candidate，人审通过后 golden 随 bundle 持久化；  
4. 再次运行同一 Instruction，`turn.user` 中可见 Golden 目标短语；  
5. Stop 后不再发起新的 locate（或被 abort）；  
6. MVP 下 `satisfied` 仅由本轮 Judge JSON 决定，不因 locate 失败 / IoU 单独改写；  
7. Executor locate/annotate **不**接收 expectation 业务字段。

---

## 16. 结论

| 问题 | 答案 |
|------|------|
| 坐标从哪来？ | Midscene **`aiLocate(NL)`**，Executor 暴露并统一到截图像素 |
| 红框谁画？ | **Executor 自写 annotate**，不依赖 Midscene Report |
| 谁编排？ | Agent **EvidenceCompiler** |
| 谁判定通过？ | **Judge LLM**；图片证据是旁路举证 |
| 如何绑定 expectation？ | `metadata.expectationEvidence`（candidate → 人审 → golden） |
| 下次怎么用？ | Golden 注入 act/judge Prompt（+ 可选参考图 / IoU 旁路） |

该方案与现有「Agent 不懂业务 / Executor 无状态手脚 / Case 管账本与编译物」一致，可按 P0→P5 增量交付，同时满足 **可视化举证、人工核验、Replay 参考** 三类诉求。

---

## 附录 A：与现有代码锚点

| 模块 | 路径 |
|------|------|
| Agent Loop | `packages/domain-agent/src/service/agent-loop.ts` |
| Phase Prompt | `packages/domain-agent/src/service/system-prompt.ts` |
| Phase LLM / 截图 | `packages/domain-agent/src/service/phase-llm.ts` |
| Instruction 模型 | `packages/domain-agent/src/models/instruction.ts` |
| Executor 端口 | `packages/domain-executor/src/ports/executor-port.ts` |
| Midscene 实现 | `packages/domain-executor/src/service/midscene-executor.ts` |
| 用例编译落盘 | Case `syncCompiled` / Library `saveCompiled` |
| 前端 Instruction 编辑保存 | `useOrchestrator.saveLibraryCompiled` |

## 附录 B：术语表

| 术语 | 含义 |
|------|------|
| Runtime VE | 本轮 Episode 生成的可视化证据 |
| Candidate | 待人工核验的绑定证据 |
| Golden | 人工通过、可 Replay 的期望锚点 |
| EvidenceCompiler | Agent 侧短语抽取 + locate + annotate 编排器 |
| rectPx | 截图像素坐标系下的包围盒 |

## 附录 C：实现状态（2026-07-16）

已落地：

| 阶段 | 内容 | 状态 |
|------|------|------|
| P1 | `POST /aep/v0.2/locate`、`/annotate`；sharp 画框；`locate_nl` / `annotate_rects` 工具 | ✅ |
| P2 | `EvidenceCompiler`；终态/always 触发；SSE `turn.visual_evidence`；`InstructionResult.visualEvidence` | ✅ |
| P3 | satisfied → candidate 写入 Instruction.metadata；前端核验 UI；通过→golden +「保存」syncCompiled | ✅ |
| P4 | Golden 文本注入 act/judge Prompt（`AGENT_VISUAL_EVIDENCE_PROMPT`） | ✅ |

待增强（P5）：

- evidence 图落盘 URL（避免 JSON 内大 base64）
- 首轮附带 golden 标注图多模态
- locate vs golden IoU 旁路
- expectation 文案变更使 golden 失效的严格策略

环境变量见 `.env.example`：`AGENT_VISUAL_EVIDENCE*`。
