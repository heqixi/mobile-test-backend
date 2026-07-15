/**
 * @mtp/shared-kernel
 *
 * Shared Kernel：三域共用的基础类型、AEP 信封、错误码。
 * 禁止依赖任何 domain-* 包。
 */
export * from './primitives.js';
export * from './aep-envelope.js';
export * from './errors.js';
