import { NotRfc3339Error, ValidationErrorContext } from '../../errors'

const pattern = /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/

export function validateDateTime(value: string, context?: ValidationErrorContext<string>): Error | null {
  if (!pattern.test(value)) {
    return new NotRfc3339Error(`Must be formatted as an RFC 3339 timestamp (received "${value}")`, context)
  }
  return null
}