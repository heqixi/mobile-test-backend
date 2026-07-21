# Cowork CSV 用例库（业务实现）

本包**自维护**用例源与运行产物，实现 `@mtp/domain-case` 的 `CaseDataSourcePort`，并以独立 HTTP 服务暴露。`domain-case` / `case-service` **不读本地 CSV**，只经 `case-library-http` 协议交互。

| 路径 | 说明 |
|------|------|
| `data/cowork_test_case_top10.csv` | 默认用例源（可用 `COWORK_CSV_PATH` 覆盖） |
| `data/<csv>.compiled.json` | 编译 sidecar |
| `data/<csv>.reports/` | Midscene 运行报告（HTML + JSON + index） |

- 编译：业务切步 → 逐条调用 `LlmInstructionCompiler` → sidecar `*.compiled.json`
- HTTP 协议由 `domain-case` 的 `case-library-http` 定义
- **运行报告**：落盘 Midscene 兼容 HTML（`script[type=midscene_web_dump]` + `playwright_test_*` 属性），支持回写 CSV「测试结果」列

```bash
cd mobile-test-backend
npm run cowork-library:serve   # 默认 http://127.0.0.1:4103（需 OpenCode :4096）
```

环境变量：

| 变量 | 说明 |
|------|------|
| `COWORK_CSV_PATH` | 覆盖默认 CSV 绝对/相对路径 |
| `COWORK_CSV_DATA_DIR` | 覆盖默认 `data/` 目录（仅在未设 `COWORK_CSV_PATH` 时影响默认文件名解析） |
| `COWORK_LIBRARY_PORT` | 默认 `4103` |

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

报告目录：`<csv>.reports/`（与 CSV 同级，默认在本包 `data/`）。

### 用例排序 API

长按拖拽后前端会调用此接口，将行序回写到 CSV。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/library/cases/reorder` | body `{ caseIds: string[] }`，按数组顺序重排 CSV 数据行并返回最新列表 |

`caseId` 稳定：优先「用例编号」，否则 `path|title` 哈希（不含行号），重排后 ID 不变。
