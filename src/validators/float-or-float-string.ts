// XXX: This is a temporary solution until we support unions

import { validateFloat, validateFloatString } from '..'
import { isValidType, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotFloatOrFloatStringFail, ValidationErrorContext, ValidationFailure } from '../errors'

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

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(options)
    this.min = min
    this.max = max
    if (options?.optimize) {
      this.optimize()
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'number | string'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    return validateFloatOrFloatString(value, this.min, this.max, context)
  }
}

export class RequiredFloatOrFloatString extends FloatOrFloatStringValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalFloatOrFloatString extends FloatOrFloatStringValidator<undefined | null> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
