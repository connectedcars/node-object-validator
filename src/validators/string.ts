import { NotStringError, RequiredError, ValidationErrorContext, WrongLengthError } from '../errors'

export function validateString(
  value: string,
  minLength = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext<string>
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

export class RequiredString {
  private type: 'RequiredString' = 'RequiredString'
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }
}

export class OptionalString {
  private type: 'OptionalString' = 'OptionalString'
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }
}
