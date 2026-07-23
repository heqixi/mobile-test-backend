/**
 * Cowork 用例库 HTTP 服务（业务实现）。
 *
 * 实现 @mtp/domain-case 的 case-library-http 协议。
 * 默认监听 :4103；编译走 LlmInstructionCompiler（OpenCode）。
 */

import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ConnectedCompiledBundle,
  CompileProgressEvent,
  LibraryCaseRunResult,
  LibraryRunReportWritebackRequest,
} from '@mtp/domain-case';
import {
  CaseDomainError,
  caseLibraryPaths,
  caseLibraryRoutePatterns,
  createLlmInstructionCompiler,
} from '@mtp/domain-case';
import { createOpenCodeHttpClient } from '@mtp/domain-agent';
import { createGoalSpaceHttpClient } from '@mtp/domain-goal-space';
import {
  createCoworkCsvAdapter,
  type CreateCoworkCsvAdapterOptions,
} from '../index.js';
import { compileCoworkCase } from '../compile-case.js';
import {
  getLibraryRunReport,
  listLibraryRunReports,
  persistLibraryRunReport,
  buildLibraryCaseRunResult,
  writebackLibraryRunReportToCsv,
} from '../library-run-report.js';
import { defaultCoworkCsvPath } from '../paths.js';
import { matchRoute, readBody, sendJson } from './http-utils.js';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../../.env') });
loadEnv();

const DEFAULT_PORT = 4103;
const SERVICE_NAME = 'cowork-library-service';

/** CSV / reports / compiled sidecar 均在 business/cowork-csv/data 下由本业务维护 */
const csvPath = defaultCoworkCsvPath();

function createAdapter(options?: Partial<CreateCoworkCsvAdapterOptions>) {
  return createCoworkCsvAdapter({
    csvPath: options?.csvPath ?? csvPath,
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
  const goalSpace =
    process.env.COWORK_GOAL_SPACE === '0'
      ? undefined
      : createGoalSpaceHttpClient({
          baseUrl: process.env.GOAL_SPACE_URL ?? 'http://127.0.0.1:4104',
        });
  const goalSpaceRef = process.env.GOAL_SPACE_ID
    ? {
        spaceId: process.env.GOAL_SPACE_ID,
        version: process.env.GOAL_SPACE_VERSION || undefined,
      }
    : undefined;

  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
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

      if (method === 'POST' && path === caseLibraryPaths.casesReorder) {
        const body = (await readBody(req)) as { caseIds?: string[] };
        if (!Array.isArray(body.caseIds) || body.caseIds.length === 0) {
          sendJson(res, 400, { error: 'caseIds array required' });
          return;
        }
        if (!adapter.reorderCases) {
          sendJson(res, 501, { error: 'reorderCases not supported' });
          return;
        }
        try {
          sendJson(res, 200, await adapter.reorderCases(body.caseIds));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          sendJson(res, 400, { error: message });
        }
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
          const wantStream =
            url.searchParams.get('stream') === '1' ||
            (req.headers.accept ?? '').includes('application/x-ndjson');

          if (wantStream) {
            res.writeHead(200, {
              'Content-Type': 'application/x-ndjson; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Accept',
              'Cache-Control': 'no-cache, no-transform',
              'X-Content-Type-Options': 'nosniff',
            });
            const writeEvent = (event: CompileProgressEvent) => {
              res.write(`${JSON.stringify(event)}\n`);
            };
            try {
              const bundle = await compileCoworkCase(detail, llmCompiler, {
                onProgress: writeEvent,
                onPartial: (partial) => adapter.saveCompiled(partial),
                goalSpace,
                goalSpaceRef,
              });
              await adapter.saveCompiled(bundle);
            } catch (error) {
              if (error instanceof CaseDomainError) {
                writeEvent({
                  type: 'error',
                  caseId: p.caseId,
                  code: error.code,
                  message: error.message,
                });
              } else {
                writeEvent({
                  type: 'error',
                  caseId: p.caseId,
                  message:
                    error instanceof Error ? error.message : String(error),
                });
              }
            }
            res.end();
            return;
          }

          const bundle = await compileCoworkCase(detail, llmCompiler, {
            onPartial: (partial) => adapter.saveCompiled(partial),
            goalSpace,
            goalSpaceRef,
          });
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

      // ── Midscene-compatible library run reports ───────────────
      if (method === 'GET' && path === caseLibraryPaths.reports) {
        sendJson(res, 200, listLibraryRunReports(csvPath));
        return;
      }
      if (method === 'POST' && path === caseLibraryPaths.reports) {
        const body = (await readBody(req)) as {
          groupName?: string;
          groupDescription?: string;
          deviceType?: string;
          cases?: Array<
            LibraryCaseRunResult | {
              caseId: string;
              title: string;
              path?: string[];
              priority?: string;
              sourceFields?: Record<string, string>;
              status: LibraryCaseRunResult['status'];
              durationMs: number;
              reason?: string;
              instructionResults?: LibraryCaseRunResult['instructionResults'];
            }
          >;
          reportId?: string;
          createdAt?: string;
        };
        if (!Array.isArray(body.cases)) {
          sendJson(res, 400, {
            error: 'cases array required (Midscene-compatible LibraryCaseRunResult[])',
          });
          return;
        }
        const cases: LibraryCaseRunResult[] = body.cases.map((c) => {
          if ('dump' in c && c.dump && 'attributes' in c && c.attributes) {
            return c as LibraryCaseRunResult;
          }
          return buildLibraryCaseRunResult({
            ...c,
            deviceType: body.deviceType,
          });
        });
        const report = persistLibraryRunReport({
          csvPath,
          groupName:
            body.groupName ??
            adapter.info.displayName ??
            'Cowork CSV library run',
          groupDescription: body.groupDescription,
          deviceType: body.deviceType,
          cases,
          reportId: body.reportId,
          createdAt: body.createdAt,
        });
        sendJson(res, 201, report);
        return;
      }
      {
        const p = matchRoute(caseLibraryRoutePatterns.reportHtml, path);
        if (method === 'GET' && p?.reportId) {
          const report = getLibraryRunReport(csvPath, p.reportId);
          if (!report?.htmlPath || !existsSync(report.htmlPath)) {
            sendJson(res, 404, { error: `Report HTML not found: ${p.reportId}` });
            return;
          }
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          });
          createReadStream(report.htmlPath).pipe(res);
          return;
        }
      }
      {
        const p = matchRoute(caseLibraryRoutePatterns.reportWriteback, path);
        if (method === 'POST' && p?.reportId) {
          const body = (await readBody(req)) as LibraryRunReportWritebackRequest;
          try {
            sendJson(
              res,
              200,
              writebackLibraryRunReportToCsv({
                csvPath,
                reportId: p.reportId,
                body,
              }),
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            sendJson(res, 400, { error: message });
          }
          return;
        }
      }
      {
        const p = matchRoute(caseLibraryRoutePatterns.reportDetail, path);
        if (method === 'GET' && p?.reportId) {
          const report = getLibraryRunReport(csvPath, p.reportId);
          if (!report) {
            sendJson(res, 404, { error: `Report not found: ${p.reportId}` });
            return;
          }
          sendJson(res, 200, report);
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
  console.log(`  CSV    ${csvPath}`);
  console.log(`  Reports ${csvPath}.reports/`);
  console.log(`  OpenCode ${openCode.baseUrl}`);
  console.log(`  GET    ${caseLibraryPaths.health} ${caseLibraryPaths.info}`);
  console.log(`  GET    ${caseLibraryPaths.cases}`);
  console.log(`  POST   ${caseLibraryPaths.casesReorder}`);
  console.log(`  GET    /api/library/cases/:id[/outline|/compiled]`);
  console.log(`  POST   /api/library/cases/:id/compiled | compile`);
  console.log(`  GET/POST ${caseLibraryPaths.reports} (Midscene dump HTML)`);
  console.log(`  GET    /api/library/reports/:id[/html]`);
  console.log(`  POST   /api/library/reports/:id/writeback`);
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
