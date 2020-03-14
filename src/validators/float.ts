import { NotFloatError, OutOfAllowedRange, RequiredError, ValidationError, ValidationErrorContext } from '../errors'

export function validateFloat(
  value: number,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext<string>
): Error | null {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return new NotFloatError(`Must be a float (received "${value}")`, context)
  }
  if (value < min || value > max) {
    return new OutOfAllowedRange(`Must be between ${min} and ${max} (received "${value}")`, context)
  }
  return null
}

export class RequiredFloat {
  private type: 'RequiredFloat' = 'RequiredFloat'
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateFloat(value, this.minLength, this.maxLength, context)
  }
}

export class OptionalFloat {
  private type: 'OptionalFloat' = 'OptionalFloat'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateFloat(value, this.minLength, this.maxLength, context)
  }
}
