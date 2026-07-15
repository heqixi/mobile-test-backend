/**
 * @mtp/executor-service
 *
 * HTTP 门面：AEP 通道 + Client 直连通道 → ExecutorPort。
 * 领域实现见 @mtp/domain-executor。
 */
export * from './api/http-kit.js';
export * from './api/aep-http.js';
export * from './api/client-http.js';
export * from './handlers/aep-handlers.js';
export * from './handlers/client-handlers.js';
export * from './server.js';
export { createExecutorHttpServer } from './http-server.js';