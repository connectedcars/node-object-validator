import { RequiredError, ValidationErrorContext } from '../errors'

export function validateObject(value: number, context?: ValidationErrorContext<string>): Error | null {
  return null
}

export class RequiredObject {
  private type: 'RequiredObject' = 'RequiredObject'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateObject(value, context)
  }
}

export class OptionalObject {
  private type: 'OptionalObject' = 'OptionalObject'

  public validate(value: number, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateObject(value, context)
  }
}
