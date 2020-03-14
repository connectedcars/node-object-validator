import { RequiredError, ValidationErrorContext } from '../errors'

export function validateArray(value: number, context?: ValidationErrorContext<string>): Error | null {
  return null
}

export class RequiredArray {
  private type: 'RequiredArray' = 'RequiredArray'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateArray(value, context)
  }
}

export class OptionalArray {
  private type: 'OptionalArray' = 'OptionalArray'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateArray(value, context)
  }
}
