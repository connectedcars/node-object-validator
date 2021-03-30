import { isValidType, ValidatorBase, ValidatorOptions } from '../common'
import { NotIntegerStringFail, ValidationErrorContext, ValidationFailure, WrongLengthFail } from '../errors'
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

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(options)
    this.min = min
    this.max = max
    if (options?.optimize) {
      this.optimize()
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    const minStr = this.min !== Number.MIN_SAFE_INTEGER || this.max !== Number.MAX_SAFE_INTEGER ? `${this.min}` : ''
    const maxStr = this.max !== Number.MAX_SAFE_INTEGER ? `, ${this.max}` : ''
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${minStr}${maxStr}${optionsStr})`
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
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
