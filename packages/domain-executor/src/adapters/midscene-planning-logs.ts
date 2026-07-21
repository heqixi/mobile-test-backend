/**
 * 给 Midscene planning 打诊断日志：原始输出 → 解析后的 action/command。
 * 用于排查 LLM 只吐出 action-type（如 Tap/tab）却缺少 locate/target 的情况。
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

let installed = false;

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function loadLlmPlanningModule(require: NodeRequire): {
  plan: (...args: unknown[]) => Promise<Record<string, unknown>>;
} {
  // 经 @midscene/core 主入口定位 dist/lib，再加载同目录 llm-planning（绕过 exports 限制）
  const coreEntry = require.resolve('@midscene/core');
  const libRoot = dirname(coreEntry);
  return require(join(libRoot, 'ai-model/llm-planning.js')) as {
    plan: (...args: unknown[]) => Promise<Record<string, unknown>>;
  };
}

/**
 * Monkey-patch Midscene `plan()`，每次规划后打印：
 * - 用户指令（aiAct prompt）
 * - rawResponse（模型原始文本/XML）
 * - rawChoiceMessage（含 tool_calls 时完整输出）
 * - 解析后的 actions（type + param）
 */
export function installMidscenePlanningLogs(): void {
  if (installed) return;
  installed = true;

  try {
    const require = createRequire(import.meta.url);
    const llmPlanning = loadLlmPlanningModule(require);
    const originalPlan = llmPlanning.plan.bind(llmPlanning);

    llmPlanning.plan = async (...args: unknown[]) => {
      const instruction =
        typeof args[0] === 'string' ? args[0] : safeJson(args[0]);
      console.log('[midscene-planning] ========== plan ==========');
      console.log(
        '[midscene-planning] 1) user instruction (aiAct prompt):',
        instruction,
      );
      try {
        const result = await originalPlan(...args);

        console.log(
          '[midscene-planning] 2) model rawResponse (原始输出):\n',
          typeof result.rawResponse === 'string'
            ? result.rawResponse
            : safeJson(result.rawResponse),
        );
        console.log(
          '[midscene-planning] 3) model rawChoiceMessage (tool_calls 等):\n',
          safeJson(result.rawChoiceMessage ?? null),
        );

        const actions =
          result.actions ?? (result.action ? [result.action] : []);
        console.log(
          '[midscene-planning] 4) parsed actions (解析后的命令):\n',
          safeJson(actions),
        );

        for (const action of Array.isArray(actions) ? actions : []) {
          if (!action || typeof action !== 'object') continue;
          const a = action as { type?: string; param?: unknown };
          const param = a.param;
          const hasLocate =
            param != null &&
            typeof param === 'object' &&
            ('locate' in (param as object) ||
              'target' in (param as object) ||
              'prompt' in (param as object));
          if (a.type && param == null) {
            console.warn(
              `[midscene-planning] ⚠ incomplete action: type=${a.type} but param/locate/target missing`,
            );
          } else if (
            a.type &&
            param != null &&
            typeof param === 'object' &&
            !('locate' in (param as object)) &&
            /tap/i.test(String(a.type))
          ) {
            console.warn(
              `[midscene-planning] ⚠ Tap-like action without locate: type=${a.type} param=${safeJson(param)}`,
            );
          } else if (a.type && !hasLocate && /tap/i.test(String(a.type))) {
            console.warn(
              `[midscene-planning] ⚠ Tap-like action may be incomplete: type=${a.type} param=${safeJson(param)}`,
            );
          }
        }

        if (result.thought || result.log || result.error) {
          console.log('[midscene-planning] 5) thought/log/error:', {
            thought: result.thought,
            log: result.log,
            error: result.error,
            finalizeSuccess: result.finalizeSuccess,
            finalizeMessage: result.finalizeMessage,
          });
        }
        console.log('[midscene-planning] ========== plan end ==========');
        return result;
      } catch (error) {
        const err = error as {
          message?: string;
          rawResponse?: unknown;
          rawChoiceMessage?: unknown;
        };
        console.error(
          '[midscene-planning] ✖ plan failed:',
          err?.message ?? error,
        );
        if (err?.rawResponse != null) {
          console.error(
            '[midscene-planning] ✖ rawResponse:\n',
            err.rawResponse,
          );
        }
        if (err?.rawChoiceMessage != null) {
          console.error(
            '[midscene-planning] ✖ rawChoiceMessage:\n',
            safeJson(err.rawChoiceMessage),
          );
        }
        console.log(
          '[midscene-planning] ========== plan end (error) ==========',
        );
        throw error;
      }
    };

    console.log(
      '[domain-executor] Midscene planning logs installed (raw → parsed actions)',
    );
  } catch (error) {
    installed = false;
    console.warn(
      '[domain-executor] Failed to install Midscene planning logs:',
      error instanceof Error ? error.message : error,
    );
  }
}
