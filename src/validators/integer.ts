import { ValidatorBase } from '../common'
import { NotIntegerFail, OutOfRangeFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateInteger(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return [new NotIntegerFail(`Must be an integer (received "${value}")`, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max} (received "${value}")`, context)]
  }
  return []
}

export class IntegerValidator<O = never> extends ValidatorBase<number | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, required = true) {
    super()
    this.min = min
    this.max = max
    this.required = required
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateInteger(value, this.min, this.max, context)
  }
}

export class RequiredInteger extends IntegerValidator {
  private validatorType: 'RequiredInteger' = 'RequiredInteger'

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super(min, max)
  }
}

export class OptionalInteger extends IntegerValidator<undefined | null> {
  private validatorType: 'OptionalInteger' = 'OptionalInteger'

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super(min, max, false)
  }
}

export function Integer(min: number, max: number, required?: false): OptionalInteger
export function Integer(min: number, max: number, required: true): RequiredInteger
export function Integer(min = 0, max = Number.MAX_SAFE_INTEGER, required = false): OptionalInteger | RequiredInteger {
  return required ? new RequiredInteger(min, max) : new OptionalInteger(min, max)
}
