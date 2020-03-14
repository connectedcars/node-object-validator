import { NotDateError, ValidationErrorContext } from '../../errors'

export function validateDate(value: Date, context?: ValidationErrorContext<string>): Error | null {
  if (!(value instanceof Date)) {
    return new NotDateError(`Must be a Date object`, context)
  }
  return null
}
