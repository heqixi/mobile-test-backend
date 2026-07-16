# Case → Instruction：LLM Compiler + Validator

> 归属：`packages/domain-case`  
> 状态：**LLM Compiler + Validator 已实现；业务 Adapter 切步后逐条调用**

## 1. 边界

**domain-case 关心：**

1. 编译输入 `CompileCaseInput`（一条已整理的 case 正文）
2. 内置 Compiler：`case + optional prompt → LLM → Instruction → Validator`
3. 校验输出 `CompileReport` / `CompileIssue`

**domain-case 不关心：**

- CSV / Excel / 平台 JSON / 自由文档等**数据源格式**
- 如何从业务系统拉数、切步、字段映射 → **业务 Adapter** 负责，产出 `CompileCaseInput` 即可

```
业务 Adapter（域外）          domain-case
─────────────────          ──────────────────────────────
异构 Case 源  ──整理──▶  CompileCaseInput
                              │
                     LlmInstructionCompiler
                              │
                         推送 LLM
                              │
                    解析 → InstructionDraft
                              │
                         → Instruction
                              │
                      InstructionValidator
                              │
                         CompileOutput
```

## 2. 核心 API

### 2.1 输入

```ts
interface CompileCaseInput {
  caseText: string;           // 业务整理后的正文
  metadata?: {                // 仅追溯，Agent 不读业务分支
    caseId?: string;
    stepId?: string;
    stepOrder?: number;
    [key: string]: unknown;
  };
}

interface CompileCaseOptions {
  prompt?: string;            // 可选额外 prompt
}
```

### 2.2 内置 Compiler

```ts
interface LlmInstructionCompilerPort {
  compile(
    input: CompileCaseInput,
    options?: CompileCaseOptions,
  ): Promise<CompileOutput>;  // { instruction, report }
}
```

流程：

1. 将 `caseText` + `prompt?` 推给 LLM（要求输出 `InstructionDraft` JSON）
2. 解析 Draft → 映射为 Agent `Instruction`
3. `InstructionValidator` 校验 Draft / Instruction
4. 有 error → `COMPILE_REJECTED`；LLM 失败 → `COMPILE_LLM_FAILED`

### 2.3 Validator

```ts
interface InstructionValidatorPort {
  validateDraft(draft: InstructionDraft): CompileIssue[];
  validateInstruction(instruction: Instruction): CompileIssue[];
}
```

本地、确定性、无 LLM。LLM 不权威。

### 2.4 Draft / Report

`InstructionDraft`：`preconditions` + `actions[]` + `expectation`（+ 可选 hints/timeoutMs）  
`CompileReport`：`ok` + `issues[]` + 可选 `draft`

质量约定（Validator 与 LLM prompt 共用）：

- `expectation`：Judge 唯一、可截图核验的成功标准
- `actions`：Midscene 可执行的原子意图 → 写入 `Instruction.hints`
- `preconditions`：开始前状态，非操作过程

## 3. 与阶段一规则 compile 的关系

| | 规则 `InstructionCompilerPort` | LLM `LlmInstructionCompilerPort` |
|--|-------------------------------|----------------------------------|
| 输入 | Catalog `CaseDefinition` + stepOrder | `CompileCaseInput` |
| 方式 | 同步字段映射 | LLM + Validator |
| 用途 | 现网 CaseRun / 演示 | 业务异构 Case → 友好 Instruction |

二者并存；CaseRun 何时切到 LLM compile 由组装层决定。

## 4. HTTP

| 路由 | 说明 |
|------|------|
| `POST /api/cases/:caseId/compile` | 阶段一规则 compile |
| `POST /api/compile` | body = `CompileCaseInput & { prompt? }` → `CompileOutput`（实现待补 → 501） |
| `POST /api/connector/cases/:caseId/compile` | 业务库切步 + LLM 编译（经 Remote → `:4103/.../compile`） |

## 5. 非目标

- 在 domain-case 内做多格式 Adapter / NormalizedCase / 切步 Segmenter
- Binding / Context / Registry
- Case 域本地业务 judge（仍以 Agent `InstructionResult.satisfied` 为准）

## 6. DataConnector（外部用例库）

domain-case **不解析** CSV；由业务 Adapter 实现 `CaseDataSourcePort`，再 `createCaseDataConnector().connect(source)`。

| 能力 | 说明 |
|------|------|
| list / outline / getCase | 按需读取 |
| getCompiled / getInstructions | 使用业务已持久化的 Instruction（不触发编译） |
| syncCompiled | 业务编译结果回写外部源 |

HTTP：`/api/connector/*`（case-service 门面）→ 远端业务库协议 `caseLibraryPaths`（`packages/domain-case/src/protocol/case-library-http.ts`）。

业务实现：`business/cowork-csv`（Adapter + 独立 HTTP `:4103`）。主工程只经 `createRemoteCaseDataSource({ baseUrl })` 连接。
