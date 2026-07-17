/**
 * @module @mtp/case-service/api/http-kit
 *
 * 纯传输辅助：CORS / JSON / HttpResult。
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

export interface HttpResult {
  status: number;
  body: unknown;
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString('utf-8').trim();
  if (!text) return {};
  return JSON.parse(text) as unknown;
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

export function corsPreflight(res: ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  });
  res.end();
}

export function ok(body: unknown, status = 200): HttpResult {
  return { status, body };
}

export function fail(status: number, body: unknown): HttpResult {
  return { status, body };
}
