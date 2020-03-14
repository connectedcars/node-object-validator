import { RequiredError, ValidationErrorContext } from '../errors'

export function validateRegex(value: number, context?: ValidationErrorContext<string>): Error | null {
  return null
}

export class RequiredRegex {
  private type: 'RequiredRegex' = 'RequiredRegex'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateRegex(value, context)
  }
}

export class OptionalRegex {
  private type: 'OptionalRegex' = 'OptionalRegex'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateRegex(value, context)
  }
}
