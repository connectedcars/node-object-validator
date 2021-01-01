import { isValidType, ValidatorBase, ValidatorOptions } from '../common'
import {
  NotIntegerStringFail,
  RequiredFail,
  ValidationErrorContext,
  ValidationFailure,
  WrongLengthFail
} from '../errors'
import { validateInteger } from './integer'
import { validateString } from './string'

export function validateIntegerString(
  value: unknown,
  min: number,
  max: number,
  context?: ValidationErrorContext
): ValidationFailure[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    return [new NotIntegerStringFail(`Must be a string with an integer (received "${value}")`)]
  }
  if (value.length === 0) {
    return [new WrongLengthFail(`Must be a string with an integer (received "")`)]
  }
  const int = parseFloat(value)
  if (int % 1 !== 0) {
    return [new NotIntegerStringFail(`Must be a string with an integer (received "${value}")`)]
  }
  if (isNaN(int)) {
    return [new NotIntegerStringFail(`Must be a string with an integer (received "${value}")`)]
  }
  return validateInteger(int, min, max, context)
}

export class IntegerStringValidator<O = never> extends ValidatorBase<string | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    options?: ValidatorOptions,
    required = true
  ) {
    super()
    this.min = min
    this.max = max
    this.required = required
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateIntegerString(value, this.min, this.max, context)
  }
}

export class RequiredIntegerString extends IntegerStringValidator {
  private validatorType: 'RequiredIntegerString' = 'RequiredIntegerString'
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options)
  }
}

export class OptionalIntegerString extends IntegerStringValidator<undefined | null> {
  private validatorType: 'OptionalIntegerString' = 'OptionalIntegerString'
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options, false)
  }
}
