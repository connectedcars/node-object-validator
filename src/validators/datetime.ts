import { isValidType, ValidatorBase } from '../common'
import { NotRfc3339Error, RequiredError, ValidationErrorContext } from '../errors'
import { validateString } from './string'

const pattern = /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/

export function validateDateTime(value: unknown, context?: ValidationErrorContext): Error[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    return stringError
  }
  if (!pattern.test(value)) {
    return [new NotRfc3339Error(`Must be formatted as an RFC 3339 timestamp (received "${value}")`, context)]
  }
  return []
}

export class RequiredDateTime extends ValidatorBase<string> {
  private type: 'RequiredDateTime' = 'RequiredDateTime'

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return [new RequiredError(`Is required`, context)]
    }
    return validateDateTime(value, context)
  }
}

export class OptionalDateTime extends ValidatorBase<string | undefined | null> {
  private type: 'OptionalDateTime' = 'OptionalDateTime'

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return []
    }
    return validateDateTime(value, context)
  }
}

export function DateTime(required?: false): OptionalDateTime
export function DateTime(required: true): RequiredDateTime
export function DateTime(required = false): OptionalDateTime | RequiredDateTime {
  return required ? new RequiredDateTime() : new OptionalDateTime()
}
