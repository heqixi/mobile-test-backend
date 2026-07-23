# 交互式目标初采样（Goal Space）方案

> 状态：P0 已实现（business/goal-space + HTTP :4104 + FE 采样面板 + case/agent 注入）  
> 相关包：`packages/domain-goal-space` · `business/goal-space`  
> 下游：`domain-case` / cowork 编译、`domain-agent` plan；上游：前端「目标采样」面板

---

## 1. 背景与目标

### 1.1 问题

用例编译（OpenCode → Instruction）与 Agent 执行（plan/act）缺少目标 App 的**共享语义地图**：控件别名、屏名、合法转移依赖模型臆测，易产生用词漂移与乱点。

### 1.2 目标

在编译 / 执行之前增加阶段 **「交互式目标初采样」**：

1. 人工驱动目标状态转换，在关键帧截图并标注（屏名、说明、转移方法等）。
2. 提交后落入 **OpenCode 友好** 的版本化资产（Markdown Pack + `graph.json` + 截图；P1 再加 SQLite 索引）。
3. 编译与执行时通过检索得到有上限的 **ContextPack**，作为参考与约束注入 LLM。

### 1.3 非目标（本阶段）

- 不自动每帧采样 / 不依赖光流全量轨迹。
- 不上 Microsoft GraphRAG / Neo4j 作为第一存储（见 §6）。
- 不替代 Midscene 像素级 locate；Goal Space 只提供语义约束。

---

## 2. 在现有链路中的位置

```
[人工采样] GoalSpace Capture
    → Submit → GoalSpaceVersion（不可变）
         ↓ Retrieve(ContextPack)
[CSV 切步] → [OpenCode compile] → [Agent Loop act]
                 ↑ Pack 注入          ↑ Pack 注入
```

| 阶段 | 职责方 | 输入 | 输出 |
|------|--------|------|------|
| A. 交互采样 | FE + CaptureSession | 真机画面 | 草稿 Keyframe / Transition |
| B. 提交入库 | GoalSpaceStore | 草稿 + 截图 | `spaceId@version` |
| C. 编译检索 | domain-case / cowork-csv | 本步意图 | ContextPack → `buildStepCompileInput` |
| D. 执行检索 | domain-agent | 意图 / 当前屏线索 | ContextPack → plan/act prompt |

---

## 3. 关注点分离

| 层 | 包 / 位置 | 职责 | 禁止 |
|----|-----------|------|------|
| **领域模型 + 端口** | `@mtp/domain-goal-space` | 实体、值对象、用例端口、HTTP 协议形状 | 读写磁盘、调 Midscene、调 OpenCode |
| **存储适配** | 未来 `business/goal-space` 或 `apps/goal-space-service` | Pack 落盘、SQLite 索引、截图文件 | 编译/控机业务规则 |
| **截图来源** | executor / FE（经端口注入） | 提供 PNG bytes | 理解 GoalSpace 语义 |
| **编译消费** | domain-case / cowork-csv | `Retrieve` → 拼进 `CompileCaseInput` | 直接读 graph 文件 |
| **执行消费** | domain-agent | `Retrieve` → system/plan | 直接读 graph 文件 |

防腐层：**任何后端只对外输出 `ContextPack`**；compile / agent **只吃 Pack**。

---

## 4. 领域模型

### 4.1 聚合与实体

```
GoalSpace (空间，如 cowork-android)
  └── GoalSpaceVersion (不可变版本) ── graph.json + nodes/*.md + keyframes/*.png
CaptureSession (可变草稿，提交前)
  └── DraftKeyframe / DraftTransition
ContextPack (检索只读视图，有硬上限)
```

### 4.2 核心概念

| 概念 | 说明 |
|------|------|
| **Keyframe** | 关键状态节点：屏名、截图引用、caption、widgets、tags |
| **Transition** | 有向边：from→to、动作文案、前置/效果、可选证据帧 |
| **WidgetAlias** | 控件别名（如「底部输入框」），供 compile/act 用词对齐 |
| **MediaRef** | 截图等媒体的稳定引用（相对 path / URI），域内不持有大图 blob（上传 API 可短暂传 bytes） |
| **GoalSpaceVersion** | 提交后不可变；用例/编译可绑定 `spaceId@version` |
| **CaptureSession** | 采样会话草稿；可多次改标注，提交时校验并 bump version |
| **ContextPack** | 给 OpenCode/Agent 的裁剪结果：文本 + 可选少量缩略图引用 |

### 4.3 标识

- `GoalSpaceId` / `GoalSpaceVersionId` / `KeyframeId` / `TransitionId` / `CaptureSessionId`：字符串品牌 ID（实现阶段可用 UUID）。
- 版本对外引用：`GoalSpaceRef = { spaceId, version }`（`version` 建议 semver 或单调整数字符串）。

---

## 5. 端口（用例接口）

| 端口 | 职责 |
|------|------|
| `CaptureSessionPort` | 开会话、标关键帧、记转移、改标注、列草稿、丢弃 |
| `GoalSpaceSubmitPort` | 草稿 → 校验 → 落不可变版本（写 Store） |
| `GoalSpaceStorePort` | 列空间、读版本图、读节点、导出 OpenCode Pack 路径/清单 |
| `GoalSpaceIndexPort` | 重建派生索引（**不规定**引擎） |
| `TextSearchPort` | 意图文本 → 排序节点/边（**不规定** FTS/其它） |
| `VisualMatchPort` | 截图 → 定屏/候选（**不规定** pHash/CLIP） |
| `GraphNeighborhoodPort` | ±hop 邻域 |
| `GoalSpaceRetrievePort` | 编排通道 + 策略（cascade / text_only / late_fusion）→ ContextPack |
| `ScreenshotCapturePort` | 域外实现：从设备取一帧 |

域模型与端口见 `packages/domain-goal-space`；**禁止**在领域层依赖具体算法或存储产品名。实现阶段适配器可选用 FTS5、pHash 等，但不得渗入端口签名。

实现阶段：适配器在 business/app；域内可提供纯函数校验（图连通性、必填字段），仍不碰 IO。

---

## 6. 存储选型（决策摘要）

| 方案 | 决策 | 理由 |
|------|------|------|
| Markdown Pack + `graph.json` + 截图目录 | **P0** | OpenCode 可直接读；git 可审；与人工精标小图匹配 |
| SQLite（FTS ± vec） | **P1** | 自动按意图裁剪邻域；本地/CI 一体 |
| GraphRAG / Neo4j | **暂缓** | 擅长海量非结构化文档社区摘要；此处结构已知，流水线过重、增量收益低 |

详见对话分析 / canvas `why-not-graphrag-first`。要点：

- 拒绝的是 GraphRAG **流水线**，不是「图」——P0 的 `graph.json` 已是状态机。
- 损失（全局文档问答等）可用并列 DocRAG + 同一 `ContextPack` 汇合弥补；一上来上 GraphRAG 的工程损失更大。

### 6.1 最终存储结构（权威布局）

业务侧根目录建议：`business/goal-space/data/`（或 `COWORK` 并列的 `GOAL_SPACE_DATA_DIR`）。

```
data/
  spaces.json                          # 空间注册表（可选，亦可用目录枚举）
  <spaceId>/                           # 例：cowork-android
    OPENCODE.md                        # 空间级总览（最新版摘要，可指向 default version）
    latest                             # 文本文件，内容为当前默认 version id
    versions/
      <version>/                       # 不可变；例：2026.07.22-1 或 1.0.0
        manifest.json                  # GoalSpaceVersionMeta + 文件校验和
        graph.json                     # 权威图：keyframes[] + transitions[]
        nodes/
          <keyframeId>.md              # 单节点 OpenCode 可读全文
        keyframes/
          <keyframeId>.png             # 全尺寸截图
          <keyframeId>.thumb.webp      # 可选缩略图（检索注入用）
        index.sqlite                   # P1：FTS（± vec）；P0 可缺省
```

#### `manifest.json`（示意）

```json
{
  "ref": { "spaceId": "cowork-android", "version": "1.0.0" },
  "createdAt": "2026-07-22T03:00:00.000Z",
  "sourceSessionId": "sess-…",
  "keyframeCount": 42,
  "transitionCount": 57,
  "files": {
    "graph.json": { "sha256": "…" },
    "keyframes/kf-home.png": { "sha256": "…" }
  }
}
```

#### `graph.json`（权威结构，与域模型对齐）

```json
{
  "ref": { "spaceId": "cowork-android", "version": "1.0.0" },
  "keyframes": [
    {
      "keyframeId": "kf-wps-home",
      "screenName": "WPS 首页",
      "caption": "底部输入框是 WPS AI / Cowork 入口",
      "screenshot": { "uri": "keyframes/kf-wps-home.png", "kind": "screenshot" },
      "widgets": [
        { "name": "底部输入框", "description": "点击进入半屏 Cowork" }
      ],
      "tags": ["home", "wps"]
    }
  ],
  "transitions": [
    {
      "transitionId": "tr-home-to-cowork",
      "fromKeyframeId": "kf-wps-home",
      "toKeyframeId": "kf-cowork-home",
      "action": "点击底部输入框",
      "effect": "进入 Cowork 半屏首页"
    }
  ]
}
```

#### `nodes/<keyframeId>.md`（OpenCode 友好，由 graph 生成）

```markdown
# WPS 首页 (`kf-wps-home`)

底部输入框是 WPS AI / Cowork 入口。

## Widgets
- **底部输入框**：点击进入半屏 Cowork

## Outgoing
- → `kf-cowork-home`：点击底部输入框
```

**原则**：`graph.json` 是程序权威源；`.md` / 缩略图 / `index.sqlite` 均可由 Submit 流水线派生。版本目录一经发布只读。

### 6.2 P1 索引表（`index.sqlite` 逻辑模型）

| 表/虚表 | 内容 | 用途 |
|---------|------|------|
| `keyframes` | id, screen_name, caption, tags | 元数据 |
| `widgets` | keyframe_id, name, description | 别名命中 |
| `transitions` | id, from_id, to_id, action, … | 边命中 |
| `keyframes_fts` | FTS5 覆盖 screen/caption/widgets/tags | 意图全文检索 |
| `transitions_fts` | FTS5 覆盖 action/pre/effect | 动作短语检索 |
| `keyframe_vec`（可选） | embedding blob | 语义近邻 |
| `phash`（可选） | 感知哈希 | 执行期视觉锚点 |

P0 无 sqlite 时：Retrieve 直接扫内存中的 `graph.json`（节点 &lt;~200 可接受）。

---

## 7. 检索与 ContextPack

### 7.1 检索输入（`GoalSpaceRetrieveQuery`）

| 字段 | 含义 |
|------|------|
| `ref` / `spaceId` | 绑定不可变版本；仅 spaceId 则解析 `latest` |
| `intentText` | 本步操作意图、act 命令、或用例片段 |
| `currentKeyframeId` | 已知当前屏（强先验） |
| `currentScreenshotBase64` | 执行期可选，做视觉锚点 |
| `limits` | maxKeyframes≤3、maxTransitions≤6、maxThumbnails≤2、hop=1 |

### 7.2 检索算法（流水线）

```
1. ResolveVersion(ref|spaceId) → GoalSpaceGraph (+ 可选 index)

2. Seed 打分
   a. 若有 currentKeyframeId → seed = {该节点}，权重最高
   b. 否则（及补充）：
      - FTS/关键词：intentText ∩ (screenName|caption|widget.name|action)
      - 可选 vec：intent 嵌入 vs 节点/边文本嵌入
      - 可选 phash：当前截图 vs keyframe 图
   → 得到候选节点集合 S（按 score 排序）

3. 图扩展（hop，默认 1）
   - 从 S 出发取入边/出边邻接节点与边，并入候选
   - 边分：命中 action 文本则加权

4. 裁剪
   - 取 top maxKeyframes 节点、关联 top maxTransitions 边
   - 缩略图最多 maxThumbnails（优先 seed / 最高分）
   - 生成 textMarkdown（固定模板，见下）
   - truncated=true 若候选超过上限

5. 返回 ContextPack（编译/Agent 只消费此对象）
```

**P0 简化**：步骤 2 仅用字符串包含 / 分词重叠；无向量、无 phash。  
**编译期**通常无截图，主要靠 `intentText` +（可选）上一步推断的 `currentKeyframeId`。  
**执行期**可带截图，提高「你在哪」置信度。

### 7.2.1 多模态检索原理（针对「JSON 图 + 截图」）

我们的数据**不是**纯向量库里的自由文档，而是三种信号绑在同一 `keyframeId` 上：

| 模态 | 存在哪里 | 查询侧典型输入 |
|------|----------|----------------|
| 结构化文本 | `graph.json` 的 screen/caption/widget/action | `intentText` |
| 像素 | `keyframes/*.png` | 执行期当前截图 |
| 拓扑 | transitions 邻接表 | seed 节点 ±hop |

因此原理是 **多通道打分 + 按 ID 对齐融合 + 图扩展**，而不是「把整个 JSON 丢进一个黑盒多模态模型」。

```
intentText ──► [文本通道] ──┐
currentShot ─► [视觉通道] ──┼──► 按 keyframeId 融合 score ──► top-S
currentId ───► [先验通道] ──┘              │
                                           ▼
                              [图通道] 邻接扩展 ±hop
                                           ▼
                                      裁剪 → ContextPack
```

#### 通道 A：文本检索（主通道，编译期几乎只靠它）

- **词法（sparse）**：把节点/边字段拼成文档，用 **BM25 / FTS5** 对 `intentText` 打分。擅长专有别名（「底部输入框」「+号」）精确命中。
- **语义（dense）**：用句向量模型把 `intentText` 与 caption/action 编成向量，**余弦相似度 / 内积** 近邻。擅长同义改写（「打开半屏助手」≈「点击底部输入框」）。
- **实践**：P0 词法即可；P1 = 词法 + 语义，用 **RRF（Reciprocal Rank Fusion）** 或加权求和融合，避免只靠向量漏专有名词。

#### 通道 B：视觉检索（执行期锚点「你在哪」）

目标不是 OCR 全文，而是 **当前帧 ≈ 哪个关键帧截图**：

1. **感知哈希（pHash / dHash / aHash）**  
   把图压成短比特指纹，汉明距离小 → 同一屏。极快、无 GPU；对动画/弹层噪声敏感，适合「强相似」过滤。
2. **图像嵌入（CLIP 系）**  
   图→向量，在 keyframe 图库里近邻。对分辨率/主题色更稳；可与文本共享同一 CLIP 空间（图文互检索），但 UI 截图域与自然图有 gap，中文 UI 优先考虑 **Chinese-CLIP / Jina-CLIP** 等。
3. **一般不优先**  
   完整检测+OCR 流水线（如通用 Document VLM）成本高，留给标注工具，而不是每次 retrieve。

#### 通道 C：图扩展（结构先验）

Seed 之后不做「语义漫游」，只做 **显式邻接**：

- 出边/入边 BFS 或按 hop 截断的邻域；
- 可选：把 hit 到的 `action` 边加权（意图像转移文案时）。

这是普通图算法，不是 GraphRAG 社区摘要。

#### 融合与裁剪

- 各通道产出 `(keyframeId, score)` 列表 → **按 ID 对齐**加总或 RRF；
- `currentKeyframeId` 给巨大先验分（或直接强制入选）；
- 再截断到 ≤3/≤6/≤2，渲染 `textMarkdown`。

**要点**：JSON 只是序列化；检索对象是「节点文档 + 边文档 + 图文件 + 邻接」。多模态 = 多通道，而不是单一模型吃 JSON。

### 7.2.2 开源库 / 算法对照（可落地选型）

| 层级 | 算法/思路 | 开源库（示例） | 与本方案 |
|------|-----------|---------------|----------|
| 词法检索 | BM25、倒排 | **SQLite FTS5**、Meilisearch、Typesense、Lucene/Elastic | P1 主推 FTS5（单文件跟版本走） |
| 文本向量 | 句向量 + ANN | **sqlite-vec**、**LanceDB**、Chroma、Qdrant、FAISS；模型：bge-m3、jina-embeddings | P1 可选；库小可用暴力余弦 |
| 图文向量 | CLIP 对比学习 | **OpenCLIP**、**Chinese-CLIP**、**jina-clip-v2** | 执行期图锚 / 图文互检 |
| 感知哈希 | pHash/dHash | **imagehash**（Python）、`blockhash`、Sharp 系实现 | P1/P2 轻量「当前屏」 |
| 分数融合 | RRF、加权和 | 自研十几行即可；LangChain/LlamaIndex 有现成 fusion retriever | 推荐自研，依赖更少 |
| 图邻域 | BFS / k-hop | 自研邻接表；或 **graphology** / NetworkX（仅工具脚本） | 运行时自研足够 |
| 编排框架 | RAG pipeline | LlamaIndex、LangChain | **不必绑**；我们输出固定 ContextPack |

#### 明确不作为第一选择的

| 技术 | 原因 |
|------|------|
| Microsoft GraphRAG | 社区摘要面向长文档，不是精标 UI 状态机 |
| 纯 ColBERT/ColPali 文档检索 | 偏扫描件/PDF 页；重，ROI 低于「别名 FTS + 邻域」 |
| 把整份 `graph.json` 塞进向量库当一个 doc | 无法按节点裁剪，违背 ContextPack 上限 |

#### 推荐组合（与阶段对齐）— 见下节形式化选型

### 7.2.3 形式化选型：成本最低且收益最高的稳定方案

#### 问题设定

设已发布版本图 \(G=(V,E)\)，\(|V|\le N\)（目标 \(N\in[30,200]\)）。查询 \(q\) 含意图文本 \(t\)，可选当前节点先验 \(v_0\in V\cup\{\emptyset\}\)，可选当前截图 \(I\)。

检索输出为有序子集 \(S\subset V\)，\(|S|\le K_v\)（默认 \(K_v=3\)），并取关联边集合 \(T\subset E\)，\(|T|\le K_e\)（默认 \(K_e=6\)），再渲染为 ContextPack。

定义通道得分（未归一化亦可，因最终多用秩融合）：

\[
\begin{aligned}
s_{\mathrm{lex}}(v;t)
&\triangleq \mathrm{BM25}(t,\, d_v),\quad
d_v=\mathrm{concat}(\mathrm{screen}_v,\mathrm{caption}_v,\mathrm{widgets}_v),\\
s_{\mathrm{sem}}(v;t)
&\triangleq \cos\bigl(f_{\mathrm{txt}}(t),\, f_{\mathrm{txt}}(d_v)\bigr),\\
s_{\mathrm{vis}}(v;I)
&\triangleq 1-\frac{\mathrm{Ham}\bigl(h(I),h(\mathrm{img}_v)\bigr)}{L}
\quad\text{或}\quad
\cos\bigl(f_{\mathrm{img}}(I),f_{\mathrm{img}}(\mathrm{img}_v)\bigr),\\
s_{\mathrm{pri}}(v;v_0)
&\triangleq \mathbf{1}[v=v_0].
\end{aligned}
\]

图扩展：对 seed 集合 \(S_0=\mathrm{TopM}(\cdot)\)，

\[
\mathcal{N}_h(S_0)=\{u\in V:\exists s\in S_0,\, \mathrm{dist}_G(u,s)\le h\}
\quad(h=1).
\]

秩融合（RRF，\(k=60\) 为常数）：

\[
\mathrm{RRF}(v)=\sum_{r\in\mathcal{R}}\frac{1}{k+\mathrm{rank}_r(v)}.
\]

在候选 \(\mathcal{N}_h(S_0)\) 上取 \(\mathrm{Top}_{K_v}\) 得 \(S\)，再取与 \(S\) 关联且文本命中加权的边得 \(T\)。

#### 候选技术方案

| 代号 | 组成 | 复杂度（量级） |
|------|------|----------------|
| **A** | 内存词法（子串/分词重叠）+ \(\mathcal{N}_1\) | 查询 \(O(N\cdot |t|)\)，无外部服务 |
| **B** | SQLite FTS5（BM25）+ \(\mathcal{N}_1\) + 可选 RRF 槽位 | 倒排 \(O(|t|\cdot \overline{\mathrm{df}})\)；索引随版本文件 |
| **C** | B + 句向量（sqlite-vec / 暴力余弦） | 另加嵌入 \(O(N\cdot d)\) 或 ANN；模型依赖 |
| **D** | B + pHash 视觉通道（仅当 \(I\neq\emptyset\)） | 预计算 \(|V|\) 指纹；查询 \(O(N)\) 汉明 |
| **E** | B + CLIP 图向量 | GPU/大模型权重；域偏移风险 |
| **F** | Meilisearch/Qdrant/独立 CLIP 服务 | 多进程运维；与「版本目录只读产物」弱契合 |

#### 评价函数（严谨对比维度）

对方案 \(x\) 定义（同评测集 \(\mathcal{Q}\)，钉死 \(G\) 的某一 `space@version`）：

\[
\begin{aligned}
B(x)&=\alpha\cdot \overline{\mathrm{Recall@}K_v}
+\beta\cdot \overline{\mathrm{AliasHit}}
+\gamma\cdot \Delta_{\mathrm{align}}
-\delta\cdot \overline{\mathbf{1}_{\mathrm{trunc\hit\ gold}}},\\
C(x)&=c_{\mathrm{eng}}+c_{\mathrm{dep}}+c_{\mathrm{ops}}+c_{\mathrm{lat}},\\
Stab(x)&=1-\bigl(
\lambda_1\mathrm{Var}[\mathrm{Recall}]
+\lambda_2 p_{\mathrm{fail}}
+\lambda_3 p_{\mathrm{nondeterministic}}
\bigr),\\
Fit(x)&\in[0,1]\ \text{（与 Node 单仓、文件化版本、ContextPack 防腐的契合度）}.
\end{aligned}
\]

其中 \(\Delta_{\mathrm{align}}\) 为相对「无检索」基线的 compile 用词对齐率提升；\(c_{\mathrm{lat}}\) 可由 \(\mathbb{E}[T_{p95}]\) 代理。  
决策准则（约束优化）：

\[
x^\star=\arg\max_x \frac{B(x)\cdot Stab(x)\cdot Fit(x)}{C(x)}
\quad\text{s.t.}\quad
\overline{\mathrm{Recall@}3}\ge 0.85,\ 
T_{p95}\le 50\mathrm{ms}\ (\text{无嵌入}).
\]

在 \(N\ll 10^3\)、别名由人精标、编译主路径无图的前提下，对各方案的**定性序**如下（高=更好）。

| 维度 | A | **B** | C | D | E | F |
|------|---|-------|---|---|---|---|
| \(B\)（别名/意图命中） | 中 | **高** | 高+边际 | 高（执行） | 高但不稳 | 高 |
| \(C\)（成本） | **最低** | **低** | 中 | 低–中 | 高 | 很高 |
| \(Stab\) | 高 | **很高** | 中（模型/版本漂移） | 高（阈值清晰） | 中低（域 gap） | 中（多服务） |
| \(Fit\) | 高 | **最高** | 高 | 高 | 中 | 低 |
| \(B\cdot Stab\cdot Fit / C\) | 高 | **最高** | 中 | 高（作 B 的加性模块） | 低 | 低 |

**边际收益论证（文本通道）**：精标 UI 语料中，查询词与 `widget.name` / `action` 的字面重叠率高。BM25 对专有别名的 \(\mathrm{idf}\) 大，命中即高分；句向量主要修复同义改写。设同义查询占比为 \(p_{\mathrm{syn}}\)，则

\[
\Delta B(C\mid B)\;\lesssim\; O(p_{\mathrm{syn}})\cdot B_{\mathrm{cap}},
\]

而 \(C(C)-C(B)\) 含模型加载、嵌入重建、非确定性。当 \(p_{\mathrm{syn}}\) 未测得足够大时，**不应默认启用 C**。

**视觉通道**：编译期 \(I=\emptyset\)，\(s_{\mathrm{vis}}\equiv 0\)。执行期需要的是「当前屏 ∈ 关键帧库」的粗定位；pHash 在近重复截图上汉明距离小，且失败模式可解释（弹窗遮挡→距离变大）。CLIP 的期望增益主要在跨分辨率/主题变化，但引入域偏移与算力，\(Fit\cdot Stab/C\) 低于「B + 按需 D」。

#### 结论（唯一推荐主方案）

**主方案 \(x^\star=\mathbf{B}\)（版本内 SQLite FTS5 + 自研邻接 \(\mathcal{N}_1\) + 先验 \(v_0\)），执行期按需叠加 \(\mathbf{D}\)（pHash）；P0 可用 \(\mathbf{A}\) 作为无索引退化实现，API 同构。**

形式化写为：

\[
\begin{aligned}
S_0&=\mathrm{Top}_{M}\bigl(
w_{\mathrm{pri}}s_{\mathrm{pri}}+w_{\mathrm{lex}}s_{\mathrm{lex}}
+[I\neq\emptyset]\,w_{\mathrm{vis}}s_{\mathrm{vis}}^{\mathrm{pHash}}
\bigr),\\
S&=\mathrm{Top}_{K_v}\bigl(\mathcal{N}_1(S_0)\bigr)
\quad\text{（可用 RRF 预留槽位，单通道时退化为按 }s_{\mathrm{lex}}\text{ 排序）}.
\end{aligned}
\]

默认权重：\(w_{\mathrm{pri}}\gg w_{\mathrm{lex}}\ge w_{\mathrm{vis}}\)（有 \(v_0\) 时强制 \(v_0\in S\)）。

**明确推迟**：句向量（C）、CLIP（E）、独立搜索集群（F），除非离线评测证明

\[
\overline{\mathrm{Recall@}3}(B)<0.85
\quad\text{或}\quad
p_{\mathrm{syn}}\ \text{主导失败集}.
\]

**与工程架构的契合点**：

1. 索引文件落在 `versions/<version>/index.sqlite`，与不可变版本同生命周期，满足可复现。  
2. 仅 Node/TS + better-sqlite3（或 sql.js）即可，无额外 daemon，契合现有 monorepo 服务模型。  
3. 输出仍为 `ContextPack`，compile/agent 不变。  
4. 确定性：同版本 + 同查询 → 同 Pack（无随机 ANN/温度）。  

#### 实施顺序（不改变 \(x^\star\)）

1. **P0 / A**：内存词法 + \(\mathcal{N}_1\)，打通 Retrieve → Pack → compile 注入。  
2. **P1 / B**：Submit 时建 FTS5；查询切到 B（A 保留为 fallback）。  
3. **P2 / D**：执行路径传入 \(I\) 时启用 pHash。  
4. **门禁后再 C/E**：仅当 §7.5 闸门在 B+D 下仍失败。

### 7.2.4 运行时定屏：pHash vs CLIP（原理 / 复杂度 / 收益 / 稳定性）

二者都用于估计「当前截图 \(I\) 对应哪个关键帧 \(v\in V\)」，**都不替代 FTS**。输出是先验 \(v_0\)（或得分向量 \(s_{\mathrm{vis}}(v)\)），再与文本通道融合。

#### A. 感知哈希 pHash（及 dHash / aHash）

**原理（离散、无学习）**

1. 将图缩放到固定小尺寸（如 \(32\times 32\)），转灰度。  
2. （pHash）做二维 DCT，取低频系数块；或（dHash）比较相邻像素梯度符号。  
3. 相对中位数（或固定阈值）二值化，得到长度 \(L\) 的比特串 \(h(I)\in\{0,1\}^L\)（常见 \(L=64\)）。  
4. 两图距离为汉明距离：

\[
d_H\bigl(h(I),h(\mathrm{img}_v)\bigr)
=\sum_{i=1}^{L}\mathbf{1}\bigl[h(I)_i\neq h(\mathrm{img}_v)_i\bigr].
\]

近重复截图 → \(d_H\) 小。得分可取 \(s_{\mathrm{vis}}=1-d_H/L\)；若 \(\min_v d_H>\tau\) 则判「无可靠当前屏」。

**复杂度**

| 项 | 量级 |
|----|------|
| 工程 | 极低：Submit 时算指纹入库；运行时算一帧 + \(O(N)\) 比较（\(N\sim 10^2\) 可忽略） |
| 依赖 | `imagehash` / 等价实现；无模型文件、无 GPU |
| 延迟 | 通常毫秒～十几毫秒级 |

**收益**

- 回答「是不是同一屏的近重复」——与关键帧库「同机、同主题、同分辨率」假设高度同构。  
- 为 FTS 提供 \(v_0\)，显著降低「意图命中了别的屏上的同名控件」的混淆。

**稳定性**

- **高确定性**：同图同算法 → 同指纹；无随机种子。  
- **失败模式可解释**：Toast/半透明弹层、强动画帧、状态栏时间变化 → \(d_H\) 上升；可调 \(\tau\) 或先裁 UI 安全区再哈希。  
- **不擅长**：跨主题肤色大改、横竖屏切换后未重新采样、两屏布局极像但语义不同（需文本通道纠偏）。

#### B. CLIP 类图向量

**原理（对比学习嵌入）**

预训练使图像编码器 \(f_{\mathrm{img}}\) 与文本编码器 \(f_{\mathrm{txt}}\) 共享空间：匹配的 (图, 文) 余弦相似度高。定屏时只用图支：

\[
s_{\mathrm{vis}}(v;I)=\cos\bigl(f_{\mathrm{img}}(I),\, f_{\mathrm{img}}(\mathrm{img}_v)\bigr).
\]

亦可图文互检：\(\cos(f_{\mathrm{img}}(I), f_{\mathrm{txt}}(\mathrm{caption}_v))\)，但关键帧定屏以 **图-图** 为主。

**复杂度**

| 项 | 量级 |
|----|------|
| 工程 | 中～高：模型权重、版本钉扎、Submit 批量嵌入、运行时推理或近似 ANN |
| 依赖 | OpenCLIP / Chinese-CLIP / Jina-CLIP 等；常需原生/ONNX；体积百 MB～GB 级 |
| 延迟 | CPU 可达百毫秒～秒；要稳需预计算库侧向量，查询只嵌当前帧 |

**收益**

- 对缩放、轻度压缩、色彩偏移比 pHash 更稳。  
- 在「库图与实机图差异较大」时，期望召回高于纯哈希。  
- 附带能力：图↔文检索（非本阶段刚需）。

**稳定性**

- **中等**：依赖模型版本；升级嵌入空间则必须 **整库重嵌**，否则不可比。  
- **域偏移**：CLIP 多在自然图/配文上训练，**纯 UI 截图** 不是原生分布；中文界面需偏中文或 UI 数据的模型，否则近邻可能「看起来像」但屏错。  
- **失败不可解释**：余弦分接近时难说清「差在哪」；弹层有时仍能给高分（语义笼统）。  
- **运维**：CI/本地/服务器需一致的推理栈，否则 \(Stab\) 下降。

#### C. 对照与本方案决策

设 \(B,C,Stab,Fit\) 同 §7.2.3。在「关键帧由本机采样、运行同设备族」的先验下：

| 维度 | pHash | CLIP |
|------|-------|------|
| 定近重复屏 | **足够且主路径** | 更强但常过剩 |
| \(C\) | **低** | 高 |
| \(Stab\) | **高（可解释阈值）** | 中（模型/域） |
| \(Fit\)（Node 单仓、版本目录） | **高** | 中 |
| 与 FTS 分工 | 专责 \(v_0\) | 同左，成本更高 |

**决策**：运行时定屏默认 **pHash（方案 D）**；仅当评测集上 pHash 的 \(\mathrm{Top\text{-}1}\) 屏准确率持续低于门槛（如 \(<0.8\)），且失败主因是「非近重复外观漂移」而非弹层，再引入 CLIP 作 **精排（对 pHash 的 top-\(m\) 重排）**，避免一上来全库 CLIP。

流水线建议：

```
I → pHash 对全库  → 若 min d_H ≤ τ：取 v₀
                 → 否则（可选）CLIP 对 top-m 或全库精排
v₀ + intentText → FTS + N_1 → ContextPack
```

### 7.2.5 视觉 × 文本（FTS5）如何结合：成熟范式与推荐

#### 问题

文本通道给出「意图相关哪些状态/动作」；视觉通道给出「当前更像哪一帧」。二者异构（BM25 分 vs 汉明距离），**不能直接相加原始分**，需要成熟的 **多检索器融合（multi-retriever fusion）** 策略。

#### 业界成熟范式（按复杂度升序）

| 范式 | 做法 | 成熟度 | 复杂度 | 对本场景 |
|------|------|--------|--------|----------|
| **① 级联 / 约束检索（Cascade）** | 先视觉得 \(v_0\)（或拒识），再在 \(\mathcal{N}_h(v_0)\)（或全图但强加先验）上跑 FTS | 极常用（先过滤再精排） | **低** | **最契合** |
| **② 晚融合（Late fusion）** | 两通道各自产出排序列表，用 **RRF** 或归一化加权和合并 | 搜索/RAG 标配（RRF 有大量工程实践） | 低 | 适合「无可靠 \(v_0\)」时兜底 |
| **③ 过滤-再排序（Filter-then-rank）** | pHash 取 top-\(m\) 候选，FTS 只在这 \(m\) 个里打分 | 图像检索常用 | 低 | \(N\) 大或视觉很强时 |
| **④ 早融合（Early fusion）** | 图文进同一向量空间联合检索 | CLIP 系 | 高 | 暂缓（见 §7.2.3/7.2.4） |

**不推荐**：把截图 OCR 成字再塞进 FTS 当「伪多模态」——OCR 噪声大、延迟高，且与已有 caption/别名重复。

#### 推荐主方案：① 级联 + ② RRF 兜底（技术复杂度低、收益/稳定性高）

记 \(t=\) 意图文本，\(I=\) 当前截图（可空），\(\tau=\) pHash 拒识阈值。

**情况 1：有图且视觉可信（\(I\neq\emptyset\) 且 \(\min_v d_H\le\tau\)）→ 级联**

\[
\begin{aligned}
v_0&=\arg\min_v d_H\bigl(h(I),h(\mathrm{img}_v)\bigr),\\
S_{\mathrm{cand}}&=\mathcal{N}_h(\{v_0\})\quad(h=1),\\
S&=\mathrm{Top}_{K_v}\ \mathrm{BM25}(t,\, d_v)\ \text{for } v\in S_{\mathrm{cand}},
\end{aligned}
\]

并强制 \(v_0\in S\)。边集优先取与 \(S\) 关联且 BM25(action) 高的转移。

语义：视觉回答「在哪」；文本在邻域内回答「下一步/相关控件」——分工清晰，分数无需对齐。

**情况 2：无图（编译期）或视觉拒识（弹层等）→ 纯 FTS + 全图 \(\mathcal{N}\) 扩展**

\[
S_0=\mathrm{Top}_M\ \mathrm{BM25}(t),\quad
S=\mathrm{Top}_{K_v}\bigl(\mathcal{N}_1(S_0)\bigr).
\]

**情况 3：有图但希望更稳（可选）→ 晚融合 RRF**

设 \(L_{\mathrm{vis}}=\mathrm{rank\ by\ } s_{\mathrm{vis}}\)，\(L_{\mathrm{lex}}=\mathrm{rank\ by\ BM25}\)，

\[
\mathrm{RRF}(v)=\frac{1}{k+\mathrm{rank}_{\mathrm{vis}}(v)}+\frac{1}{k+\mathrm{rank}_{\mathrm{lex}}(v)}
\quad(k=60).
\]

再 \(\mathrm{Top}_{K_v}\)。RRF **不要求** BM25 与汉明距离同量纲，这是其工程价值。

#### 伪代码（实现期）

```
function retrieve(t, I, G):
  if I present:
    v0, d = pHashNearest(I, G)
    if d <= tau:
      cand = neighborhood(G, v0, hop=1)
      hits = fts5(t, restrict_to=cand)   # 文本在邻域内
      S = topK(hits, Kv) ∪ {v0}
      return pack(S, edges(S), mode="cascade")
  # 编译期 / 拒识
  hits = fts5(t, restrict_to=all)
  S = topK(expand(hits, hop=1), Kv)
  return pack(S, edges(S), mode="text-only")
```

可选增强：拒识时对 `fts5(all)` 与 `pHash-topk` 做 RRF，而不是直接丢视觉信号。

#### 为何这是「低成本 × 高收益 × 高稳定」

| 维度 | 说明 |
|------|------|
| **成熟** | Cascade / RRF 是信息检索与混合 RAG 的标准做法，非自创理论 |
| **成本** | 无联合训练；FTS5 + pHash + 邻接表，均已在 §7.2.3 选定 |
| **收益** | 消解「同名控件在不同屏」的文本歧义；编译仍可纯文本工作 |
| **稳定** | 视觉失败有拒识分支；不依赖 CLIP；同版本同输入可复现 |
| **可测** | 分别报：定屏 Top-1 准确率、级联下 Recall@3、文本-only 基线 |

#### 明确不采用的结合方式（本阶段）

- 早融合单向量库替代 FTS（失别名精确命中、运维重）。  
- 用视觉分数去「校准」BM25 原始分（量纲混乱，不如 RRF/级联）。  
- 无拒识阈值的强制 \(v_0\)（弹层时会把后续 FTS 锁死在错误邻域）。

---

### 7.3 检索输出结构（`ContextPack`）

域模型见 `packages/domain-goal-space/src/models/context-pack.ts`。

| 字段 | 用途 |
|------|------|
| `ref` | 空间@version，保证可复现 |
| `retrievedAt` | 检索时刻 |
| `textMarkdown` | **注入 LLM 的主载荷**（已裁剪） |
| `keyframes[]` | 结构化切片：id、screenName、caption、widgets、可选 thumbnail、score |
| `transitions[]` | 结构化边：from/to、action、pre/effect、score |
| `querySummary` | 日志/调试回显 |
| `truncated` | 是否发生裁剪 |

#### `textMarkdown` 模板（约定）

```markdown
## 目标状态空间参考 (`cowork-android@1.0.0`)

### 候选状态
1. **WPS 首页** (`kf-wps-home`) — score=0.92
   - 说明：底部输入框是 WPS AI 入口
   - 控件：底部输入框
2. …

### 合法转移
- `kf-wps-home` → `kf-cowork-home`：点击底部输入框
- …

### 约束
- actions / 点击目标优先使用上述控件别名与转移文案
- 不要臆造未列出的入口
```

程序化注入时：compile 可只贴 `textMarkdown`；需要画热区时再读 `keyframes[].thumbnail`。

### 7.4 注入点（实现阶段）

- `business/cowork-csv` → `buildStepCompileInput`：追加「目标状态空间参考」。
- `domain-case` LLM compiler：约束 actions 用词对齐 Pack 别名。
- `domain-agent` plan/system：候选屏 + 合法转移；失败可二次检索。

### 7.5 性能如何评定

分三层：**检索系统指标**、**下游任务指标**、**成本/延迟**。没有单一分数；以「约束控机/编译是否变稳」为准。

#### A. 检索离线评测集（实现前先建 30～50 条）

每条样本：

```json
{
  "id": "q-01",
  "ref": { "spaceId": "cowork-android", "version": "1.0.0" },
  "intentText": "点击底部输入框进入 Cowork",
  "currentKeyframeId": null,
  "goldKeyframeIds": ["kf-wps-home", "kf-cowork-home"],
  "goldTransitionIds": ["tr-home-to-cowork"],
  "goldWidgetNames": ["底部输入框"]
}
```

| 指标 | 定义 | 目标（首版建议） |
|------|------|------------------|
| **Recall@K（节点）** | gold 节点落在返回的 ≤K 个 keyframe 中的比例 | K=3 时 ≥0.85 |
| **Recall@K（边）** | gold 边落在返回转移中的比例 | K=6 时 ≥0.80 |
| **MRR / nDCG** | 正确节点排序质量 | 相对无图基线提升 |
| **别名覆盖率** | gold widget 名出现在 Pack 文本中的比例 | ≥0.90 |
| **截断率** | `truncated=true` 且 gold 被裁掉的比例 | &lt;0.10 |
| **延迟 p50/p95** | `retrieve` 端到端 | p95 &lt; 50ms（无 vec）/ &lt;200ms（含嵌入） |

#### B. 下游任务（真正关心的收益）

| 指标 | 测法 | 说明 |
|------|------|------|
| **Compile 用词对齐率** | 有/无 Pack 对照：actions 是否命中 Pack 别名/转移文案 | 主指标之一 |
| **非法入口率** | 编译或 plan 产出的动作是否落在返回转移集合外 | 应下降 |
| **Act 超时率 / 重试次数** | 同一批 P0 用例 | 间接收益 |
| **人工抽检通过率** | 抽样看 Pack 是否「说得对」 | 防检索看似高、语义错 |

基线：**同一用例集、同一模型、关闭 Retrieve** vs **开启 Retrieve（钉死 space@version）**。

#### C. 成本与稳定性

| 指标 | 关注点 |
|------|--------|
| Pack token 数 | 分布与上限；避免挤占 compile 上下文 |
| 版本漂移 | 换 version 后 Recall 是否断崖（应用例钉版本） |
| 标注 ROI | 每增 10 个关键帧，Recall/对齐率边际收益 |

#### D. 判定「够不够好」的闸门（建议）

发布某 `space@version` 为默认前：

1. 离线 Recall@3（节点）≥ 0.85，截断误伤 &lt; 0.10  
2. 对照实验：Compile 用词对齐率相对基线 **+15pp** 或人工抽检明显更好  
3. p95 延迟达标  

未过闸门：先改标注/别名/检索权重，而不是上 GraphRAG。

---

## 8. HTTP 协议（草图）

由 `protocol/goal-space-http.ts` 约定路径与载荷；业务服务实现。建议端口 `:4104`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/goal-space/sessions` | 开采样会话 |
| POST | `/api/goal-space/sessions/:id/keyframes` | 标记关键帧（可带 screenshotBase64） |
| POST | `/api/goal-space/sessions/:id/transitions` | 记录转移 |
| PATCH | `/api/goal-space/sessions/:id/keyframes/:kid` | 补标注 |
| POST | `/api/goal-space/sessions/:id/submit` | 提交为不可变版本 |
| GET | `/api/goal-space/spaces` | 列空间 |
| GET | `/api/goal-space/spaces/:spaceId/versions/:version` | 读版本摘要/图 |
| POST | `/api/goal-space/retrieve` | → ContextPack |
| GET | `/api/goal-space/spaces/:spaceId/versions/:version/opencode-pack` | 导出清单 |

---

## 9. 交互采样 UX（前端，实现阶段）

复用 Scrcpy / Playground 预览，增加「目标采样」模式：

1. **标记关键帧**：截图 + screenName / caption / widgets。
2. **记录转移**：上一关键帧 → 人工操作 → 新关键帧 + action 文案。
3. **补注**：时间线点开改标注。
4. **提交**：孤立点警告 → bump version → 建索引（P1）→ 写 `OPENCODE.md`。

原则：只在关键处采样，首版目标单 space **30–80** 节点。

---

## 10. 分阶段落地

| 阶段 | 交付 | 验收 |
|------|------|------|
| **P0** | 本方案文档 + 域模型/端口；随后采样 UI + 文件落盘 + 手工/半自动注入 compile | 关键帧可回放；compile prompt 可见参考段 |
| **P1** | Retrieve API + compile/agent 自动注入 + 版本锁定 | 有/无 Pack 指令词对齐率对比 |
| **P2** | 执行期当前屏匹配 + 非法转移告警 | 误点/超时可量化下降 |
| **P3** | 多 space、跨端差分；再评估嵌入式图库 / 并列 DocRAG | 规模与延迟阈值 |

---

## 11. 风险与原则

- **标注漂移**：版本不可变；升级显式迁移。
- **上下文膨胀**：禁止全图倾倒；只注入 Retrieve 结果。
- **与 Midscene**：Pack = 语义地图；Midscene = 像素定位。
- **OpenCode 第一性**：任何存储必须能导出稳定 Markdown/JSON Pack。

---

## 12. 代码入口

| 路径 | 内容 |
|------|------|
| `packages/domain-goal-space` | 模型、端口、HTTP 协议形状、错误码（**无 IO 实现**） |
| `packages/domain-goal-space/README.md` | 域边界速查 |
| 本文档 | 方案全文 |

实现开始时：在 `business/` 或 `apps/` 增加适配器与服务，**不要**在 domain 包内写文件系统或 SQLite。
