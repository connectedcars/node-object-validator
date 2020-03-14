import { NotFloatError, OutOfRangeError, RequiredError, ValidationErrorContext } from '../errors'

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
    return new OutOfRangeError(`Must be between ${min} and ${max} (received "${value}")`, context)
  }
  return null
}

export class RequiredFloat {
  private type: 'RequiredFloat' = 'RequiredFloat'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    this.min = min
    this.max = max
  }

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateFloat(value, this.min, this.max, context)
  }
}

export class OptionalFloat {
  private type: 'OptionalFloat' = 'OptionalFloat'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    this.min = min
    this.max = max
  }

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateFloat(value, this.min, this.max, context)
  }
}
