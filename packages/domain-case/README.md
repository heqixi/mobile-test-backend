# @mtp/domain-case

Case 域：`CaseDefinition` / `CaseRun`、规则 compile、LLM Compiler API、**DataConnector**。

## 边界

| 层 | 职责 |
|----|------|
| **业务 Adapter**（域外） | 读 CSV/平台、**切步**、拼 `CompileCaseInput`；独立 HTTP 实现 `case-library-http` |
| **DataConnector** | `connect` / 列表 / 详情 / `getCompiled` / `syncCompiled` / `compileCase`；**不主动编译** |
| **LlmInstructionCompiler** | `CompileCaseInput` → OpenCode → Draft → Validator → Instruction；业务按需逐条调用，再 sync |

## DataConnector API

- `CaseDataSourcePort` — 外部 Adapter 契约
- `CaseDataConnectorPort` / `createCaseDataConnector()` — 域内连接器
- 模型：`ConnectedCaseSummary` / `Outline` / `Detail` / `ConnectedCompiledBundle`
- `createLlmInstructionCompiler` / `createInstructionValidator`

## 业务示例

`business/cowork-csv` — **业务自维护** `data/` 下的 CSV、编译 sidecar、Midscene reports；本包只经 HTTP/`CaseDataSourcePort` 交互，不读业务文件系统。

独立 HTTP 服务：`business/cowork-csv`（`npm run cowork-library:serve`，默认 `:4103`）。协议见 `protocol/case-library-http.ts`；主工程 `case-service` 通过 `createRemoteCaseDataSource({ baseUrl })` 连接。

```bash
npm run cowork-library:serve   # :4103（需 OpenCode :4096）
npm run case:serve             # :4102，CASE_LIBRARY_URL 默认 http://127.0.0.1:4103
```

文档：[`../../docs/case-llm-instruction-compile.md`](../../docs/case-llm-instruction-compile.md)
