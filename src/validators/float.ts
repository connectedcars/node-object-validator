import { ValidatorBase } from '../common'
import { NotFloatFail, OutOfRangeFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateFloat(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return [new NotFloatFail(`Must be a float (received "${value}")`, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max} (received "${value}")`, context)]
  }
  return []
}

export class FloatValidator<O = never> extends ValidatorBase<number | O> {
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
    return validateFloat(value, this.min, this.max, context)
  }
}

export class RequiredFloat extends FloatValidator {
  private validatorType: 'RequiredFloat' = 'RequiredFloat'

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super(min, max)
  }
}

export class OptionalFloat extends FloatValidator<undefined | null> {
  private validatorType: 'OptionalFloat' = 'OptionalFloat'

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER) {
    super(min, max, false)
  }
}

export function Float(min: number, max: number, required?: false): OptionalFloat
export function Float(min: number, max: number, required: true): RequiredFloat
export function Float(min = 0, max = Number.MAX_SAFE_INTEGER, required = false): OptionalFloat | RequiredFloat {
  return required ? new RequiredFloat(min, max) : new OptionalFloat(min, max)
}
