/**
 * @module @mtp/business-cowork-csv
 *
 * 外部业务 Adapter：读取本包 `data/` 下的用例 CSV，实现 CaseDataSourcePort。
 * 按 CSV **实际列名** 建索引解析（见 COWORK_CSV_COLUMNS）。
 * 编译 sidecar / Midscene reports 与 CSV 同级，由本业务维护；domain-case 只经 HTTP 协议交互。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import type {
  CaseDataSourceListFilter,
  CaseDataSourcePort,
  ConnectedCaseDetail,
  ConnectedCaseOutline,
  ConnectedCompiledBundle,
} from '@mtp/domain-case';
import { CaseDomainError } from '@mtp/domain-case';
import {
  COWORK_CSV_COLUMNS,
  makeCoworkCaseId,
  parseCsv,
  stripBom,
} from './csv-io.js';
import { reorderCoworkCsvRows } from './reorder-cases.js';

export {
  COWORK_CSV_COLUMNS,
  makeCoworkCaseId,
  parseCsv,
  serializeCsv,
  stripBom,
} from './csv-io.js';
export { reorderCoworkCsvRows } from './reorder-cases.js';
export {
  coworkCsvPackageRoot,
  coworkCsvDataDir,
  defaultCoworkCsvPath,
} from './paths.js';

const DIR_COUNT = 15;

export interface CoworkCsvRow {
  caseId: string;
  title: string;
  path: string[];
  preconditions: string;
  stepsText: string;
  expectedText: string;
  priority: string;
  rowIndex: number;
  /** 原始列名 → 单元格（供 JSON 预览） */
  sourceFields: Record<string, string>;
}

type CompiledStore = Record<string, ConnectedCompiledBundle>;

/** 列名 → 首次出现的下标（处理重复列名：截图/备注 取首次） */
function buildColumnIndex(header: string[]): Map<string, number> {
  const index = new Map<string, number>();
  for (let i = 0; i < header.length; i++) {
    const name = stripBom(header[i] ?? '').trim();
    if (!name) continue;
    if (!index.has(name)) index.set(name, i);
  }
  return index;
}

function cellAt(
  index: Map<string, number>,
  row: string[],
  name: string,
): string {
  const i = index.get(name);
  if (i == null) return '';
  return (row[i] ?? '').trim();
}

function buildPath(index: Map<string, number>, row: string[]): string[] {
  const path: string[] = [];
  for (let d = 1; d <= DIR_COUNT; d++) {
    const v = cellAt(index, row, `目录${d}`);
    if (v) path.push(v);
  }
  return path;
}

/** 按表头原样导出一行（重复列名加后缀） */
function buildSourceFields(
  header: string[],
  row: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  const seen = new Map<string, number>();
  for (let i = 0; i < header.length; i++) {
    let name = stripBom(header[i] ?? '').trim();
    if (!name) continue;
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    if (n > 1) name = `${name}#${n}`;
    const value = (row[i] ?? '').trim();
    if (value) out[name] = value;
  }
  return out;
}

function makeCaseId(title: string, path: string[], caseNo?: string): string {
  return makeCoworkCaseId(title, path, caseNo);
}

function preview(text: string, max = 120): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function buildCaseText(row: CoworkCsvRow): string {
  return [
    `标题：${row.title}`,
    row.path.length ? `目录：${row.path.join(' / ')}` : undefined,
    row.preconditions ? `前提条件：${row.preconditions}` : undefined,
    `操作步骤：\n${row.stepsText}`,
    `预期结果：\n${row.expectedText}`,
    row.priority ? `等级：${row.priority}` : undefined,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export interface CreateCoworkCsvAdapterOptions {
  /** CSV 绝对或相对路径 */
  csvPath: string;
  /** 编译产物 sidecar；默认 `<csv>.compiled.json` */
  compiledStorePath?: string;
  sourceId?: string;
  displayName?: string;
}

/**
 * 创建 Cowork CSV 数据源 Adapter。
 */
export function createCoworkCsvAdapter(
  options: CreateCoworkCsvAdapterOptions,
): CaseDataSourcePort {
  const csvPath = resolve(options.csvPath);
  const compiledStorePath =
    options.compiledStorePath ??
    join(dirname(csvPath), `${basename(csvPath)}.compiled.json`);

  const text = readFileSync(csvPath, 'utf8');
  const table = parseCsv(text);
  if (table.length < 2) {
    throw new Error(`Cowork CSV empty or invalid: ${csvPath}`);
  }

  const header = table[0]!.map((h) => stripBom(h).trim());
  const colIndex = buildColumnIndex(header);

  const required = [
    COWORK_CSV_COLUMNS.title,
    COWORK_CSV_COLUMNS.steps,
    COWORK_CSV_COLUMNS.expected,
  ] as const;
  for (const name of required) {
    if (!colIndex.has(name)) {
      throw new Error(
        `Cowork CSV missing required column 「${name}」. headers=${JSON.stringify(header)}`,
      );
    }
  }

  const rows: CoworkCsvRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const line = table[r]!;
    const title = cellAt(colIndex, line, COWORK_CSV_COLUMNS.title);
    if (!title) continue;

    const path = buildPath(colIndex, line);
    const numbered = cellAt(colIndex, line, COWORK_CSV_COLUMNS.caseNo);
    const caseId = makeCaseId(title, path, numbered);
    const sourceFields = buildSourceFields(header, line);

    rows.push({
      caseId,
      title,
      path,
      preconditions: cellAt(colIndex, line, COWORK_CSV_COLUMNS.preconditions),
      stepsText: cellAt(colIndex, line, COWORK_CSV_COLUMNS.steps),
      expectedText: cellAt(colIndex, line, COWORK_CSV_COLUMNS.expected),
      priority: cellAt(colIndex, line, COWORK_CSV_COLUMNS.priority) || 'P1',
      rowIndex: r,
      sourceFields,
    });
  }

  let orderedRows = rows;
  const byId = new Map(orderedRows.map((row) => [row.caseId, row]));

  function rebuildById(): void {
    byId.clear();
    for (const row of orderedRows) byId.set(row.caseId, row);
  }

  function loadStore(): CompiledStore {
    if (!existsSync(compiledStorePath)) return {};
    try {
      return JSON.parse(
        readFileSync(compiledStorePath, 'utf8'),
      ) as CompiledStore;
    } catch {
      return {};
    }
  }

  function saveStore(store: CompiledStore): void {
    writeFileSync(compiledStorePath, JSON.stringify(store, null, 2), 'utf8');
  }

  function requireRow(caseId: string): CoworkCsvRow {
    const row = byId.get(caseId);
    if (!row) {
      throw new CaseDomainError(
        'CASE_NOT_FOUND',
        `Cowork case not found: ${caseId}`,
        { details: { caseId } },
      );
    }
    return row;
  }

  const info = {
    sourceId: options.sourceId ?? 'cowork-csv',
    displayName:
      options.displayName ?? `Cowork CSV (${basename(csvPath)})`,
  };

  const port: CaseDataSourcePort = {
    info,

    async listCases(filter?: CaseDataSourceListFilter) {
      const store = loadStore();
      let list = orderedRows;
      if (filter?.pathPrefix?.length) {
        list = list.filter((row) =>
          filter.pathPrefix!.every((p, i) => row.path[i] === p),
        );
      }
      if (filter?.q?.trim()) {
        const q = filter.q.trim().toLowerCase();
        list = list.filter(
          (row) =>
            row.title.toLowerCase().includes(q) ||
            row.caseId.toLowerCase().includes(q) ||
            row.path.join('/').toLowerCase().includes(q),
        );
      }
      return list.map((row) => ({
        caseId: row.caseId,
        title: row.title,
        path: row.path,
        priority: row.priority,
        hasCompiled: Boolean(store[row.caseId]?.instructions?.length),
      }));
    },

    async getOutline(caseId: string): Promise<ConnectedCaseOutline> {
      const row = requireRow(caseId);
      const compiled = await port.getCompiled(caseId);
      return {
        caseId: row.caseId,
        title: row.title,
        path: row.path,
        preconditions: row.preconditions || undefined,
        stepsPreview: preview(row.stepsText),
        expectedPreview: preview(row.expectedText),
        priority: row.priority,
        hasCompiled: Boolean(compiled?.instructions?.length),
        instructionCount: compiled?.instructions?.length,
      };
    },

    async getCase(caseId: string): Promise<ConnectedCaseDetail> {
      const row = requireRow(caseId);
      const compiled = await port.getCompiled(caseId);
      const caseText = buildCaseText(row);
      return {
        caseId: row.caseId,
        title: row.title,
        path: row.path,
        preconditions: row.preconditions || undefined,
        stepsText: row.stepsText,
        expectedText: row.expectedText,
        priority: row.priority,
        hasCompiled: Boolean(compiled?.instructions?.length),
        sourceFields: row.sourceFields,
        compileInput: {
          caseText,
          metadata: {
            caseId: row.caseId,
            stepId: 'step-1',
            stepOrder: 1,
            source: 'cowork-csv',
            title: row.title,
            path: row.path,
          },
        },
      };
    },

    async getCompiled(caseId: string) {
      requireRow(caseId);
      return loadStore()[caseId] ?? null;
    },

    async saveCompiled(bundle: ConnectedCompiledBundle) {
      requireRow(bundle.caseId);
      const store = loadStore();
      store[bundle.caseId] = {
        ...bundle,
        compiledAt: bundle.compiledAt ?? new Date().toISOString(),
      };
      saveStore(store);
    },

    async reorderCases(caseIds: string[]) {
      const result = reorderCoworkCsvRows(csvPath, caseIds);
      const next: CoworkCsvRow[] = [];
      for (const id of result.caseIds) {
        const row = byId.get(id);
        if (row) next.push(row);
      }
      for (const row of orderedRows) {
        if (!result.caseIds.includes(row.caseId)) next.push(row);
      }
      orderedRows = next.map((row, i) => {
        row.rowIndex = i + 1;
        return row;
      });
      rebuildById();
      return port.listCases();
    },
  };

  return port;
}

export function coworkCompiledStorePath(csvPath: string): string {
  const abs = resolve(csvPath);
  return join(dirname(abs), `${basename(abs)}.compiled.json`);
}
