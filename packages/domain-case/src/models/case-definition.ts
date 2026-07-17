/**
 * @module @mtp/domain-case/case-definition
 *
 * Case 域只读用例定义（阶段一 Catalog / CaseRun）。
 * 来源可为 CSV loader 等；**运行中不可被 CaseRun 修改**。
 *
 * 阶段一 **不包含** CaseBinding、CaseContext、StateRegistry。
 * 业务异构数据源 → 业务 Adapter → `CompileCaseInput` → LLM Compiler（见 llm-instruction-compiler-port）。
 */

/**
 * 用例中的一个步骤。
 * `order` 为 1-based。
 */
export interface CaseStep {
  /**
   * 稳定步骤 id，建议 `step-{order}`。
   * 写入 Instruction.metadata.stepId。
   */
  stepId: string;

  /** 步骤序号，从 1 开始 */
  order: number;

  /**
   * 步骤业务意图（自然语言）。
   * 阶段一 `compile_instruction` 将其原样填入 Instruction.expectation。
   */
  intent: string;
}

/**
 * 完整用例定义（只读知识）。
 */
export interface CaseDefinition {
  /** 稳定用例 id */
  caseId: string;

  /** 人类可读标题 */
  title: string;

  /**
   * 用例级前置条件（可选）。
   * compile 时写入 Instruction.preconditions。
   */
  preconditions?: string;

  /** 有序步骤列表 */
  steps: CaseStep[];

  /**
   * 用例级验收描述列表。
   * 阶段一 simple-compiler 可选编入 Instruction.hints；不参与 Agent 本地 judge。
   */
  expected: string[];

  priority: string;
  categories: string[];
}

/**
 * 用例目录列表项（`GET /api/cases`）。
 * 不含完整 steps，减少 payload。
 */
export interface CaseSummary {
  caseId: string;
  title: string;
  priority: string;
  stepCount: number;
}
