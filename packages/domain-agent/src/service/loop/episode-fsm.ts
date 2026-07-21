/**
 * @module @mtp/domain-agent/service/loop/episode-fsm
 *
 * Plan ↔ Act 转移矩阵（纯函数 SSOT）。
 */

import type { EpisodeStatus, PlanStrategy } from '../../models/turns.js';

export type PlanResult = PlanStrategy;
export type ActResult = 'success' | 'failure';

export interface FsmLimits {
  maxPlanRounds: number;
  maxRecovery: number;
  maxIllegalRepairs: number;
  maxActFailures: number;
}

export interface PlanTransitionInput {
  strategy: PlanResult;
  /** 校验通过后的 command；act/recovery 必填 */
  command?: string;
  evidence: string;
  planRound: number;
  consecutiveRecovery: number;
  limits: FsmLimits;
}

export type FsmTransition =
  | {
      next: 'act';
      planIntent: 'act' | 'recovery';
      pendingCommand: string;
      consecutiveRecovery: number;
      planRound: number;
    }
  | {
      next: 'plan';
      /** 相位内应再 repair；调用方处理 */
      needRepair: true;
      reason: string;
    }
  | {
      next: 'completed';
      evidence: string;
      planRound: number;
      consecutiveRecovery: number;
    }
  | {
      next: 'failed';
      reason: string;
      planRound: number;
      consecutiveRecovery: number;
      stopDevice?: boolean;
    };

export type ActTransition =
  | {
      next: 'plan';
      actResult: ActResult;
      consecutiveActFailures: number;
    }
  | {
      next: 'failed';
      reason: string;
      consecutiveActFailures: number;
      stopDevice: true;
    };

export function isTerminalStatus(status: EpisodeStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'aborted'
  );
}

/**
 * Plan × PlanResult → 下一控制态。
 * `illegal` 在调用方 repair 耗尽前不应调用本函数（或传入后得到 failed）。
 */
export function transitionFromPlan(input: PlanTransitionInput): FsmTransition {
  const {
    strategy,
    command,
    evidence,
    planRound,
    consecutiveRecovery,
    limits,
  } = input;
  const nextRound = planRound + 1;

  if (nextRound > limits.maxPlanRounds) {
    return {
      next: 'failed',
      reason: `plan rounds exceeded limit ${limits.maxPlanRounds}: ${evidence}`,
      planRound: nextRound,
      consecutiveRecovery,
      stopDevice: true,
    };
  }

  if (strategy === 'pass') {
    return {
      next: 'completed',
      evidence,
      planRound: nextRound,
      consecutiveRecovery: 0,
    };
  }

  if (strategy === 'fail') {
    return {
      next: 'failed',
      reason: evidence,
      planRound: nextRound,
      consecutiveRecovery: 0,
      stopDevice: true,
    };
  }

  if (strategy === 'illegal') {
    return {
      next: 'plan',
      needRepair: true,
      reason: evidence || 'illegal plan strategy',
    };
  }

  if (strategy === 'act' || strategy === 'recovery') {
    const cmd = (command ?? '').trim();
    if (!cmd) {
      return {
        next: 'plan',
        needRepair: true,
        reason: `strategy=${strategy} requires a Midscene command`,
      };
    }

    if (strategy === 'recovery') {
      const recovery = consecutiveRecovery + 1;
      if (recovery > limits.maxRecovery) {
        return {
          next: 'failed',
          reason: `recovery ${recovery} consecutive times (limit ${limits.maxRecovery}): ${evidence}`,
          planRound: nextRound,
          consecutiveRecovery: recovery,
          stopDevice: true,
        };
      }
      return {
        next: 'act',
        planIntent: 'recovery',
        pendingCommand: cmd,
        consecutiveRecovery: recovery,
        planRound: nextRound,
      };
    }

    return {
      next: 'act',
      planIntent: 'act',
      pendingCommand: cmd,
      consecutiveRecovery: 0,
      planRound: nextRound,
    };
  }

  return {
    next: 'failed',
    reason: `unknown plan strategy: ${String(strategy)}`,
    planRound: nextRound,
    consecutiveRecovery,
    stopDevice: true,
  };
}

/**
 * Act × ActResult → 下一控制态。
 * 默认成败都回 plan；连续 failure 超限 → failed。
 */
export function transitionFromAct(input: {
  actResult: ActResult;
  consecutiveActFailures: number;
  limits: FsmLimits;
  error?: string;
}): ActTransition {
  if (input.actResult === 'success') {
    return {
      next: 'plan',
      actResult: 'success',
      consecutiveActFailures: 0,
    };
  }

  const failures = input.consecutiveActFailures + 1;
  if (failures >= input.limits.maxActFailures) {
    return {
      next: 'failed',
      reason: `act failed ${failures} consecutive times (limit ${input.limits.maxActFailures}): ${input.error ?? 'unknown'}`,
      consecutiveActFailures: failures,
      stopDevice: true,
    };
  }

  return {
    next: 'plan',
    actResult: 'failure',
    consecutiveActFailures: failures,
  };
}
