/**
 * 将 CSV 数据行按 caseId 顺序重排并落盘。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  COWORK_CSV_COLUMNS,
  makeCoworkCaseId,
  parseCsv,
  serializeCsv,
  stripBom,
} from './csv-io.js';

const DIR_COUNT = 15;

function cellAt(header: string[], row: string[], name: string): string {
  const i = header.findIndex((h) => stripBom(h).trim() === name);
  if (i < 0) return '';
  return (row[i] ?? '').trim();
}

function buildPath(header: string[], row: string[]): string[] {
  const path: string[] = [];
  for (let d = 1; d <= DIR_COUNT; d++) {
    const v = cellAt(header, row, `目录${d}`);
    if (v) path.push(v);
  }
  return path;
}

export { makeCoworkCaseId } from './csv-io.js';

export interface ReorderCoworkCsvResult {
  csvPath: string;
  caseIds: string[];
  updatedAt: string;
}

/**
 * 按 caseIds 重排 CSV 数据行（表头不动）。
 * 未出现在 caseIds 中的行保持相对顺序追加在末尾。
 */
export function reorderCoworkCsvRows(
  csvPathInput: string,
  caseIds: string[],
): ReorderCoworkCsvResult {
  const csvPath = resolve(csvPathInput);
  if (!Array.isArray(caseIds) || caseIds.length === 0) {
    throw new Error('caseIds required');
  }

  const text = readFileSync(csvPath, 'utf8');
  const table = parseCsv(text);
  if (table.length < 2) {
    throw new Error(`CSV empty or invalid: ${csvPath}`);
  }

  const header = table[0]!.map((h) => stripBom(h).trim());
  const dataLines = table.slice(1);

  const idOf = (line: string[]): string => {
    const title = cellAt(header, line, COWORK_CSV_COLUMNS.title);
    if (!title) return '';
    const path = buildPath(header, line);
    const caseNo = cellAt(header, line, COWORK_CSV_COLUMNS.caseNo);
    return makeCoworkCaseId(title, path, caseNo);
  };

  const byId = new Map<string, string[]>();
  const originalOrder: string[] = [];
  for (const line of dataLines) {
    const id = idOf(line);
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, line);
      originalOrder.push(id);
    }
  }

  for (const id of caseIds) {
    if (!byId.has(id)) {
      throw new Error(`Case not found in CSV: ${id}`);
    }
  }

  const seen = new Set<string>();
  const orderedLines: string[][] = [];
  for (const id of caseIds) {
    if (seen.has(id)) continue;
    orderedLines.push(byId.get(id)!);
    seen.add(id);
  }
  for (const id of originalOrder) {
    if (seen.has(id)) continue;
    orderedLines.push(byId.get(id)!);
    seen.add(id);
  }

  writeFileSync(csvPath, serializeCsv([table[0]!, ...orderedLines]), 'utf8');

  return {
    csvPath,
    caseIds: orderedLines.map((line) => idOf(line)).filter(Boolean),
    updatedAt: new Date().toISOString(),
  };
}
