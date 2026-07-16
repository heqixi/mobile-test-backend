/**
 * Case Service 进程入口
 */

import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createCaseDataConnector,
  createCaseDomain,
} from '@mtp/domain-case';
import {
  createConnectorSourceFactory,
  DEFAULT_LIBRARY_BASE_URL,
} from './connector/source-factory.js';
import { createCaseHttpServer } from './http-server.js';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../.env') });
loadEnv();

const port = Number(
  process.env.CASE_PORT ?? process.env.MTP_CASE_PORT ?? 4102,
);

async function main() {
  const domain = createCaseDomain();
  const connector = createCaseDataConnector();
  const sourceFactory = createConnectorSourceFactory();

  if (process.env.CASE_AUTO_CONNECT_LIBRARY !== '0') {
    try {
      connector.connect(
        sourceFactory.create({ baseUrl: DEFAULT_LIBRARY_BASE_URL }),
      );
    } catch (err) {
      console.warn(
        '[case-service] auto-connect library skipped:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  const http = createCaseHttpServer(
    {
      catalog: domain.catalog,
      compiler: domain.compiler,
      runs: domain.runs,
      connector,
      sourceFactory,
    },
    { port },
  );
  await http.listen();

  const cases = await domain.catalog.listCases();
  const src = connector.getSourceInfo();

  console.log('');
  console.log('[case-service] ready');
  console.log(`  HTTP       http://${http.host}:${http.port}`);
  console.log(`  catalog    ${cases.length} demo case(s)`);
  console.log(
    `  connector  ${src ? `${src.displayName} (${DEFAULT_LIBRARY_BASE_URL})` : 'not connected'}`,
  );
  console.log(`  library    ${DEFAULT_LIBRARY_BASE_URL} (remote business service)`);
  console.log(`  GET/POST   /api/connector/*`);
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
