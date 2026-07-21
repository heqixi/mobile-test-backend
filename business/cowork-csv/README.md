# Cowork CSV 用例库（业务实现）

读取 `cowork_test_case.csv`，实现 `@mtp/domain-case` 的 `CaseDataSourcePort`，并以独立 HTTP 服务暴露。

- **不属于** domain-case / case-service
- 编译：业务切步 → 逐条调用 `LlmInstructionCompiler` → sidecar `*.compiled.json`
- HTTP 协议由 `domain-case` 的 `case-library-http` 定义
- **运行报告**：落盘 Midscene 兼容 HTML（`script[type=midscene_web_dump]` + `playwright_test_*` 属性），支持回写 CSV「测试结果」列

```bash
cd mobile-test-backend
npm run cowork-library:serve   # 默认 http://127.0.0.1:4103（需 OpenCode :4096）
```

主工程经 RemoteCaseDataSource 连接：

```ts
import { createCaseDataConnector, createRemoteCaseDataSource } from '@mtp/domain-case'

const connector = createCaseDataConnector();
connector.connect(createRemoteCaseDataSource({ baseUrl: 'http://127.0.0.1:4103' }));
await connector.compileCase(caseId);
```

### 运行报告 API（Midscene 兼容）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/library/reports` | 报告列表 |
| POST | `/api/library/reports` | 落盘报告（写 Midscene HTML + JSON） |
| GET | `/api/library/reports/:id` | 报告详情 |
| GET | `/api/library/reports/:id/html` | Midscene 报告 HTML |
| POST | `/api/library/reports/:id/writeback` | 回写 CSV「测试结果」 |

报告目录：`<csv>.reports/`（与 CSV 同级）。

### 用例排序 API

长按拖拽后前端会调用此接口，将行序回写到 CSV。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/library/cases/reorder` | body `{ caseIds: string[] }`，按数组顺序重排 CSV 数据行并返回最新列表 |

`caseId` 稳定：优先「用例编号」，否则 `path|title` 哈希（不含行号），重排后 ID 不变。
