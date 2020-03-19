import { ObjectSchema, ValidatorTypes } from './types'

export function isObject(value: unknown): value is { [key: string]: unknown } {
  return value !== null && typeof value === 'object'
}

export function isValidType<T>(value: unknown, errors: Error[] | null): value is T {
  return errors === null
}

export function isObjectSchema(value: ValidatorTypes | ObjectSchema): value is ObjectSchema {
  return isObject(value)
}

export abstract class ValidatorBase {
  public schema?: ValidatorTypes | ObjectSchema
}
