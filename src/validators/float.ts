import { ValidatorBase } from '../common'
import { NotFloatError, OutOfRangeError, RequiredError, ValidationErrorContext } from '../errors'

export function validateFloat(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): Error[] {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return [new NotFloatError(`Must be a float (received "${value}")`, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeError(`Must be between ${min} and ${max} (received "${value}")`, context)]
  }
  return []
}

export class RequiredFloat extends ValidatorBase<number> {
  private type: 'RequiredFloat' = 'RequiredFloat'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super()
    this.min = min
    this.max = max
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return [new RequiredError(`Is required`, context)]
    }
    return validateFloat(value, this.min, this.max, context)
  }
}

export class OptionalFloat extends ValidatorBase<number | undefined | null> {
  private type: 'OptionalFloat' = 'OptionalFloat'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super()
    this.min = min
    this.max = max
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return []
    }
    return validateFloat(value, this.min, this.max, context)
  }
}

export function Float(min: number, max: number, required?: false): OptionalFloat
export function Float(min: number, max: number, required: true): RequiredFloat
export function Float(min = 0, max = Number.MAX_SAFE_INTEGER, required = false): OptionalFloat | RequiredFloat {
  return required ? new RequiredFloat(min, max) : new OptionalFloat(min, max)
}
