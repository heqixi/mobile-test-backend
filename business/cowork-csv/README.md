# Cowork CSV 用例库（业务实现）

读取 `cowork_test_case.csv`，实现 `@mtp/domain-case` 的 `CaseDataSourcePort`，并以独立 HTTP 服务暴露。

- **不属于** domain-case / case-service
- 编译：业务切步 → 逐条调用 `LlmInstructionCompiler` → sidecar `*.compiled.json`
- HTTP 协议由 `domain-case` 的 `case-library-http` 定义

```bash
cd mobile-test-backend
npm run cowork-library:serve   # 默认 http://127.0.0.1:4103（需 OpenCode :4096）
```

主工程经 RemoteCaseDataSource 连接：

```ts
import { createCaseDataConnector, createRemoteCaseDataSource } from '@mtp/domain-case';

const connector = createCaseDataConnector();
connector.connect(createRemoteCaseDataSource({ baseUrl: 'http://127.0.0.1:4103' }));
await connector.compileCase(caseId);
```
