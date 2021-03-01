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
    return [new NotFloatStringFail(`Must be a string with a float (received "${value}")`)]
  }
  if (value.length === 0) {
    return [new WrongLengthFail(`Must be a string with a float (received "")`)]
  }
  const float = parseFloat(value)
  if (isNaN(float)) {
    return [new NotFloatStringFail(`Must be a string with a float (received "${value}")`, context)]
  }
  return validateFloat(float, min, max, context)
}

export class FloatStringValidator<O = never> extends ValidatorBase<number | O> {
  private min: number
  private max: number
  private required: boolean

  public constructor(min = 0, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super()
    this.min = min
    this.max = max
    const mergedOptions = { required: true, optimize: true, ...options }
    this.required = mergedOptions.required
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
    super(min, max, { ...options, required: true })
  }
}

export class OptionalFloatString extends FloatStringValidator<undefined | null> {
  private validatorType: 'OptionalFloatString' = 'OptionalFloatString'

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
