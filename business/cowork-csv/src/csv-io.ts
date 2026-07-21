/**
 * CSV 解析 / 序列化 / 稳定 caseId（无行号，支持重排后 ID 不变）。
 */

import { createHash } from 'node:crypto';

export const COWORK_CSV_COLUMNS = {
  caseNo: '用例编号',
  title: '用例标题',
  preconditions: '前提条件',
  steps: '操作步骤',
  expected: '预期结果',
  priority: '用例等级',
  graySmoke: '灰度冒烟-双端',
  androidTester: '安卓端测试',
  testResult: '测试结果',
  iosTester: 'iOS端测试',
  harmonyTester: '鸿蒙端测试',
} as const;

export function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, '');
}

/** 简易 CSV 解析（支持引号内换行） */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;
  const src = stripBom(text);
  while (i < src.length) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export function serializeCsv(rows: string[][]): string {
  return (
    rows
      .map((r) =>
        r
          .map((c) => {
            const value = c ?? '';
            if (/[",\n\r]/.test(value)) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','),
      )
      .join('\n') + '\n'
  );
}

/** 稳定 caseId：优先用例编号，否则 path|title 哈希（不含行号） */
export function makeCoworkCaseId(
  title: string,
  path: string[],
  caseNo?: string,
): string {
  const numbered = caseNo?.trim();
  if (numbered) return numbered;
  const raw = `${path.join('/')}|${title}`;
  const hash = createHash('sha1').update(raw).digest('hex').slice(0, 12);
  return `cowork-${hash}`;
}
