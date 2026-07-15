/**
 * @mtp/agent-service
 *
 * Agent 进程骨架：HTTP 契约 + stub handlers。
 * 默认端口 :4100；Case API 可同进程挂载但分域。
 */
export * from './api/stub.js';
export * from './api/agent-http.js';
export * from './api/case-http.js';
export * from './server.js';
