# Goal Space 业务实现

实现 `@mtp/domain-goal-space` 端口：文件存储、词法文本检索、dHash 视觉定屏、检索门面、HTTP `:4104`。

```bash
cd mobile-test-backend
npm run goal-space:serve   # http://127.0.0.1:4104
```

数据目录：`business/goal-space/data/`（`GOAL_SPACE_DATA_DIR` 可覆盖）。

前端：控制台右侧「目标采样」面板。Agent / Cowork 编译经 `GOAL_SPACE_URL` 拉取 ContextPack。
