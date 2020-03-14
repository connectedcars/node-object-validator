import { NotExactStringError, RequiredError, ValidationErrorContext } from '../errors'

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

export class RequiredExactString {
  private type: 'RequiredExactString' = 'RequiredExactString'

  public validate(value: string, expectedStr: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateExactString(value, expectedStr, context)
  }
}

export class OptionalExactString {
  private type: 'OptionalExactString' = 'OptionalExactString'

  public validate(value: string, expectedStr: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateExactString(value, expectedStr, context)
  }
}
