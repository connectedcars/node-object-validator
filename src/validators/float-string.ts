import { validateFloat, validateString } from '..'
import { isValidType, ValidatorBase, ValidatorOptions } from '../common'
import { NotFloatStringFail, RequiredFail, ValidationErrorContext, ValidationFailure, WrongLengthFail } from '../errors'

export function validateFloatString(
  value: unknown,
  min: number,
  max: number,
  context?: ValidationErrorContext
): ValidationFailure[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    if (typeof value === 'number') {
      return validateFloat(value, min, max, context)
    }
    return [new NotFloatStringFail(`Must be an float or a string with an float (received "${value}")`)]
  }
  if (value.length === 0) {
    return [new WrongLengthFail(`Must be an float or a string with an float (received "")`)]
  }
  const float = parseFloat(value)
  if (isNaN(float)) {
    return [new NotFloatStringFail(`Must be an float or a string with an float (received "${value}")`, context)]
  }
  return validateFloat(float, min, max, context)
}

export class FloatStringValidator<O = never> extends ValidatorBase<number | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions, required = true) {
    super()
    this.min = min
    this.max = max
    this.required = required
    if (options?.optimize) {
      //TODO: get optimize working
      //this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateFloatString(value, this.min, this.max, context)
  }
}

export class RequiredFloatString extends FloatStringValidator {
  private validatorType: 'RequiredFloatString' = 'RequiredFloatString'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options)
  }
}

export class OptionalFloatString extends FloatStringValidator<undefined | null> {
  private validatorType: 'OptionalFloatString' = 'OptionalFloatString'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, options, false)
  }
}

export function FloatString(min: number, max: number, required: false): OptionalFloatString
export function FloatString(min: number, max: number, required?: true): RequiredFloatString
export function FloatString(
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  required = true
): OptionalFloatString | RequiredFloatString {
  return required ? new RequiredFloatString(min, max) : new OptionalFloatString(min, max)
}
