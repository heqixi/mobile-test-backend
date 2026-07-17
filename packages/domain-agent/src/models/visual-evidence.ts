/**
 * @module @mtp/domain-agent/models/visual-evidence
 *
 * Agent 侧 Visual Evidence / Expectation 锚定模型（Prompt 素材 + 落盘附件）。
 */

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VisualEvidenceRegion {
  id: string;
  phrase: string;
  label: string;
  role?: 'precondition' | 'expectation' | 'hint' | 'action' | 'custom';
  color?: string;
  locateOk: boolean;
  rectPx?: PixelRect;
  center?: [number, number];
  quality?: 'bbox' | 'point_fallback';
  error?: string;
}

export interface VisualEvidence {
  evidenceId: string;
  episodeId: string;
  instructionId: string;
  phase: 'judge' | 'act' | 'on_demand';
  capturedAt: string;
  screenshot: {
    mime: 'image/png';
    dataUrl?: string;
    width?: number;
    height?: number;
  };
  annotated: {
    dataUrl?: string;
    width?: number;
    height?: number;
  };
  regions: VisualEvidenceRegion[];
  textEvidence?: string;
  judgeSatisfied?: boolean;
}

export interface StoredVisualEvidenceRegion {
  id: string;
  label: string;
  phrase: string;
  role: 'expectation' | 'precondition' | 'hint' | 'action';
  rectPx?: PixelRect;
  center?: [number, number];
  locateOk: boolean;
}

export interface StoredVisualEvidence {
  evidenceId: string;
  createdAt: string;
  source: {
    episodeId: string;
    caseId?: string;
    instructionId: string;
    round?: number;
  };
  review: {
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: string;
    reviewer?: string;
    note?: string;
  };
  /**
   * 链式验证：本步成功态是下一步的初始条件。
   * 仅当 successor Instruction 也成功时，candidate → golden（true_positive）；
   * successor 失败则视为 false_positive，不得作 Replay 参考。
   */
  validation?: {
    status: 'awaiting_successor' | 'true_positive' | 'false_positive';
    successorInstructionId?: string;
    validatedAt?: string;
    note?: string;
  };
  assets: {
    screenshotDataUrl?: string;
    annotatedDataUrl?: string;
    /** 浏览器可加载的 HTTP 图（优先展示，避免 metadata 塞大 base64） */
    imageHttpUrl?: string;
    localPath?: string;
    fileUrl?: string;
    width?: number;
    height?: number;
  };
  regions: StoredVisualEvidenceRegion[];
  textEvidence?: string;
  judgeReason?: string;
}

/** Instruction.metadata.expectationEvidence — 本步 Expectation 的视觉证据 */
export interface ExpectationEvidenceBinding {
  expectationSnapshot: string;
  golden?: StoredVisualEvidence;
  candidate?: StoredVisualEvidence;
  history?: StoredVisualEvidence[];
}

/**
 * Instruction.metadata.preconditionEvidence —
 * 上一步 Instruction 的 Golden，作为本步 PreCondition 视觉参考。
 */
export interface PreconditionEvidenceBinding {
  sourceInstructionId: string;
  /** 上一步 expectation 文案（即本步应具备的初始态描述） */
  sourceExpectationSnapshot?: string;
  golden: StoredVisualEvidence;
}

export function readExpectationEvidence(
  metadata?: Record<string, unknown>,
): ExpectationEvidenceBinding | undefined {
  const raw = metadata?.expectationEvidence;
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as ExpectationEvidenceBinding;
}

export function readPreconditionEvidence(
  metadata?: Record<string, unknown>,
): PreconditionEvidenceBinding | undefined {
  const raw = metadata?.preconditionEvidence;
  if (!raw || typeof raw !== 'object') return undefined;
  const b = raw as PreconditionEvidenceBinding;
  if (!b.golden || !b.sourceInstructionId) return undefined;
  return b;
}

export function isCaseTailInstruction(
  metadata?: Record<string, unknown>,
): boolean {
  return metadata?.isLastInstruction === true;
}

function hasEvidenceImage(s?: StoredVisualEvidence): boolean {
  return Boolean(
    s?.assets?.screenshotDataUrl ||
      s?.assets?.annotatedDataUrl ||
      s?.assets?.imageHttpUrl ||
      s?.assets?.localPath,
  );
}

/**
 * Expectation Replay 参考：仅 Golden（true_positive / case_tail）。
 * Candidate / false_positive 不得注入 act。
 */
export function resolveReferenceEvidence(
  binding?: ExpectationEvidenceBinding,
): StoredVisualEvidence | undefined {
  if (!binding?.golden || !hasEvidenceImage(binding.golden)) return undefined;
  if (binding.golden.review.status === 'rejected') return undefined;
  if (binding.golden.validation?.status === 'false_positive') return undefined;
  return binding.golden;
}

/** PreCondition Replay 参考：上一步 Golden */
export function resolvePreconditionEvidence(
  binding?: PreconditionEvidenceBinding,
): StoredVisualEvidence | undefined {
  if (!binding?.golden || !hasEvidenceImage(binding.golden)) return undefined;
  if (binding.golden.review.status === 'rejected') return undefined;
  if (binding.golden.validation?.status === 'false_positive') return undefined;
  return binding.golden;
}

/** Judge 成功 → candidate（待下游验证） */
export function bindJudgeSuccessAsCandidate(
  binding: ExpectationEvidenceBinding | undefined,
  stored: StoredVisualEvidence,
  expectationSnapshot: string,
): ExpectationEvidenceBinding {
  return {
    ...(binding ?? { expectationSnapshot }),
    expectationSnapshot,
    candidate: {
      ...stored,
      review: {
        status: 'pending',
        note: stored.review.note ?? 'awaiting successor instruction success',
      },
      validation: {
        status: 'awaiting_successor',
        note: '本步成功态是下一步初始条件；待下游 Instruction 成功后升为 Golden',
      },
    },
  };
}

/** 末步 Judge 成功 → 直接 Golden（无需下游） */
export function bindJudgeSuccessAsCaseTailGolden(
  binding: ExpectationEvidenceBinding | undefined,
  stored: StoredVisualEvidence,
  expectationSnapshot: string,
): ExpectationEvidenceBinding {
  const now = new Date().toISOString();
  const history = [
    ...(binding?.history ?? []),
    ...(binding?.golden ? [binding.golden] : []),
  ];
  return {
    ...(binding ?? { expectationSnapshot }),
    expectationSnapshot,
    golden: {
      ...stored,
      review: {
        status: 'approved',
        reviewedAt: now,
        reviewer: 'case-tail',
        note: 'last instruction — no successor required',
      },
      validation: {
        status: 'true_positive',
        validatedAt: now,
        note: '末步无需下游验证；Judge 成功即 Golden',
      },
    },
    candidate: undefined,
    history,
  };
}

/** 下游 Instruction 成功 → 将上一步 candidate 升为 Golden（true_positive） */
export function promoteCandidateToGolden(
  binding: ExpectationEvidenceBinding | undefined,
  successorInstructionId: string,
): ExpectationEvidenceBinding | undefined {
  if (!binding?.candidate) return binding;
  if (binding.candidate.validation?.status === 'false_positive') return binding;
  const history = [
    ...(binding.history ?? []),
    ...(binding.golden ? [binding.golden] : []),
  ];
  const now = new Date().toISOString();
  const golden: StoredVisualEvidence = {
    ...binding.candidate,
    review: {
      status: 'approved',
      reviewedAt: now,
      reviewer: 'successor-instruction',
      note: `validated by successor ${successorInstructionId}`,
    },
    validation: {
      status: 'true_positive',
      successorInstructionId,
      validatedAt: now,
      note: '下游 Instruction 成功，确认本步 VisualEvidence 为 true-positive',
    },
  };
  return {
    ...binding,
    golden,
    candidate: undefined,
    history,
  };
}

/** 下游 Instruction 失败 → 上一步 candidate 标为 false_positive */
export function markCandidateFalsePositive(
  binding: ExpectationEvidenceBinding | undefined,
  successorInstructionId: string,
  reason?: string,
): ExpectationEvidenceBinding | undefined {
  if (!binding?.candidate) return binding;
  const now = new Date().toISOString();
  return {
    ...binding,
    candidate: {
      ...binding.candidate,
      review: {
        ...binding.candidate.review,
        status: 'rejected',
        reviewedAt: now,
        reviewer: 'successor-instruction',
        note: reason?.slice(0, 200) ?? 'successor instruction failed',
      },
      validation: {
        status: 'false_positive',
        successorInstructionId,
        validatedAt: now,
        note: '下游 Instruction 失败；本步 Judge 成功截图可能为 false-positive，不作 Golden',
      },
    },
  };
}


export function visualEvidenceToStored(
  ve: VisualEvidence,
  opts: {
    caseId?: string;
    round?: number;
    judgeReason?: string;
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewer?: string;
    reviewNote?: string;
    validation?: StoredVisualEvidence['validation'];
    /** 落盘后的轻量引用（优先写入，可省略大 base64） */
    assets?: Partial<StoredVisualEvidence['assets']>;
    /** 默认 false：有 http/local 时不把整图 base64 写入 metadata */
    embedScreenshotDataUrl?: boolean;
  },
): StoredVisualEvidence {
  const light = opts.assets ?? {};
  const embed =
    opts.embedScreenshotDataUrl === true ||
    (!light.imageHttpUrl && !light.localPath);
  return {
    evidenceId: ve.evidenceId,
    createdAt: ve.capturedAt,
    source: {
      episodeId: ve.episodeId,
      caseId: opts.caseId,
      instructionId: ve.instructionId,
      round: opts.round,
    },
    review: {
      status: opts.reviewStatus ?? 'pending',
      reviewer: opts.reviewer,
      note: opts.reviewNote,
      reviewedAt:
        opts.reviewStatus === 'approved' || opts.reviewStatus === 'rejected'
          ? new Date().toISOString()
          : undefined,
    },
    validation: opts.validation,
    assets: {
      screenshotDataUrl: embed ? ve.screenshot.dataUrl : undefined,
      annotatedDataUrl: embed ? ve.annotated.dataUrl : light.annotatedDataUrl,
      imageHttpUrl: light.imageHttpUrl,
      localPath: light.localPath,
      fileUrl: light.fileUrl,
      width: ve.annotated.width ?? ve.screenshot.width,
      height: ve.annotated.height ?? ve.screenshot.height,
    },
    regions: ve.regions.map((r) => ({
      id: r.id,
      label: r.label,
      phrase: r.phrase,
      role:
        r.role === 'precondition' || r.role === 'hint' || r.role === 'action'
          ? r.role
          : 'expectation',
      rectPx: r.rectPx,
      center: r.center,
      locateOk: r.locateOk,
    })),
    textEvidence: ve.textEvidence,
    judgeReason: opts.judgeReason,
  };
}
