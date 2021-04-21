import { isValidType, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotIntegerStringFail, OutOfRangeFail, ValidationFailure, WrongLengthFail } from '../errors'
import { validateString } from './string'

export function validateIntegerString(value: unknown, min: number, max: number, context?: string): ValidationFailure[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    return [new NotIntegerStringFail(`Must be a string with an integer`, value, context)]
  }
  if (value.length === 0) {
    return [new WrongLengthFail(`Must be a string with an integer`, value, context)]
  }
  const int = parseFloat(value)
  if (!Number.isInteger(int)) {
    return [new NotIntegerStringFail(`Must be a string with an integer`, value, context)]
  }
  if (int < min || int > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max}`, value, context)]
  }
  return []
}

export class IntegerStringValidator<O = never> extends ValidatorBase<string | O> {
  private min: number
  private max: number

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
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
    return validateIntegerString(value, this.min, this.max, context)
  }
}

export class RequiredIntegerString extends IntegerStringValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalIntegerString extends IntegerStringValidator<undefined | null> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
