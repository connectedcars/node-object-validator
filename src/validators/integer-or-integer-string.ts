// XXX: This is a temporary solution until we support unions

import { validateInteger, validateIntegerString } from '..'
import { isValidType, ValidatorBase, ValidatorOptions } from '../common'
import { NotIntegerOrIntegerStringFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateIntegerOrIntegerString(
  value: unknown,
  min: number,
  max: number,
  context?: ValidationErrorContext
): ValidationFailure[] {
  const integerError = validateInteger(value, min, max, context)
  if (!isValidType<number>(value, integerError)) {
    const integerStringError = validateIntegerString(value, min, max, context)
    if (!isValidType<string>(value, integerStringError)) {
      if (min === Number.MIN_SAFE_INTEGER && max === Number.MAX_SAFE_INTEGER) {
        return [
          new NotIntegerOrIntegerStringFail(`Must be a integer or a string formatted integer (received "${value}")`)
        ]
      }
      if (min === Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
        return [
          new NotIntegerOrIntegerStringFail(
            `Must be a integer or a string formatted integer smaller than ${max} (received "${value}")`
          )
        ]
      }
      if (min !== Number.MIN_SAFE_INTEGER && max === Number.MAX_SAFE_INTEGER) {
        return [
          new NotIntegerOrIntegerStringFail(
            `Must be a integer or a string formatted integer larger than ${min} (received "${value}")`
          )
        ]
      }
      if (min !== Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
        return [
          new NotIntegerOrIntegerStringFail(
            `Must be a integer or a string formatted integer between ${min} and ${max} (received "${value}")`
          )
        ]
      }
    }
    return [] //valid integerstring
  }
  return [] //valid integer
}

export class IntegerOrIntegerStringValidator<O = never> extends ValidatorBase<string | O> {
  private min: number
  private max: number

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(options)
    this.min = min
    this.max = max
    if (options?.optimize) {
      this.optimize()
    }
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    return validateIntegerOrIntegerString(value, this.min, this.max, context)
  }
}

export class RequiredIntegerOrIntegerString extends IntegerOrIntegerStringValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalIntegerOrIntegerString extends IntegerOrIntegerStringValidator<undefined | null> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
