import { NotStringError, ValidationErrorContext, WrongLengthError } from '../../errors'

export function validateString(
  value: string,
  minLength = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext<string>
): Error | null {
  if (typeof value !== 'string') {
    return new NotStringError(`Must be a string (received "${value}")`, context)
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return new WrongLengthError(
      `Must contain between ${minLength} and ${maxLength} characters (received "${value}")`,
      context
    )
  }
  return null
}
