import { NotArrayError, RequiredError, ValidationErrorContext, WrongLengthError } from '../errors'

export function validateArray<T>(
  value: Array<T>,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext<string>
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

export class RequiredArray<T> {
  private type: 'RequiredArray' = 'RequiredArray'
  private minLength: number
  private maxLength: number
  private array: Array<T>

  public constructor(array: Array<T>, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.array = array
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: Array<T>, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateArray(value, this.minLength, this.maxLength, context)
  }
}

export class OptionalArray<T> {
  private type: 'OptionalArray' = 'OptionalArray'
  private minLength: number
  private maxLength: number
  private array: Array<T>

  public constructor(array: Array<T>, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.array = array
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: Array<T>, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateArray(value, this.minLength, this.maxLength, context)
  }
}
