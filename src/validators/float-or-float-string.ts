// XXX: This is a temporary solution until we support unions

import { validateFloat, validateFloatString } from '..'
import { isValidType, ValidatorBase, ValidatorOptions } from '../common'
import { NotFloatOrFloatStringFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateFloatOrFloatString(
  value: unknown,
  min: number,
  max: number,
  context?: ValidationErrorContext
): ValidationFailure[] {
  const floatError = validateFloat(value, min, max, context)
  if (!isValidType<number>(value, floatError)) {
    const floatStringError = validateFloatString(value, min, max, context)
    if (!isValidType<string>(value, floatStringError)) {
      if (min === Number.MIN_SAFE_INTEGER && max === Number.MAX_SAFE_INTEGER) {
        return [new NotFloatOrFloatStringFail(`Must be a float or a string formatted float (received "${value}")`)]
      }
      if (min === Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
        return [
          new NotFloatOrFloatStringFail(
            `Must be a float or a string formatted float smaller than ${max} (received "${value}")`
          )
        ]
      }
      if (min !== Number.MIN_SAFE_INTEGER && max === Number.MAX_SAFE_INTEGER) {
        return [
          new NotFloatOrFloatStringFail(
            `Must be a float or a string formatted float larger than ${min} (received "${value}")`
          )
        ]
      }
      if (min !== Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
        return [
          new NotFloatOrFloatStringFail(
            `Must be a float or a string formatted float between ${min} and ${max} (received "${value}")`
          )
        ]
      }
    }
    return [] //valid floatstring
  }
  return [] //valid float
}

export class FloatOrFloatStringValidator<O = never> extends ValidatorBase<string | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions, required = true) {
    super()
    this.required = required
    this.min = min
    this.max = max
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateFloatOrFloatString(value, this.min, this.max, context)
  }
}

export class RequiredFloatOrFloatString extends FloatOrFloatStringValidator {
  private validatorType: 'RequiredFloatOrFloatString' = 'RequiredFloatOrFloatString'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options)
  }
}

export class OptionalFloatOrFloatString extends FloatOrFloatStringValidator<undefined | null> {
  private validatorType: 'OptionalFloatString' = 'OptionalFloatString'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options, false)
  }
}

export function FloatOrFloatString(min: number, max: number, required: false): OptionalFloatOrFloatString
export function FloatOrFloatString(min: number, max: number, required?: true): RequiredFloatOrFloatString
export function FloatOrFloatString(
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  required = true
): OptionalFloatOrFloatString | RequiredFloatOrFloatString {
  return required ? new RequiredFloatOrFloatString(min, max) : new OptionalFloatOrFloatString(min, max)
}
