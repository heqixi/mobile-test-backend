import type { z } from 'zod';
/**
 * Recursively unwrap optional, nullable, default, and effects wrapper types
 * to get the actual inner Zod type
 */
export declare function unwrapZodField(field: unknown): unknown;
/**
 * Check if a field is a Midscene locator field
 * Locator input schemas are identified by their prompt field.
 */
export declare function isMidsceneLocatorField(field: unknown): boolean;
/**
 * Get type name string from a Zod schema field
 * @param field - Zod schema field
 * @param locatorTypeDescription - Optional description for MidsceneLocation fields (used by core)
 */
export declare function getZodTypeName(field: unknown, locatorTypeDescription?: string): string;
/**
 * Get description from a Zod schema field
 */
export declare function getZodDescription(field: z.ZodTypeAny): string | null;
