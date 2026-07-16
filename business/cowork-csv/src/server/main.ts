/**
 * Cowork 用例库 HTTP 服务（业务实现）。
 *
 * 实现 @mtp/domain-case 的 case-library-http 协议。
 * 默认监听 :4103；编译走 LlmInstructionCompiler（OpenCode）。
 */

import { createServer } from 'node:http';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ConnectedCompiledBundle } from '@mtp/domain-case';
import {
  CaseDomainError,
  caseLibraryPaths,
  caseLibraryRoutePatterns,
  createLlmInstructionCompiler,
} from '@mtp/domain-case';
import { createOpenCodeHttpClient } from '@mtp/domain-agent';
import {
  createCoworkCsvAdapter,
  type CreateCoworkCsvAdapterOptions,
} from '../index.js';
import { compileCoworkCase } from '../compile-case.js';
import { matchRoute, readBody, sendJson } from './http-utils.js';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../../.env') });
loadEnv();

const DEFAULT_PORT = 4103;
const SERVICE_NAME = 'cowork-library-service';

function defaultCsvPath(): string {
  return (
    process.env.COWORK_CSV_PATH?.trim() ||
    resolve(here, '../../../../../cowork_test_case.csv')
  );
}

function createAdapter(options?: Partial<CreateCoworkCsvAdapterOptions>) {
  return createCoworkCsvAdapter({
    csvPath: options?.csvPath ?? defaultCsvPath(),
    compiledStorePath: options?.compiledStorePath,
    sourceId: options?.sourceId ?? 'cowork-csv',
    displayName: options?.displayName,
  });
}

function statusForCompileError(code: string): number {
  switch (code) {
    case 'CASE_NOT_FOUND':
      return 404;
    case 'COMPILE_REJECTED':
      return 422;
    case 'COMPILE_LLM_FAILED':
      return 502;
    default:
      return 400;
  }
}

async function main() {
  const port = Number(
    process.env.COWORK_LIBRARY_PORT ??
      process.env.MTP_COWORK_LIBRARY_PORT ??
      DEFAULT_PORT,
  );
  const host =
    process.env.COWORK_LIBRARY_HOST ??
    process.env.MTP_COWORK_LIBRARY_HOST ??
    '127.0.0.1';

  const adapter = createAdapter();
  const openCode = createOpenCodeHttpClient({
    baseUrl: process.env.OPENCODE_URL ?? 'http://127.0.0.1:4096',
    directory: process.env.OPENCODE_DIRECTORY,
    username: process.env.OPENCODE_SERVER_USERNAME,
    password: process.env.OPENCODE_SERVER_PASSWORD,
  });
  const llmCompiler = createLlmInstructionCompiler({ client: openCode });

  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
      }

      const method = req.method ?? 'GET';
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      const path = url.pathname;

      if (
        method === 'GET' &&
        (path === caseLibraryPaths.health ||
          path === caseLibraryPaths.libraryHealth)
      ) {
        sendJson(res, 200, {
          ok: true,
          service: SERVICE_NAME,
          ...adapter.info,
        });
        return;
      }

      if (method === 'GET' && path === caseLibraryPaths.info) {
        sendJson(res, 200, {
          ...adapter.info,
          service: SERVICE_NAME,
        });
        return;
      }

      if (method === 'GET' && path === caseLibraryPaths.cases) {
        const q = url.searchParams.get('q') ?? undefined;
        const pathParam = url.searchParams.get('path') ?? undefined;
        const pathPrefix = pathParam
          ? pathParam.split('/').map((s) => s.trim()).filter(Boolean)
          : undefined;
        sendJson(res, 200, await adapter.listCases({ q, pathPrefix }));
        return;
      }

      {
        const p = matchRoute(caseLibraryRoutePatterns.outline, path);
        if (method === 'GET' && p?.caseId) {
          sendJson(res, 200, await adapter.getOutline(p.caseId));
          return;
        }
      }
      {
        const p = matchRoute(caseLibraryRoutePatterns.compile, path);
        if (method === 'POST' && p?.caseId) {
          const detail = await adapter.getCase(p.caseId);
          const bundle = await compileCoworkCase(detail, llmCompiler);
          await adapter.saveCompiled(bundle);
          sendJson(res, 200, bundle);
          return;
        }
      }
      {
        const p = matchRoute(caseLibraryRoutePatterns.compiled, path);
        if (method === 'GET' && p?.caseId) {
          const bundle = await adapter.getCompiled(p.caseId);
          sendJson(res, 200, bundle ?? { empty: true });
          return;
        }
        if (method === 'POST' && p?.caseId) {
          const body = (await readBody(req)) as ConnectedCompiledBundle;
          const bundle: ConnectedCompiledBundle = {
            ...body,
            caseId: body.caseId || p.caseId,
          };
          await adapter.saveCompiled(bundle);
          sendJson(res, 200, bundle);
          return;
        }
      }
      {
        const p = matchRoute(caseLibraryRoutePatterns.caseDetail, path);
        if (method === 'GET' && p?.caseId) {
          sendJson(res, 200, await adapter.getCase(p.caseId));
          return;
        }
      }

      sendJson(res, 404, { error: `Unknown route ${method} ${path}` });
    } catch (error) {
      if (error instanceof CaseDomainError) {
        sendJson(res, statusForCompileError(error.code), {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  });

  await new Promise<void>((resolveListen) => {
    server.listen(port, host, () => resolveListen());
  });

  console.log('');
  console.log(`[${SERVICE_NAME}] ready (business case library)`);
  console.log(`  HTTP   http://${host}:${port}`);
  console.log(`  CSV    ${defaultCsvPath()}`);
  console.log(`  OpenCode ${openCode.baseUrl}`);
  console.log(`  GET    ${caseLibraryPaths.health} ${caseLibraryPaths.info}`);
  console.log(`  GET    ${caseLibraryPaths.cases}`);
  console.log(`  GET    /api/library/cases/:id[/outline|/compiled]`);
  console.log(`  POST   /api/library/cases/:id/compiled | compile`);
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
