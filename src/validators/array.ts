import { ValidatorBase } from '../common'
import { NotArrayError, RequiredError, ValidationErrorContext, WrongLengthError } from '../errors'
import { ArraySchema, Validator } from '../types'

export function validateArray(
  value: unknown,
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

export class RequiredArray<T extends ArraySchema = ArraySchema> extends ValidatorBase implements Validator {
  public schema: T
  private type: 'RequiredArray' = 'RequiredArray'
  private minLength: number
  private maxLength: number

  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super()
    this.schema = schema
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateArray(value, this.minLength, this.maxLength, context)
  }
}

export class OptionalArray<T extends ArraySchema = ArraySchema> extends ValidatorBase implements Validator {
  public schema: T
  private type: 'OptionalArray' = 'OptionalArray'
  private minLength: number
  private maxLength: number

  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super()
    this.schema = schema
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateArray(value, this.minLength, this.maxLength, context)
  }
}

export function TypedArray<T extends ArraySchema = ArraySchema>(
  schema: T,
  minLength: number,
  maxLength: number,
  required?: false
): OptionalArray<T>
export function TypedArray<T extends ArraySchema = ArraySchema>(
  schema: T,
  minLength: number,
  maxLength: number,
  required: true
): RequiredArray<T>
export function TypedArray<T extends ArraySchema = ArraySchema>(
  schema: T,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  required = false
): OptionalArray<T> | RequiredArray<T> {
  return required
    ? new RequiredArray<T>(schema, minLength, maxLength)
    : new OptionalArray<T>(schema, minLength, maxLength)
}
