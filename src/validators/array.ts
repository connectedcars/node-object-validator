import { ValidatorBase } from '../common'
import { NotArrayFail, RequiredFail, ValidationErrorContext, ValidationFailure, WrongLengthFail } from '../errors'
import { SchemaToType, ValidatorTypes } from '../types'

export function validateArray<T extends ValidatorTypes = ValidatorTypes, O = never>(
  schema: RequiredArray<T> | OptionalArray<T> | ArrayValidator<T, O>,
  value: unknown,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (!Array.isArray(value)) {
    return [new NotArrayFail(`Must be an array (received "${value}")`, context)]
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return [
      new WrongLengthFail(`Must contain between ${minLength} and ${maxLength} entries (found ${value.length})`, context)
    ]
  }
  const errors = []
  const validator = schema.schema
  for (const [i, item] of value.entries()) {
    errors.push(...validator.validate(item, { key: `${context?.key || ''}[${i}]` }))
  }
  return errors
}

export class ArrayValidator<T extends ValidatorTypes = ValidatorTypes, O = never> extends ValidatorBase<
  SchemaToType<T> | O
> {
  public schema: T
  private minLength: number
  private maxLength: number
  private required: boolean

  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, required = true) {
    super()
    this.schema = schema
    this.required = required
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateArray(this, value, this.minLength, this.maxLength, context)
  }

  // TODO: implement code gen for arrays
}

export class RequiredArray<T extends ValidatorTypes = ValidatorTypes> extends ArrayValidator<T> {
  private validatorType: 'RequiredArray' = 'RequiredArray'

  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super(schema, minLength, maxLength)
  }
}

export class OptionalArray<T extends ValidatorTypes = ValidatorTypes> extends ArrayValidator<T, null | undefined> {
  private validatorType: 'OptionalArray' = 'OptionalArray'

  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super(schema, minLength, maxLength, false)
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
