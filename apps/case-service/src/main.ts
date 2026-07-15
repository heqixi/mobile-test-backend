/**
 * Case Service 进程入口
 *
 * 职责：createCaseDomain → HTTP 门面 → 监听。
 * CaseRun / compile_instruction 逻辑全部在 @mtp/domain-case。
 */

import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCaseDomain } from '@mtp/domain-case';
import { createCaseHttpServer } from './http-server.js';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../.env') });
loadEnv();

const port = Number(
  process.env.CASE_PORT ?? process.env.MTP_CASE_PORT ?? 4102,
);

async function main() {
  const domain = createCaseDomain();
  const http = createCaseHttpServer(
    {
      catalog: domain.catalog,
      compiler: domain.compiler,
      runs: domain.runs,
    },
    { port },
  );
  await http.listen();

  const cases = await domain.catalog.listCases();

  console.log('');
  console.log('[case-service] ready (HTTP facade only)');
  console.log(`  HTTP       http://${http.host}:${http.port}`);
  console.log(`  GET        /health /api/cases /api/cases/:caseId`);
  console.log(`  POST       /api/cases/:caseId/compile`);
  console.log(`  POST       /api/runs  (+ step/next|retry|skip /abort)`);
  console.log(`  catalog    ${cases.length} case(s)`);
  console.log('');

  const shutdown = async () => {
    console.log('[case-service] shutting down...');
    await http.close().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
