# Goal Space 业务实现

实现 `@mtp/domain-goal-space` 端口：文件存储、词法文本检索、dHash 视觉定屏、检索门面、HTTP `:4104`。

```bash
cd mobile-test-backend
npm run goal-space:serve   # http://127.0.0.1:4104
```

数据目录：`business/goal-space/data/`（`GOAL_SPACE_DATA_DIR` 可覆盖）。

## 谁消费？Agent 按需上下文

Goal Space **始终给 Agent 做运行期参考**，不是编译期整包塞进 Instruction。

| 角色 | 职责 |
|------|------|
| 前端 | 像用例库一样绑定 Goal Space **URL**，多选 **space**（检索 scope） |
| `agent-service` | 用 scope 调 `GoalSpaceRetrievePort.retrieve`（意图+截图+小 limits） |
| `domain-agent` | 只吃当轮 `extraContextMarkdown`；不拉全图 |
| `domain-goal-space` | 提供裁剪后的 `ContextPack` |

**禁止**：连接后把所选 space 全部关键帧/转移硬灌进 prompt。

环境回退（无 FE 绑定时）：

```bash
GOAL_SPACE_URL=http://127.0.0.1:4104
GOAL_SPACE_ID=cowork-android
GOAL_SPACE_VERSION=                 # 可选；retrieve 默认 latest
AGENT_GOAL_SPACE=0                  # 关闭按需检索
```

前端：用例面板绑定 Goal Space；「目标采样」复用同一连接与采样主 space。

## Space Summary

每个 space 可维护一份可编辑摘要（落盘 `space.json` 的 `summary` 字段）：

- **显示 / 手改**：采样面板「Space Summary」区
- **LLM 生成**：`POST /api/goal-space/spaces/:id/summary:generate`  
  输入为 **压缩后的 graph JSON**（默认 latest，可选指定 version）+ 种子关键词；需配置 `MIDSCENE_MODEL_*`（或 `OPENAI_*`）
- API：`GET` / `PUT` `/api/goal-space/spaces/:id/summary`

摘要供人阅读与编辑；不替代关键帧 notes，也不整图灌入 Agent prompt。
