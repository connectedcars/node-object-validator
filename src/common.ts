import { ValidationErrorContext } from './errors'
import { ArraySchema, ObjectSchema, Schema } from './types'

export function isObject(value: unknown): value is { [key: string]: unknown } {
  return value !== null && typeof value === 'object'
}

export function isValidType<T>(value: unknown, error: Error | null): value is T {
  return error === null
}

export function isObjectSchema(value: Schema): value is ObjectSchema {
  return isObject(value)
}

export abstract class ValidatorBase {
  public schema?: ObjectSchema | ArraySchema
}
