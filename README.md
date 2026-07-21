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

启动：

```bash
cd /Users/mac/src/agents/mobile-test-backend
npm run executor:serve
```

启动后：

| 地址 | 用途 |
|------|------|
| `http://127.0.0.1:4098` | Executor HTTP（health / freeform / AEP / screenshot） |
| `http://127.0.0.1:5800` | Midscene Playground（UniversalPlayground 对话流） |
| `http://127.0.0.1:5700` | Scrcpy 实时预览 |

常用环境变量：

- `ANDROID_DEVICE_ID` — 指定设备
- `ANDROID_APP_PACKAGE` — 启动包名（默认 `cn.wps.moffice_eng`）
- `ANDROID_SKIP_LAUNCH=1` — 不自动 launch App
- `MIDSCENE_PLAYGROUND=0` / `MIDSCENE_SCRCPY=0` — 关闭侧车
- `MIDSCENE_REPLANNING_CYCLE_LIMIT` — `aiAct` 重规划上限（默认 `5`）

## Agent / Case

- Agent：`:4100` Instruction Loop（OpenCode + Midscene act_nl + SSE）
- Case：`:4102` CaseRun 游标 / 账本；规则 compile；**DataConnector** 代理远端用例库
- Cowork 用例库：`:4103` 独立业务服务（`business/cowork-csv`）

```bash
npm run cowork-library:serve   # :4103
npm run case:serve             # :4102，默认连接 http://127.0.0.1:4103
npm run agent:serve            # :4100
```

数据源格式由**业务 Adapter** 在独立进程处理；`case-service` 经 `createRemoteCaseDataSource({ baseUrl })` 连接，不内嵌 CSV。  
Cowork 默认数据在 `business/cowork-csv/data/`（CSV、`*.compiled.json`、`*.reports/`）。  
详见 [`docs/case-llm-instruction-compile.md`](./docs/case-llm-instruction-compile.md)。

设计总览：`vitest-all-platforms-demo/docs/architecture-domain-design.md`。
