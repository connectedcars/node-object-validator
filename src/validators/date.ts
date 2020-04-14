import { ValidatorBase } from '../common'
import { NotDateError, RequiredError, ValidationErrorContext } from '../errors'

export function validateDate(value: unknown, context?: ValidationErrorContext): Error[] {
  if (!(value instanceof Date)) {
    return [new NotDateError(`Must be a Date object`, context)]
  }
  return []
}

export class DateValidator<O = never> extends ValidatorBase<Date | O> {
  private required: boolean

  public constructor(required = true) {
    super()
    this.required = required
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return this.required ? [new RequiredError(`Is required`, context)] : []
    }
    return validateDate(value, context)
  }
}

export class RequiredDate extends DateValidator {
  private type: 'RequiredDate' = 'RequiredDate'
  public constructor() {
    super()
  }
}

export class OptionalDate extends DateValidator<null | undefined> {
  private type: 'OptionalDate' = 'OptionalDate'
  public constructor() {
    super(false)
  }
}

export function DateObject(required?: false): OptionalDate
export function DateObject(required: true): RequiredDate
export function DateObject(required = false): OptionalDate | RequiredDate {
  return required ? new RequiredDate() : new OptionalDate()
}
