import { ValidatorBase } from '../common'
import { NotDateError, RequiredError, ValidationErrorContext } from '../errors'
import { Validator } from '../types'

export function validateDate(value: unknown, context?: ValidationErrorContext): Error | null {
  if (!(value instanceof Date)) {
    return new NotDateError(`Must be a Date object`, context)
  }
  return null
}

export class RequiredDate extends ValidatorBase implements Validator {
  private type: 'RequiredDate' = 'RequiredDate'

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateDate(value, context)
  }
}

export class OptionalDate extends ValidatorBase implements Validator {
  private type: 'OptionalDate' = 'OptionalDate'

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateDate(value, context)
  }
}

export function DateObject(required?: false): OptionalDate
export function DateObject(required: true): RequiredDate
export function DateObject(required = false): OptionalDate | RequiredDate {
  return required ? new RequiredDate() : new OptionalDate()
}
