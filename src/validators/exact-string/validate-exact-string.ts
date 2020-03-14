import { NotExactStringError, ValidationErrorContext } from '../../errors'

export function validateExactString(
  value: string,
  expectedStr: string,
  context?: ValidationErrorContext<string>
): Error | null {
  if (value !== expectedStr) {
    return new NotExactStringError(`Must strictly equal "${expectedStr}" (received "${value}")`, context)
  }
  return null
}
