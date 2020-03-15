import { NotIntegerError, OutOfRangeError, RequiredError, ValidationErrorContext } from '../errors'
import { Validator } from './common'

export function validateInteger(
  value: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): Error | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return new NotIntegerError(`Must be an integer (received "${value}")`, context)
  }
  if (value < min || value > max) {
    return new OutOfRangeError(`Must be between ${min} and ${max} (received "${value}")`, context)
  }
  return null
}

export class RequiredInteger implements Validator {
  private type: 'RequiredInteger' = 'RequiredInteger'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    this.min = min
    this.max = max
  }

  public validate(value: number, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateInteger(value, this.min, this.max, context)
  }
}

export class OptionalInteger implements Validator {
  private type: 'OptionalInteger' = 'OptionalInteger'
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    this.min = min
    this.max = max
  }

  public validate(value: number, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateInteger(value, this.min, this.max, context)
  }
}

export function Integer(required?: false): OptionalInteger
export function Integer(required: true): RequiredInteger
export function Integer(required = false): OptionalInteger | RequiredInteger {
  return required ? new RequiredInteger() : new OptionalInteger()
}
