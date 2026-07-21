/**
 * @module @mtp/domain-case/service/llm-instruction-compiler
 *
 * LlmInstructionCompiler：CompileCaseInput → OpenCode → Draft → Validator → Instruction。
 */

import { randomUUID } from 'node:crypto';
import type { Instruction } from '@mtp/domain-agent';
import {
  createOpenCodeHttpClient,
  extractAssistantText,
  type OpenCodeHttpClient,
  type OpenCodeHttpOptions,
} from '@mtp/domain-agent';
import { CaseDomainError } from '../errors.js';
import type {
  CompileCaseInput,
  CompileCaseOptions,
} from '../models/compile-case-input.js';
import type { CompileReport } from '../models/compile-report.js';
import type { InstructionDraft } from '../models/instruction-draft.js';
import type {
  CompileOutput,
  LlmInstructionCompilerPort,
} from '../ports/llm-instruction-compiler-port.js';
import type { InstructionValidatorPort } from '../ports/instruction-validator-port.js';
import { createInstructionValidator } from './instruction-validator.js';

export interface CreateLlmInstructionCompilerOptions {
  client?: OpenCodeHttpClient;
  openCode?: OpenCodeHttpOptions;
  model?: { providerID: string; modelID: string };
  validator?: InstructionValidatorPort;
  systemPrompt?: string;
  /** 校验失败时额外重试次数（默认 1） */
  maxRepairAttempts?: number;
}

const DEFAULT_SYSTEM_PROMPT = `你是移动端 UI 自动化测试的 Instruction 编译器。
根据用户给出的**单步**用例正文，输出 **唯一一个** JSON 对象（不要 markdown 围栏，不要额外说明），形状如下：
{
  "preconditions": "本步开始前的界面/权限状态（非操作过程）",
  "actions": ["面向 Midscene 的原子操作意图1"],
  "expectation": "本步结束后可截图核验的唯一成功标准",
  "hints": ["可选补充提示"],
  "timeoutMs": 60000
}

硬性要求：
1. actions 必须是非空字符串数组，至少 1 条；只覆盖「当前这一步」的操作，禁止把整案其它步骤写进来
2. expectation 必须可观测、可判定，写本步完成后的**界面结果/控件角色**，不要只复述操作动词
3. expectation 禁止写死单一厂商/单一文案的按钮字；应写页面类型 + 控件角色（主确认、取消/关闭、重试等），必要时注明「文案因设备/语言可能不同」
4. preconditions 只描述开始前状态，不是操作过程
5. 不要发明输入里未给出的步骤或结果
6. 若输入给了「本步操作意图」原文，actions 应直接落实该意图（可拆成 1～3 条原子动作）`;

function resolveOpenCodeModel(
  explicit?: { providerID: string; modelID: string },
): { providerID: string; modelID: string } {
  if (explicit?.providerID && explicit?.modelID) return explicit;
  const providerID =
    process.env.OPENCODE_PROVIDER_ID?.trim() ||
    process.env.MTP_OPENCODE_PROVIDER_ID?.trim() ||
    '';
  const modelID =
    process.env.OPENCODE_MODEL_ID?.trim() ||
    process.env.MTP_OPENCODE_MODEL_ID?.trim() ||
    process.env.MIDSCENE_MODEL_NAME?.trim() ||
    '';
  if (!providerID || !modelID) {
    throw new Error(
      'OpenCode model not configured. Set OPENCODE_PROVIDER_ID and OPENCODE_MODEL_ID in .env (see .env.example). Optional: MIDSCENE_MODEL_NAME as modelID fallback.',
    );
  }
  return { providerID, modelID };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const body = fence ? fence[1]!.trim() : trimmed;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('No JSON object found in LLM response');
  }
  return JSON.parse(body.slice(start, end + 1)) as unknown;
}

function coerceStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((a) => (typeof a === 'string' ? a : String(a ?? '')).trim())
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n|;|；/)
      .map((s) => s.replace(/^\s*[-*\d]+[.、)]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function asDraft(
  raw: unknown,
  fallbackAction?: string,
): InstructionDraft {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Draft is not an object');
  }
  const o = raw as Record<string, unknown>;
  let actions = coerceStringList(o.actions);
  if (actions.length === 0) {
    actions = coerceStringList(o.action);
  }
  if (actions.length === 0 && fallbackAction?.trim()) {
    actions = [fallbackAction.trim()];
  }
  const hints = coerceStringList(o.hints);
  return {
    preconditions: typeof o.preconditions === 'string' ? o.preconditions : '',
    actions,
    expectation: typeof o.expectation === 'string' ? o.expectation : '',
    hints: hints.length ? hints : undefined,
    timeoutMs:
      typeof o.timeoutMs === 'number' && Number.isFinite(o.timeoutMs)
        ? o.timeoutMs
        : undefined,
  };
}

export function draftToInstruction(
  draft: InstructionDraft,
  metadata?: CompileCaseInput['metadata'],
): Instruction {
  const actions = (draft.actions ?? [])
    .map((a) => a.trim())
    .filter(Boolean);
  const hints = (draft.hints ?? [])
    .map((h) => h.trim())
    .filter(Boolean);

  return {
    instructionId: randomUUID(),
    expectation: draft.expectation.trim(),
    preconditions: draft.preconditions.trim() || undefined,
    actions: actions.length ? actions : undefined,
    hints: hints.length ? hints : undefined,
    timeoutMs: draft.timeoutMs,
    metadata: {
      ...metadata,
      expectationSource: 'llm',
      sourceTag: 'llm',
    },
  };
}

function hasErrorIssues(issues: CompileReport['issues']): boolean {
  return issues.some((i) => i.severity === 'error');
}

/**
 * 创建 LLM Instruction Compiler（对接 OpenCode）。
 */
export function createLlmInstructionCompiler(
  options: CreateLlmInstructionCompilerOptions = {},
): LlmInstructionCompilerPort {
  const client =
    options.client ?? createOpenCodeHttpClient(options.openCode);
  const validator = options.validator ?? createInstructionValidator();
  const model = resolveOpenCodeModel(options.model);
  const systemPrompt = options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const maxRepairAttempts = options.maxRepairAttempts ?? 1;

  async function askLlm(
    sessionId: string,
    userText: string,
    withSystem: boolean,
  ): Promise<string> {
    const reply = await client.postText(sessionId, userText, {
      system: withSystem ? systemPrompt : undefined,
      model,
    });
    const rawText = extractAssistantText(reply);
    if (!rawText.trim()) {
      throw new Error('Empty LLM response');
    }
    return rawText;
  }

  return {
    async compile(
      input: CompileCaseInput,
      compileOptions?: CompileCaseOptions,
    ): Promise<CompileOutput> {
      const stepText =
        typeof input.metadata?.stepText === 'string'
          ? input.metadata.stepText
          : undefined;

      let sessionId: string;
      try {
        const session = await client.createSession({
          title: `compile:${input.metadata?.caseId ?? 'case'}:${input.metadata?.stepOrder ?? '?'}`,
        });
        sessionId = session.id;
      } catch (error) {
        throw new CaseDomainError(
          'COMPILE_LLM_FAILED',
          error instanceof Error ? error.message : String(error),
          {
            retryable: true,
            details: {
              caseId: input.metadata?.caseId,
              stepOrder: input.metadata?.stepOrder,
            },
          },
        );
      }

      const baseUser = [
        '请将以下单步用例编译为 InstructionDraft JSON。',
        'actions 必须是非空字符串数组。',
        '',
        input.caseText.trim(),
      ];
      if (compileOptions?.prompt?.trim()) {
        baseUser.push('', '补充说明：', compileOptions.prompt.trim());
      }

      let rawText: string;
      try {
        rawText = await askLlm(sessionId, baseUser.join('\n'), true);
      } catch (error) {
        if (error instanceof CaseDomainError) throw error;
        throw new CaseDomainError(
          'COMPILE_LLM_FAILED',
          error instanceof Error ? error.message : String(error),
          {
            retryable: true,
            details: {
              caseId: input.metadata?.caseId,
              stepOrder: input.metadata?.stepOrder,
            },
          },
        );
      }

      let lastRejectMessage = '';
      let lastDetails: Record<string, unknown> | undefined;

      for (let attempt = 0; attempt <= maxRepairAttempts; attempt++) {
        let draft: InstructionDraft;
        try {
          draft = asDraft(extractJsonObject(rawText), stepText);
        } catch (error) {
          lastRejectMessage =
            error instanceof Error ? error.message : String(error);
          lastDetails = {
            code: 'DRAFT_PARSE_FAILED',
            rawPreview: rawText.slice(0, 400),
            attempt,
          };
          if (attempt >= maxRepairAttempts) break;
          try {
            rawText = await askLlm(
              sessionId,
              [
                '上一次输出无法解析为 JSON。请只输出合法 JSON 对象，字段含 preconditions、actions（非空数组）、expectation。',
                `解析错误：${lastRejectMessage}`,
              ].join('\n'),
              false,
            );
          } catch (llmErr) {
            throw new CaseDomainError(
              'COMPILE_LLM_FAILED',
              llmErr instanceof Error ? llmErr.message : String(llmErr),
              { retryable: true, details: { attempt } },
            );
          }
          continue;
        }

        const draftIssues = validator.validateDraft(draft);
        if (hasErrorIssues(draftIssues)) {
          lastRejectMessage = draftIssues
            .filter((i) => i.severity === 'error')
            .map((i) => i.message)
            .join('; ');
          lastDetails = { issues: draftIssues, draft, attempt };
          if (attempt >= maxRepairAttempts) break;
          try {
            rawText = await askLlm(
              sessionId,
              [
                '上一次 Draft 未通过校验，请重新输出完整 JSON。',
                `校验失败：${lastRejectMessage}`,
                '记住：actions 必须是至少含 1 条字符串的数组；只编译当前这一步。',
                stepText ? `本步操作意图原文：${stepText}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
              false,
            );
          } catch (llmErr) {
            throw new CaseDomainError(
              'COMPILE_LLM_FAILED',
              llmErr instanceof Error ? llmErr.message : String(llmErr),
              { retryable: true, details: { attempt } },
            );
          }
          continue;
        }

        const instruction = draftToInstruction(draft, input.metadata);
        const instructionIssues = validator.validateInstruction(instruction);
        const issues = [...draftIssues, ...instructionIssues];
        if (hasErrorIssues(instructionIssues)) {
          lastRejectMessage = instructionIssues
            .filter((i) => i.severity === 'error')
            .map((i) => i.message)
            .join('; ');
          lastDetails = { issues, draft, attempt };
          if (attempt >= maxRepairAttempts) break;
          continue;
        }

        return {
          instruction,
          report: {
            ok: !hasErrorIssues(issues),
            issues,
            draft,
          },
        };
      }

      throw new CaseDomainError('COMPILE_REJECTED', lastRejectMessage, {
        details: lastDetails,
      });
    },
  };
}
