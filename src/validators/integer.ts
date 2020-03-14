import { RequiredError, ValidationErrorContext } from '../errors'

export function validateInteger(value: number, context?: ValidationErrorContext<string>): Error | null {
  return null
}

export class RequiredInteger {
  private type: 'RequiredInteger' = 'RequiredInteger'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateInteger(value, context)
  }
}

export class OptionalInteger {
  private type: 'OptionalInteger' = 'OptionalInteger'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateInteger(value, context)
  }
}
