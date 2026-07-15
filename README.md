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

## Agent / Case

仍为契约骨架；不影响 Executor 预览与对话。
