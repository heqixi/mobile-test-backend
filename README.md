# Mobile Test Backend

与同级 `mobile-test-frontend` 成对。设计依据：`vitest-all-platforms-demo/docs/architecture-domain-design.md`

## 分层（Executor）

```
apps/executor-service     ← HTTP 门面（路由 / CORS / JSON）
        │ 只依赖 ExecutorPort
        ▼
packages/domain-executor  ← 领域实现
        · MidsceneExecutor (ExecutorPort)
        · createAndroidExecutor()
        · adapters: adb / playground-sidecar
        · scrcpy / midscene sample
```

## 启动

```bash
cd mobile-test-backend

# 1) 安装依赖（file: 指向本仓库 vendor/midscene）
npm install

# 2)（可选）把 node_modules/@midscene/* 指到 vendor；一般 npm install 已足够
npm run link:midscene

# 3) 按需启动服务（各开一个终端）
npm run executor:serve         # :4098 + Playground :5800 + Scrcpy :5700
npm run cowork-library:serve   # :4103 业务用例库（CSV / reports）
npm run case:serve             # :4102 DataConnector，默认连 :4103
npm run agent:serve            # :4100 Agent Loop（需 OpenCode :4096）
```

推荐顺序：`cowork-library` → `case` → `executor` → `agent`（OpenCode 需先起）。

| 地址 | 用途 |
|------|------|
| `http://127.0.0.1:4098` | Executor HTTP（health / freeform / AEP / screenshot） |
| `http://127.0.0.1:5800` | Midscene Playground（UniversalPlayground 对话流） |
| `http://127.0.0.1:5700` | Scrcpy 实时预览 |
| `http://127.0.0.1:4103` | Cowork 用例库 |
| `http://127.0.0.1:4102` | Case service |
| `http://127.0.0.1:4100` | Agent service |

### Vendored Midscene

本仓库内置构建产物：`vendor/midscene/{shared,core,android,playground}`（已提交，不依赖 sibling 仓库即可跑）。

| 命令 | 说明 |
|------|------|
| `npm run link:midscene` | 将 `node_modules/@midscene/*` 链到 `vendor/midscene/*` |
| `npm run sync:midscene` | 从 sibling `../midscene` **重新同步**进 `vendor/`（开发改 Midscene 源码后用），再 `npm install` / `link:midscene` 并提交 `vendor/` |

### 常用环境变量

- `ANDROID_DEVICE_ID` — 指定设备
- `ANDROID_APP_PACKAGE` — 启动包名（默认 `cn.wps.moffice_eng`）
- `ANDROID_SKIP_LAUNCH=1` — 不自动 launch App
- `MIDSCENE_PLAYGROUND=0` / `MIDSCENE_SCRCPY=0` — 关闭侧车
- `MIDSCENE_REPLANNING_CYCLE_LIMIT` — `aiAct` 重规划上限（默认 `5`）
- `MIDSCENE_AI_ACT_MAX_ACTIONS` — 每次 `aiAct` 最多执行的设备操作数（可选；不设则不限制）
- `CASE_LIBRARY_URL` — case-service 连接的用例库（默认 `http://127.0.0.1:4103`）
- `COWORK_CSV_PATH` / `COWORK_CSV_DATA_DIR` — 覆盖默认 CSV / `data/` 目录

更多见 [`.env.example`](./.env.example)。

## Agent / Case

- Agent：`:4100` Instruction Loop（OpenCode + Midscene act_nl + SSE）
- Case：`:4102` CaseRun 游标 / 账本；规则 compile；**DataConnector** 代理远端用例库
- Cowork 用例库：`:4103` 独立业务服务（`business/cowork-csv`）

数据源格式由**业务 Adapter** 在独立进程处理；`case-service` 经 `createRemoteCaseDataSource({ baseUrl })` 连接，不内嵌 CSV。  
Cowork 默认数据在 `business/cowork-csv/data/`（CSV、`*.compiled.json`、`*.reports/`）。  
详见 [`docs/case-llm-instruction-compile.md`](./docs/case-llm-instruction-compile.md)。

设计总览：`vitest-all-platforms-demo/docs/architecture-domain-design.md`。
