import { ValidatorBase } from '../common'
import { NotIntegerError, OutOfRangeError, RequiredError, ValidationErrorContext } from '../errors'

export function validateInteger(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): Error[] | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return [new NotIntegerError(`Must be an integer (received "${value}")`, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeError(`Must be between ${min} and ${max} (received "${value}")`, context)]
  }
  return null
}

export class RequiredInteger extends ValidatorBase {
  private type: 'RequiredInteger' = 'RequiredInteger'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super()
    this.min = min
    this.max = max
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] | null {
    if (value == null) {
      return [new RequiredError(`Is required`, context)]
    }
    return validateInteger(value, this.min, this.max, context)
  }
}

export class OptionalInteger extends ValidatorBase {
  private type: 'OptionalInteger' = 'OptionalInteger'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super()
    this.min = min
    this.max = max
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] | null {
    if (value == null) {
      return null
    }
    return validateInteger(value, this.min, this.max, context)
  }
}

export function Integer(min: number, max: number, required?: false): OptionalInteger
export function Integer(min: number, max: number, required: true): RequiredInteger
export function Integer(min = 0, max = Number.MAX_SAFE_INTEGER, required = false): OptionalInteger | RequiredInteger {
  return required ? new RequiredInteger(min, max) : new OptionalInteger(min, max)
}
