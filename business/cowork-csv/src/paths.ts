/**
 * 业务本地路径：CSV / 编译 sidecar / Midscene reports 均由本包维护。
 * domain-case 只经 HTTP 协议交互，不感知文件系统布局。
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** `business/cowork-csv` 包根目录 */
export function coworkCsvPackageRoot(): string {
  return resolve(here, '..');
}

/** 默认数据目录：`<package>/data` */
export function coworkCsvDataDir(): string {
  const fromEnv = process.env.COWORK_CSV_DATA_DIR?.trim();
  if (fromEnv) return resolve(fromEnv);
  return join(coworkCsvPackageRoot(), 'data');
}

/** 默认用例 CSV（可用 COWORK_CSV_PATH 覆盖） */
export function defaultCoworkCsvPath(): string {
  const fromEnv = process.env.COWORK_CSV_PATH?.trim();
  if (fromEnv) return resolve(fromEnv);
  return join(coworkCsvDataDir(), 'cowork_test_case_top10.csv');
}
