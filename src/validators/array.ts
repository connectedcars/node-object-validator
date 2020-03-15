import { NotArrayError, RequiredError, ValidationErrorContext, WrongLengthError } from '../errors'
import { Schema, Validator } from './common'

export function validateArray<T>(
  value: Array<T>,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): Error | null {
  if (!Array.isArray(value)) {
    return new NotArrayError(`Must be an array (received "${value}")`, context)
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return new WrongLengthError(
      `Must contain between ${minLength} and ${maxLength} entries (found ${value.length})`,
      context
    )
  }
  return null
}

export function isArray<T>(value: unknown): value is Array<T> {
  return validateArray(value as T[]) ? false : true
}

export class RequiredArray implements Validator {
  public schema: Schema
  private type: 'RequiredArray' = 'RequiredArray'
  private minLength: number
  private maxLength: number

  public constructor(schema: Schema, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.schema = schema
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: Array<unknown>, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateArray(value, this.minLength, this.maxLength, context)
  }
}

export class OptionalArray implements Validator {
  public schema: Schema
  private type: 'OptionalArray' = 'OptionalArray'
  private minLength: number
  private maxLength: number

  public constructor(schema: Schema, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.schema = schema
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: Array<unknown>, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateArray(value, this.minLength, this.maxLength, context)
  }
}

export function NestedArray(schema: Schema, minLength: number, maxLength: number, required?: false): OptionalArray
export function NestedArray(schema: Schema, minLength: number, maxLength: number, required: true): RequiredArray
export function NestedArray(
  schema: Schema,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  required = false
): OptionalArray | RequiredArray {
  return required ? new RequiredArray(schema, minLength, maxLength) : new OptionalArray(schema, minLength, maxLength)
}
