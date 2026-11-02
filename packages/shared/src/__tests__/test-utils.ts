/**
 * Shared test utilities for Zod schema validation
 */

import type { z } from 'zod'

type ZodType<T> = z.ZodType<T>

export function assertValidSchema<T>(schema: ZodType<T>, data: unknown): asserts data is T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
    throw new Error(`Schema validation failed: ${errors}`)
  }
}

export function validateSchema<T>(
  schema: ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function createSchemaValidator<T>(schema: ZodType<T>) {
  return {
    valid(data: unknown): T {
      assertValidSchema(schema, data)
      return data
    },

    invalid(data: unknown, expectedErrors?: string[]): void {
      const result = validateSchema(schema, data)
      if (result.success) {
        throw new Error(`Expected validation to fail but it passed for: ${JSON.stringify(data)}`)
      }
      if (expectedErrors) {
        const errors = result.error.issues.map((e) => e.message)
        for (const expected of expectedErrors) {
          if (!errors.some((e) => e.includes(expected))) {
            throw new Error(`Expected error containing "${expected}" but got: ${errors.join(', ')}`)
          }
        }
      }
    },

    parse(data: unknown): T {
      const result = validateSchema(schema, data)
      if (!result.success) {
        throw result.error
      }
      return result.data
    },
  }
}
