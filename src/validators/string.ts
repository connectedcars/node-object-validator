import { ValidatorBase } from '../common'
import { NotStringError, RequiredError, ValidationErrorContext, WrongLengthError } from '../errors'

export function validateString(
  value: unknown,
  minLength = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): Error | null {
  if (typeof value !== 'string') {
    return new NotStringError(`Must be a string (received "${value}")`, context)
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return new WrongLengthError(
      `Must contain between ${minLength} and ${maxLength} characters (received "${value}")`,
      context
    )
  }
  return null
}

export class RequiredString extends ValidatorBase {
  private type: 'RequiredString' = 'RequiredString'
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super()
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }
}

export class OptionalString extends ValidatorBase {
  private type: 'OptionalString' = 'OptionalString'
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super()
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }
}

export function StringValue(minLength: number, maxLength: number, required?: false): OptionalString
export function StringValue(minLength: number, maxLength: number, required: true): RequiredString
export function StringValue(
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  required = false
): OptionalString | RequiredString {
  return required ? new RequiredString(minLength, maxLength) : new OptionalString(minLength, maxLength)
}
