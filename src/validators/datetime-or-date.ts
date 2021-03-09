// XXX: This is a temporary solution until we support unions

import { validateDate, validateDateTime } from '..'
import { isValidType, ValidatorBase, ValidatorOptions } from '../common'
import { NotDatetimeOrDateFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateDateTimeOrDate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
  const dateError = validateDate(value, context)
  if (!isValidType<Date>(value, dateError)) {
    const dateTimeError = validateDateTime(value, context)
    if (!isValidType<string>(value, dateTimeError)) {
      return [
        new NotDatetimeOrDateFail(
          `Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "${value}")`
        )
      ]
    }
    return [] //valid datetime
  }
  return [] //valid Date
}

export class DateTimeOrDateValidator<O = never> extends ValidatorBase<string | O> {
  public constructor(options?: ValidatorOptions) {
    super(options)
    if (options?.optimize) {
      this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateDateTimeOrDate(value, context)
  }
}

export class RequiredDateTimeOrDate extends DateTimeOrDateValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalDateTimeOrDate extends DateTimeOrDateValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
