// XXX: This is a temporary solution until we support unions

import { validateInteger, validateIntegerString } from '..'
import { isValidType, ValidatorBase, ValidatorOptions } from '../common'
import { NotIntegerOrIntegerStringFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

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
  private required: boolean

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super()
    this.min = min
    this.max = max
    const mergedOptions = { required: true, optimize: false, ...options }
    this.required = mergedOptions.required
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateIntegerOrIntegerString(value, this.min, this.max, context)
  }
}

export class RequiredIntegerOrIntegerString extends IntegerOrIntegerStringValidator {
  private validatorType: 'RequiredIntegerOrIntegerString' = 'RequiredIntegerOrIntegerString'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalIntegerOrIntegerString extends IntegerOrIntegerStringValidator<undefined | null> {
  private validatorType: 'OptionalIntegerString' = 'OptionalIntegerString'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
