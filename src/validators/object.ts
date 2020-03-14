import { RequiredError, ValidationErrorContext } from '../errors'

export function validateObject<T>(value: T, context?: ValidationErrorContext<string>): Error | null {
  // TODO: Validate that something is an object
  return null
}

export class RequiredObject<T> {
  private type: 'RequiredObject' = 'RequiredObject'
  private obj: T

  public constructor(obj: T) {
    this.obj = obj
  }
  public validate(value: object, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateObject(value, context)
  }
}

export class OptionalObject<T> {
  private type: 'OptionalObject' = 'OptionalObject'
  private obj: T

  public constructor(obj: T) {
    this.obj = obj
  }

  public validate(value: T, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateObject(value, context)
  }
}

export function NestedObject<T>(obj: T, required?: false): OptionalObject<T>
export function NestedObject<T>(obj: T, required: true): RequiredObject<T>
export function NestedObject<T>(obj: T, required = false): OptionalObject<T> | RequiredObject<T> {
  return required ? new RequiredObject<T>(obj) : new OptionalObject<T>(obj)
}
