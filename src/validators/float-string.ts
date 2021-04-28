import { validateString } from '..'
import { isValidType, ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotFloatStringFail, OutOfRangeFail, ValidationFailure, WrongLengthFail } from '../errors'

export function isFloatString(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: string
): value is string {
  const errors = validateFloatString(value, min, max, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateFloatString(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  context?: string
): ValidationFailure[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    return [new NotFloatStringFail(`Must be a string with a float`, value, context)]
  }
  if (value.length === 0) {
    return [new WrongLengthFail(`Must be a string with a float`, value, context)]
  }
  const float = parseFloat(value)
  if (typeof float !== 'number' || isNaN(float) || !isFinite(float)) {
    return [new NotFloatStringFail(`Must be a string with a float`, value, context)]
  }
  if (float < min || float > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max}`, value, context)]
  }
  return []
}

export abstract class FloatStringValidator<O = never> extends ValidatorBase<string | O> {
  private min: number
  private max: number

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorBaseOptions) {
    super(options)
    this.min = min
    this.max = max
    if (options?.optimize !== false) {
      this.optimize()
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'string'
    }
    const minStr = this.min !== Number.MIN_SAFE_INTEGER || this.max !== Number.MAX_SAFE_INTEGER ? `${this.min}` : ''
    const maxStr = this.max !== Number.MAX_SAFE_INTEGER ? `, ${this.max}` : ''
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${minStr}${maxStr}${optionsStr})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateFloatString(value, this.min, this.max, context)
  }
}

export class RequiredFloatString extends FloatStringValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalFloatString extends FloatStringValidator<undefined> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
