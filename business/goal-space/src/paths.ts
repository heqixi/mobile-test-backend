/**
 * Goal Space 业务数据路径。
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function goalSpacePackageRoot(): string {
  return resolve(here, '..');
}

export function goalSpaceDataDir(): string {
  const fromEnv = process.env.GOAL_SPACE_DATA_DIR?.trim();
  if (fromEnv) return resolve(fromEnv);
  return join(goalSpacePackageRoot(), 'data');
}

export function spaceDir(spaceId: string): string {
  return join(goalSpaceDataDir(), spaceId);
}

export function versionDir(spaceId: string, version: string): string {
  return join(spaceDir(spaceId), 'versions', version);
}

export function sessionsDir(spaceId: string): string {
  return join(spaceDir(spaceId), 'sessions');
}
