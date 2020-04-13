import { ValidatorBase } from '../common'
import { NotArrayError, RequiredError, ValidationErrorContext, WrongLengthError } from '../errors'
import { ValidatorTypes } from '../types'

export function validateArray<T extends ValidatorTypes = ValidatorTypes>(
  schema: RequiredArray<T> | OptionalArray<T>,
  value: unknown,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): Error[] {
  if (!Array.isArray(value)) {
    return [new NotArrayError(`Must be an array (received "${value}")`, context)]
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return [
      new WrongLengthError(
        `Must contain between ${minLength} and ${maxLength} entries (found ${value.length})`,
        context
      )
    ]
  }
  const errors = []
  const validator = schema.schema
  for (const [i, item] of value.entries()) {
    // TODO: Parent context ${context.key}
    errors.push(...validator.validate(item, { key: `[${i}]`, value: item }))
  }
  return errors
}

export class RequiredArray<T extends ValidatorTypes = ValidatorTypes> extends ValidatorBase {
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

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return [new RequiredError(`Is required`, context)]
    }
    return validateArray(this, value, this.minLength, this.maxLength, context)
  }
}

export class OptionalArray<T extends ValidatorTypes = ValidatorTypes> extends ValidatorBase {
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

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return []
    }
    return validateArray(this, value, this.minLength, this.maxLength, context)
  }
}

export function TypedArray<T extends ValidatorTypes = ValidatorTypes>(
  schema: T,
  minLength: number,
  maxLength: number,
  required?: false
): OptionalArray<T>
export function TypedArray<T extends ValidatorTypes = ValidatorTypes>(
  schema: T,
  minLength: number,
  maxLength: number,
  required: true
): RequiredArray<T>
export function TypedArray<T extends ValidatorTypes = ValidatorTypes>(
  schema: T,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  required = false
): OptionalArray<T> | RequiredArray<T> {
  return required
    ? new RequiredArray<T>(schema, minLength, maxLength)
    : new OptionalArray<T>(schema, minLength, maxLength)
}