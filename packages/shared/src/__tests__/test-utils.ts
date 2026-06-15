/**
 * Shared test utilities for Zod schema validation
 */

import type { ZodSchema } from 'zod'

/**
 * Assert that data conforms to a Zod schema
 * Throws a descriptive error if validation fails
 *
 * Usage:
 * ```ts
 * import { z } from 'zod'
 * const schema = z.object({ id: z.string() })
 *
 * describe('MySchema', () => {
 *   it('validates correct data', () => {
 *     assertValidSchema(schema, { id: '123' })
 *   })
 * })
 * ```
 */
export function assertValidSchema<T>(schema: ZodSchema<T>, data: unknown): asserts data is T {
  const result = (schema as any).safeParse(data)
  if (!result.success) {
    const errors = (result as any).error.errors
      .map((e: any) => `${e.path.join('.')}: ${e.message}`)
      .join('; ')
    throw new Error(`Schema validation failed: ${errors}`)
  }
}

/**
 * Validate data against a schema and return the parsed result or error
 *
 * Usage:
 * ```ts
 * const result = validateSchema(schema, data)
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export function validateSchema<T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: any } {
  const result = (schema as any).safeParse(data)
  return result
}

/**
 * Create a schema test helper that can be reused across multiple tests
 *
 * Usage:
 * ```ts
 * const testSchema = createSchemaValidator(schema)
 * testSchema.valid({ id: '123' })
 * testSchema.invalid({ id: 123 })
 * ```
 */
export function createSchemaValidator<T>(schema: ZodSchema<T>) {
  return {
    /**
     * Assert that data passes validation
     */
    valid(data: unknown): T {
      assertValidSchema(schema, data)
      return data as T
    },

    /**
     * Assert that data fails validation
     */
    invalid(data: unknown, expectedErrors?: string[]): void {
      const result = validateSchema(schema, data)
      if (result.success) {
        throw new Error(`Expected validation to fail but it passed for: ${JSON.stringify(data)}`)
      }
      if (expectedErrors) {
        const errors = (result.error as any).errors.map((e: any) => e.message)
        for (const expected of expectedErrors) {
          if (!errors.some((e: string) => e.includes(expected))) {
            throw new Error(`Expected error containing "${expected}" but got: ${errors.join(', ')}`)
          }
        }
      }
    },

    /**
     * Parse and return validated data
     */
    parse(data: unknown): T {
      const result = validateSchema(schema, data)
      if (!result.success) {
        throw result.error
      }
      return result.data
    },
  }
}
